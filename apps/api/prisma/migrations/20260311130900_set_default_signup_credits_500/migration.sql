-- Set default welcome credits for newly created users
ALTER TABLE "User"
ALTER COLUMN "credits" SET DEFAULT 500;
