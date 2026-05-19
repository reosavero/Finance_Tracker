-- =====================================================
-- Personal Finance Tracker — Database Schema (MySQL)
-- Dioptimalkan untuk mahasiswa & anak kos
-- =====================================================

CREATE DATABASE IF NOT EXISTS finance_trackers
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE finance_trackers;

-- -----------------------------------------------------
-- Tabel: users
-- Menyimpan data pengguna aplikasi
-- -----------------------------------------------------
CREATE TABLE users (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  monthly_allowance DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Uang saku bulanan default',
  profile_photo VARCHAR(255) NULL COMMENT 'Path foto profil user',
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabel: categories
-- Kategori pengeluaran & pemasukan
-- Sudah termasuk default kategori untuk mahasiswa
-- -----------------------------------------------------
CREATE TABLE categories (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  icon        VARCHAR(50)   DEFAULT '💰' COMMENT 'Emoji atau icon identifier',
  color       VARCHAR(7)    DEFAULT '#6366f1' COMMENT 'Hex color untuk chart',
  type        ENUM('expense', 'income') NOT NULL DEFAULT 'expense',
  is_default  TINYINT(1)    DEFAULT 0 COMMENT 'Kategori bawaan sistem',
  user_id     INT           NULL COMMENT 'NULL = kategori global',
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_type (type),
  INDEX idx_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabel: transactions
-- Catatan semua transaksi pengeluaran & pemasukan
-- -----------------------------------------------------
CREATE TABLE transactions (
  id            INT             AUTO_INCREMENT PRIMARY KEY,
  user_id       INT             NOT NULL,
  category_id   INT             NOT NULL,
  type          ENUM('expense', 'income') NOT NULL,
  amount        DECIMAL(15,2)   NOT NULL,
  description   VARCHAR(255)    NULL COMMENT 'Keterangan opsional',
  transaction_date DATE         NOT NULL,
  created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user_date (user_id, transaction_date),
  INDEX idx_user_type (user_id, type),
  INDEX idx_category (category_id),
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabel: budgets
-- Limit anggaran per kategori per bulan
-- -----------------------------------------------------
CREATE TABLE budgets (
  id            INT             AUTO_INCREMENT PRIMARY KEY,
  user_id       INT             NOT NULL,
  category_id   INT             NOT NULL,
  budget_month  DATE            NOT NULL COMMENT 'Format: YYYY-MM-01 (hari pertama bulan)',
  limit_amount  DECIMAL(15,2)   NOT NULL,
  created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_user_cat_month (user_id, category_id, budget_month),
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabel: recurring_bills
-- Tagihan rutin bulanan (kos, listrik, internet, dll)
-- -----------------------------------------------------
CREATE TABLE recurring_bills (
  id            INT             AUTO_INCREMENT PRIMARY KEY,
  user_id       INT             NOT NULL,
  name          VARCHAR(150)    NOT NULL COMMENT 'Contoh: Sewa Kos, Token Listrik',
  amount        DECIMAL(15,2)   NOT NULL,
  due_day       TINYINT         NOT NULL COMMENT 'Tanggal jatuh tempo (1-31)',
  category_id   INT             NULL,
  is_active     TINYINT(1)      DEFAULT 1,
  last_paid_date DATE           NULL COMMENT 'Terakhir dibayar',
  created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user_active (user_id, is_active),
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- Data Seed: Kategori default untuk mahasiswa
-- =====================================================
INSERT INTO categories (name, icon, color, type, is_default) VALUES
  -- Pengeluaran
  ('Makan & Minum',      '🍜', '#ef4444', 'expense', 1),
  ('Transportasi',        '🚗', '#f97316', 'expense', 1),
  ('Hiburan',             '🎮', '#8b5cf6', 'expense', 1),
  ('Belanja',             '🛒', '#ec4899', 'expense', 1),
  ('Tagihan & Utilitas',  '💡', '#eab308', 'expense', 1),
  ('Pendidikan',          '📚', '#3b82f6', 'expense', 1),
  ('Kesehatan',           '💊', '#10b981', 'expense', 1),
  ('Lainnya',             '📦', '#6b7280', 'expense', 1),
  -- Pemasukan
  ('Uang Saku',           '💸', '#22c55e', 'income',  1),
  ('Gaji Part-time',      '💼', '#06b6d4', 'income',  1),
  ('Freelance',           '💻', '#a855f7', 'income',  1),
  ('Bonus/Hadiah',        '🎁', '#f43f5e', 'income',  1);
