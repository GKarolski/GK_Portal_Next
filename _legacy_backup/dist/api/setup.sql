-- Baza danych dla GK Portal
-- Zaimportuj ten plik w phpMyAdmin

CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'CLIENT',
  `company_name` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 0,
  `activation_token` varchar(100) DEFAULT NULL,
  `reset_token` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `nip` varchar(20) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `avatar` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Domyślne konto admina (hasło: admin)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `company_name`, `is_active`) VALUES
('admin_01', 'Super Admin', 'admin', 'admin', 'ADMIN', 'GK Digital', 1);

CREATE TABLE IF NOT EXISTS `tickets` (
  `id` varchar(50) NOT NULL,
  `client_id` varchar(50) NOT NULL,
  `client_name` varchar(100) NOT NULL,
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
  `internal_notes` text,
  `admin_start_date` datetime DEFAULT NULL,
  `admin_deadline` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `subtasks_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '[]',
  `history_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '[]',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
