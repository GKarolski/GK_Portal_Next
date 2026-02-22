<?php
// Script to upload and parse PDF using Smalot
// Usage: POST /api/upload_pdf.php
// Key: file

require_once 'config.php';

header("Content-Type: application/json; charset=UTF-8");

// Auth check — only logged-in users can parse PDFs
if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    die(json_encode(['error' => 'Wymagane zalogowanie.']));
}

// Check if vendor autoload exists
$autoloadPath = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    echo json_encode(['error' => 'Biblioteka PDF Parser nie jest zainstalowana. Uruchom composer install.']);
    exit;
}
require $autoloadPath;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Only POST allowed']);
    exit;
}

if (!isset($_FILES['file'])) {
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['error' => 'Upload error: ' . $file['error']]);
    exit;
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if ($ext !== 'pdf') {
    echo json_encode(['error' => 'Only PDF files allowed']);
    exit;
}

try {
    $parser = new \Smalot\PdfParser\Parser();
    $pdf = $parser->parseFile($file['tmp_name']);
    $text = $pdf->getText();
    
    // Save file if needed, or just return text
    // For now returning text
    echo json_encode([
        'success' => true,
        'filename' => $file['name'],
        'content' => $text,
        'metadata' => $pdf->getDetails()
    ]);

} catch (Exception $e) {
    error_log('PDF Parser Error: ' . $e->getMessage());
    echo json_encode(['error' => 'Błąd parsowania pliku PDF.']);
}
?>
