-- L'Agrafe PostgreSQL schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mail TEXT UNIQUE NOT NULL,
  hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'contributor',
  profile_slug TEXT UNIQUE,
  bio TEXT DEFAULT '',
  avatar TEXT,
  mail_check BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rubriques (
  id TEXT PRIMARY KEY,
  rubrique TEXT NOT NULL,
  description TEXT,
  rub_route TEXT,
  information TEXT,
  nombre_sec_min INT DEFAULT 0,
  nombre_sec_max INT DEFAULT 0,
  nombre_articles INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS dossiers (
  id TEXT PRIMARY KEY,
  titre TEXT NOT NULL,
  description TEXT,
  statut TEXT NOT NULL DEFAULT 'en_cours',
  rubrique_id TEXT REFERENCES rubriques(id) ON DELETE SET NULL,
  featured BOOLEAN DEFAULT false,
  ordre INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  titre_front TEXT NOT NULL,
  description TEXT,
  image_logo TEXT,
  path TEXT,
  auteur TEXT,
  numero_paru TEXT,
  date TEXT,
  created_at TEXT,
  published_at TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  private BOOLEAN DEFAULT false,
  rubrique_id TEXT REFERENCES rubriques(id) ON DELETE SET NULL,
  dossier_id TEXT REFERENCES dossiers(id) ON DELETE SET NULL,
  mis_en_ligne TEXT,
  rang INT DEFAULT 0,
  lectures INT DEFAULT 0,
  author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  content_path TEXT,
  file_type TEXT
);

CREATE TABLE IF NOT EXISTS archives (
  id TEXT PRIMARY KEY,
  titre TEXT,
  description TEXT,
  date TEXT,
  numero TEXT,
  private BOOLEAN DEFAULT false,
  cover_path TEXT,
  back_path TEXT,
  pdf_path TEXT,
  auteur_back TEXT,
  copyright_back TEXT,
  lectures INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  titre TEXT NOT NULL,
  description TEXT,
  date TEXT,
  private BOOLEAN DEFAULT true,
  image_path TEXT,
  is_banner BOOLEAN DEFAULT false,
  banner_text TEXT,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS focale (
  id TEXT PRIMARY KEY,
  titre TEXT,
  description TEXT,
  numero TEXT,
  auteur TEXT,
  technique TEXT,
  date TEXT,
  private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  name TEXT,
  mail TEXT UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT false,
  token TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  recipient_count INT DEFAULT 0,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pages (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lectures_history (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  lectures INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS proposer_articles (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_rubrique ON articles(rubrique_id);
CREATE INDEX IF NOT EXISTS idx_articles_dossier ON articles(dossier_id);
CREATE INDEX IF NOT EXISTS idx_articles_private ON articles(private);
CREATE INDEX IF NOT EXISTS idx_dossiers_statut ON dossiers(statut);
CREATE INDEX IF NOT EXISTS idx_news_banner ON news(is_banner, expires_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_verified ON newsletter_subscribers(verified);
