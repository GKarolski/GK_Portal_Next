<?php
/**
 * GK Portal SaaS - Mailer Class
 * Wrapper for SMTP email sending.
 * Uses native PHP sockets to avoid external dependency capability issues in this environment,
 * or PHPMailer if available. For this MVP, we use a robust native SMTP class.
 */

class Mailer {
    private static $host = SMTP_HOST;
    private static $user = SMTP_USER;
    private static $pass = SMTP_PASS;
    private static $port = SMTP_PORT;

    /**
     * Sends an email using HTML template
     * @param string $to Recipient email
     * @param string $subject Email subject
     * @param string $templateName Filename in templates/ without extension
     * @param array $vars Key-value pairs to replace in template {{key}} -> value
     * @return bool True on success
     */
    public static function send($to, $subject, $templateName, $vars = []) {
        error_log("Mailer::send called for $to with template $templateName");
        $templatePath = __DIR__ . '/../../templates/' . $templateName . '.html';
        
        if (!file_exists($templatePath)) {
            error_log("Mailer Error: Template $templateName not found in $templatePath");
            return false;
        }

        $body = file_get_contents($templatePath);
        
        // Replace placeholders
        foreach ($vars as $key => $value) {
            $body = str_replace('{{' . $key . '}}', $value, $body);
        }

        // Try using native mail() with Base64 encoding for reliability and formatting
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8" . "\r\n";
        $headers .= "Content-Transfer-Encoding: base64" . "\r\n";
        $headers .= "From: " . MAIL_SENDER_NAME . " <" . MAIL_FROM . ">" . "\r\n";
        $headers .= "Reply-To: " . MAIL_FROM . "\r\n";
        $headers .= "X-Mailer: GK_SaaS_Mailer_v1";

        $bodyEncoded = chunk_split(base64_encode($body));

        if (mail($to, $subject, $bodyEncoded, $headers)) {
            return true;
        } else {
            error_log("Mail function failed, failing over to SMTP Socket...");
            return self::smtp_send($to, $subject, $body);
        }
    }

    private static function smtp_send($to, $subject, $content) {
        $timeout = 30;
        $localhost = $_SERVER['SERVER_NAME'];
        $newLine = "\r\n";
        $secure = SMTP_SECURE === 'ssl' ? 'ssl://' : ''; // tls handled via STARTTLS

        // Connect
        $socket = fsockopen($secure . self::$host, self::$port, $errno, $errstr, $timeout);
        if (!$socket) {
            error_log("SMTP Connect Failed: $errstr ($errno)");
            return false;
        }
        
        $log = [];
        $log[] = fgets($socket, 515);

        // HELO
        fputs($socket, "HELO $localhost" . $newLine);
        $log[] = fgets($socket, 515);

        // AUTH (Plain) - simple implementation
        if (SMTP_SECURE === 'tls') {
            fputs($socket, "STARTTLS" . $newLine);
            $log[] = fgets($socket, 515);
            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            fputs($socket, "HELO $localhost" . $newLine);
            $log[] = fgets($socket, 515);
        }

        fputs($socket, "AUTH LOGIN" . $newLine);
        $log[] = fgets($socket, 515);
        fputs($socket, base64_encode(self::$user) . $newLine);
        $log[] = fgets($socket, 515);
        fputs($socket, base64_encode(self::$pass) . $newLine);
        $log[] = fgets($socket, 515);

        // Mail From
        fputs($socket, "MAIL FROM: <" . self::$user . ">" . $newLine); // Use SMTP User as Sender for Auth logic
        $log[] = fgets($socket, 515);

        // Rcpt To
        fputs($socket, "RCPT TO: <$to>" . $newLine);
        $log[] = fgets($socket, 515);

        // Data
        fputs($socket, "DATA" . $newLine);
        $log[] = fgets($socket, 515);

        // Headers
        $headers = "MIME-Version: 1.0" . $newLine;
        $headers .= "Content-type: text/html; charset=UTF-8" . $newLine;
        $headers .= "Content-Transfer-Encoding: base64" . $newLine;
        $headers .= "From: " . MAIL_SENDER_NAME . " <" . self::$user . ">" . $newLine;
        $headers .= "To: <$to>" . $newLine;
        $headers .= "Subject: $subject" . $newLine;
        $headers .= "Date: " . date("r") . $newLine; // Add Date Header
        $headers .= "Message-ID: <" . time() . "-" . md5(self::$user . $to) . "@" . $localhost . ">" . $newLine; // Add Message-ID

        // Base64 Encode Body to prevent Line Length Limits (critical for HTML)
        $bodyEncoded = chunk_split(base64_encode($content));

        fputs($socket, $headers . $newLine . $bodyEncoded . $newLine . "." . $newLine);
        $response = fgets($socket, 515);
        $log[] = $response;

        // Quit
        fputs($socket, "QUIT" . $newLine);
        fclose($socket);

        if (strpos($response, '250') === false) {
             error_log("SMTP Error: " . json_encode($log));
             return false;
        }

        return true;
    }
}
?>
