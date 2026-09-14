import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:8080,http://127.0.0.1:8080,http://lagrafejournal.com')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'lagrafejournal@protonmail.com',
  },
  siteUrl: process.env.SITE_URL || 'http://localhost:8080',
  newsletterMaxSubscribers: parseInt(process.env.NEWSLETTER_MAX || '500', 10),
  pg: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    user: process.env.PG_USER || 'agrafe',
    password: process.env.PG_PASSWORD || 'agrafe',
    database: process.env.PG_DATABASE || 'agrafe',
  },
  usePostgres: process.env.USE_POSTGRES === 'true',
};
