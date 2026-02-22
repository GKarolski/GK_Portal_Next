-- URUCHOM TO W PHPMYADMIN (ZAKŁADKA SQL)

-- 1. Dodanie logo do organizacji
ALTER TABLE organizations ADD COLUMN logo LONGTEXT DEFAULT NULL;

-- 2. Dodanie koloru do użytkowników (pracowników)
ALTER TABLE users ADD COLUMN color VARCHAR(20) DEFAULT '#3b82f6';
