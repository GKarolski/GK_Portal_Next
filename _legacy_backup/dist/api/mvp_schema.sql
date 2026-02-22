-- GK Portal - Pełny schemat bazy danych (Full Setup)
-- Ten plik tworzy wszystkie tabele niezbędne do działania aplikacji.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. USERS
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'CLIENT',
  `company_name` varchar(100) DEFAULT NULL,
  `organization_id` varchar(50) DEFAULT NULL,
  `role_in_org` varchar(20) DEFAULT 'MEMBER',
  `is_active` tinyint(1) DEFAULT 0,
  `activation_token` varchar(100) DEFAULT NULL,
  `reset_token` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `nip` varchar(20) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `avatar` longtext DEFAULT NULL,
  `color` varchar(20) DEFAULT '#3b82f6',
  `settings` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Domyślne konto admina (hasło: admin)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `company_name`, `is_active`) VALUES
('admin_01', 'Super Admin', 'admin', '$2y$10$8v8Mvh.X.J7R2G6r4B9S9u4j5e5q6r7t8y9u0i1o2p3a4s5d6f7g', 'ADMIN', 'GK Digital', 1);

-- 2. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS `organizations` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `vip_status` varchar(20) DEFAULT 'STANDARD',
  `logo` longtext DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TICKETS
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` varchar(50) NOT NULL,
  `client_id` varchar(50) NOT NULL,
  `client_name` varchar(100) NOT NULL,
  `organization_id` varchar(50) DEFAULT NULL,
  `created_by_user_id` varchar(50) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `category` varchar(50) NOT NULL,
  `url` varchar(255) DEFAULT '',
  `device_type` varchar(50) DEFAULT '',
  `platform` varchar(50) DEFAULT '',
  `budget` varchar(50) DEFAULT '',
  `description` text NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `priority` varchar(20) NOT NULL DEFAULT 'NORMAL',
  `price` decimal(10,2) DEFAULT 0.00,
  `billing_type` varchar(20) DEFAULT 'FIXED',
  `billing_month` varchar(7) DEFAULT NULL,
  `internal_notes` text,
  `public_notes` text,
  `admin_start_date` datetime DEFAULT NULL,
  `admin_deadline` datetime DEFAULT NULL,
  `error_date` datetime DEFAULT NULL,
  `folder_id` varchar(50) DEFAULT NULL,
  `is_hidden_from_client` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `subtasks_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '[]',
  `history_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '[]',
  `attachments_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '[]',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. FOLDERS
CREATE TABLE IF NOT EXISTS `folders` (
  `id` varchar(50) NOT NULL,
  `organization_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `icon` varchar(50) DEFAULT 'Folder',
  `color` varchar(20) DEFAULT '#3b82f6',
  `automation_rules` longtext DEFAULT '[]',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. WORK SESSIONS
CREATE TABLE IF NOT EXISTS `work_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL,
  `ticket_id` varchar(50) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `duration_seconds` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 0,
  `note` text,
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. SOPs (Standard Operating Procedures)
CREATE TABLE IF NOT EXISTS `sops` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `title` varchar(255) NOT NULL,
    `content` mediumtext NOT NULL,
    `category` varchar(50) DEFAULT 'GENERAL',
    `client_id` varchar(50) DEFAULT NULL,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. CLIENT DOCUMENTS (Context Vault)
CREATE TABLE IF NOT EXISTS `client_documents` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `client_id` varchar(50) NOT NULL,
    `filename` varchar(255) NOT NULL,
    `file_path` text NOT NULL,
    `parsed_content` mediumtext,
    `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
