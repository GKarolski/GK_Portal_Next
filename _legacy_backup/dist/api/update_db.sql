-- Skrypt aktualizujący bazę danych (Uruchom to w phpMyAdmin w zakładce SQL)

ALTER TABLE `users` ADD COLUMN `phone` varchar(50) DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN `nip` varchar(20) DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN `website` varchar(255) DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN `admin_notes` text DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN `avatar` longtext DEFAULT NULL;
ALTER TABLE `tickets` ADD COLUMN `error_date` datetime DEFAULT NULL;

-- FAZA 2 & 2.5 (SOP & Context Vault)
CREATE TABLE IF NOT EXISTS `sops` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `title` varchar(255) NOT NULL,
    `content` mediumtext NOT NULL,
    `category` varchar(50) DEFAULT 'GENERAL',
    `client_id` varchar(50) DEFAULT NULL,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `client_documents` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `client_id` varchar(50) NOT NULL,
    `filename` varchar(255) NOT NULL,
    `file_path` text NOT NULL,
    `parsed_content` mediumtext,
    `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Jeśli tabela sops już istnieje, dodaj tylko kolumnę client_id:
ALTER TABLE `sops` ADD COLUMN `client_id` varchar(50) DEFAULT NULL;
