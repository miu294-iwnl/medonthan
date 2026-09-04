import crypto from "crypto";
import prisma from "../lib/prisma.js";

/**
 * Hash password using native scrypt with a 16-byte cryptographically secure salt
 * Format returned: salt:hash (both in hex)
 */
export function hashPassword(password) {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify plaintext password against stored salt:hash string
 */
export function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== "string" || !storedHash.includes(":")) {
    return false;
  }
  try {
    const [salt, hash] = storedHash.split(":");
    const testHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(testHash, "hex"));
  } catch (err) {
    console.error("Password verification error:", err);
    return false;
  }
}

/**
 * Create a stateless HMAC-signed authentication token with timestamp
 * Token format: timestamp.signature
 */
export function createAuthToken(storedHash) {
  const timestamp = Date.now();
  const signature = crypto
    .createHmac("sha256", storedHash)
    .update(String(timestamp))
    .digest("hex");
  return `${timestamp}.${signature}`;
}

/**
 * Verify an HMAC authentication token against the stored password hash
 * Valid for 30 days
 */
export function verifyAuthToken(token, storedHash) {
  if (!token || typeof token !== "string" || !token.includes(".") || !storedHash) {
    return false;
  }
  try {
    const [timestampStr, signature] = token.split(".");
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    // Token expires after 30 days
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > THIRTY_DAYS_MS || Date.now() < timestamp - 60000) {
      return false;
    }

    const expectedSig = crypto
      .createHmac("sha256", storedHash)
      .update(String(timestamp))
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSig, "hex")
    );
  } catch (err) {
    return false;
  }
}

/**
 * Ensure table exists in PostgreSQL (fallback if prisma generate/push was not run yet)
 */
async function ensureAuthTableExists() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AdminAuth" (
        "id" TEXT PRIMARY KEY DEFAULT 'admin_single_key',
        "password" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {
    // Database might not be connected or table already exists
  }
}

/**
 * Retrieve the stored password hash from the database
 */
export async function getStoredAdminPassword() {
  await ensureAuthTableExists();

  // Try standard Prisma client model
  try {
    if (prisma.adminAuth) {
      const record = await prisma.adminAuth.findFirst();
      if (record && record.password) return record.password;
    }
  } catch (e) {}

  // Fallback to raw query
  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT password FROM "AdminAuth" LIMIT 1`);
    if (rows && rows.length > 0 && rows[0].password) {
      return rows[0].password;
    }
  } catch (e) {}

  // Check if ADMIN_PASSWORD is provided in .env to auto-seed
  const envPassword = process.env.ADMIN_PASSWORD;
  if (envPassword && envPassword.trim()) {
    try {
      const hashed = hashPassword(envPassword.trim());
      await saveAdminPassword(hashed);
      return hashed;
    } catch (e) {
      console.warn("Could not auto-seed admin password from .env:", e.message);
    }
  }

  return null;
}

/**
 * Save or update the hashed admin password in the database
 */
export async function saveAdminPassword(hashedPassword) {
  await ensureAuthTableExists();

  // Try standard Prisma client model
  try {
    if (prisma.adminAuth) {
      const record = await prisma.adminAuth.upsert({
        where: { id: "admin_single_key" },
        update: { password: hashedPassword },
        create: { id: "admin_single_key", password: hashedPassword },
      });
      return record;
    }
  } catch (e) {}

  // Fallback to raw query
  try {
    const existing = await prisma.$queryRawUnsafe(`SELECT id FROM "AdminAuth" WHERE id = 'admin_single_key' LIMIT 1`);
    if (existing && existing.length > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE "AdminAuth" SET "password" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = 'admin_single_key'`,
        hashedPassword
      );
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "AdminAuth" ("id", "password", "createdAt", "updatedAt") VALUES ('admin_single_key', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        hashedPassword
      );
    }
    return true;
  } catch (err) {
    console.error("Failed to save admin password in database:", err);
    throw err;
  }
}
