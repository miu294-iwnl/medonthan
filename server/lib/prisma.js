import { PrismaClient } from "@prisma/client";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const devDbPath = path.resolve(__dirname, "../prisma/dev.db");

let prisma;

if (process.env.DATABASE_URL) {
  prisma = new PrismaClient();
} else {
  console.log(`[Database] No DATABASE_URL found. Using local SQLite database: ${devDbPath}`);
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(devDbPath);

  // Initialize tables if not exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS "Game" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL,
      "studio" TEXT DEFAULT 'Unknown Studio',
      "publisher" TEXT DEFAULT 'Unknown Publisher',
      "genre" TEXT DEFAULT 'Action',
      "genreEn" TEXT,
      "year" INTEGER DEFAULT 2025,
      "hours" INTEGER DEFAULT 0,
      "platform" TEXT DEFAULT 'Steam',
      "priority" TEXT DEFAULT 'medium',
      "status" TEXT DEFAULT 'backlog',
      "cover" TEXT NOT NULL,
      "screenshots" TEXT DEFAULT '[]',
      "videos" TEXT DEFAULT '[]',
      "description" TEXT DEFAULT '',
      "descriptionEn" TEXT DEFAULT '',
      "releaseDate" TEXT DEFAULT 'TBA',
      "releaseDateEn" TEXT DEFAULT 'TBA',
      "reviewRecent" TEXT,
      "reviewAll" TEXT,
      "tags" TEXT DEFAULT '[]',
      "tagsEn" TEXT DEFAULT '[]',
      "addedAt" REAL NOT NULL,
      "price" INTEGER DEFAULT 0,
      "originalPrice" INTEGER DEFAULT 0,
      "discountPercent" INTEGER DEFAULT 0,
      "hoursPlayed" INTEGER DEFAULT 0,
      "isOwned" INTEGER DEFAULT 0,
      "isEarlyAccess" INTEGER DEFAULT 0,
      "lndLink" TEXT,
      "storeId" TEXT,
      "storeType" TEXT
    );
    CREATE TABLE IF NOT EXISTS "AdminAuth" (
      "id" TEXT PRIMARY KEY DEFAULT 'admin_single_key',
      "password" TEXT NOT NULL,
      "createdAt" REAL DEFAULT (strftime('%s', 'now') * 1000),
      "updatedAt" REAL DEFAULT (strftime('%s', 'now') * 1000)
    );
  `);

  function formatSqliteGame(r) {
    if (!r) return null;
    return {
      ...r,
      isOwned: Boolean(r.isOwned),
      isEarlyAccess: Boolean(r.isEarlyAccess),
    };
  }

  prisma = {
    game: {
      async count() {
        const row = db.prepare('SELECT count(*) as c FROM "Game"').get();
        return row ? Number(row.c) : 0;
      },
      async findMany(args = {}) {
        let sql = 'SELECT * FROM "Game"';
        const params = [];
        if (args.where) {
          const conds = [];
          if (args.where.OR && Array.isArray(args.where.OR)) {
            const orConds = [];
            for (const item of args.where.OR) {
              const k = Object.keys(item)[0];
              orConds.push(`"${k}" = ?`);
              params.push(item[k]);
            }
            if (orConds.length > 0) {
              conds.push(`(${orConds.join(" OR ")})`);
            }
          }
          if (args.where.id) {
            conds.push('"id" = ?');
            params.push(args.where.id);
          }
          if (conds.length > 0) {
            sql += ` WHERE ${conds.join(" AND ")}`;
          }
        }
        if (args.orderBy) {
          const col = Object.keys(args.orderBy)[0];
          const dir = String(args.orderBy[col]).toUpperCase();
          sql += ` ORDER BY "${col}" ${dir}`;
        }
        const rows = db.prepare(sql).all(...params);
        return rows.map(formatSqliteGame);
      },
      async findUnique({ where }) {
        const row = db.prepare('SELECT * FROM "Game" WHERE "id" = ?').get(where.id);
        return formatSqliteGame(row);
      },
      async create({ data }) {
        const id = data.id || crypto.randomUUID();
        const record = { ...data, id };
        const keys = Object.keys(record);
        const placeholders = keys.map(() => "?").join(", ");
        const cols = keys.map((k) => `"${k}"`).join(", ");
        const values = keys.map((k) => {
          const v = record[k];
          if (typeof v === "boolean") return v ? 1 : 0;
          return v ?? null;
        });
        db.prepare(`INSERT INTO "Game" (${cols}) VALUES (${placeholders})`).run(...values);
        return formatSqliteGame(record);
      },
      async update({ where, data }) {
        const existing = await this.findUnique({ where });
        if (!existing) throw new Error("Record not found");
        const keys = Object.keys(data);
        if (keys.length === 0) return existing;
        const setClauses = keys.map((k) => `"${k}" = ?`).join(", ");
        const values = keys.map((k) => {
          const v = data[k];
          if (typeof v === "boolean") return v ? 1 : 0;
          return v ?? null;
        });
        values.push(where.id);
        db.prepare(`UPDATE "Game" SET ${setClauses} WHERE "id" = ?`).run(...values);
        return await this.findUnique({ where });
      },
      async delete({ where }) {
        const existing = await this.findUnique({ where });
        db.prepare('DELETE FROM "Game" WHERE "id" = ?').run(where.id);
        return existing;
      },
      async createMany({ data }) {
        for (const item of data) {
          await this.create({ data: item });
        }
        return { count: data.length };
      },
    },
    adminAuth: {
      async findFirst() {
        const row = db.prepare('SELECT * FROM "AdminAuth" LIMIT 1').get();
        return row || null;
      },
      async upsert({ where, update, create }) {
        const targetId = where?.id || "admin_single_key";
        const existing = db.prepare('SELECT * FROM "AdminAuth" WHERE "id" = ?').get(targetId);
        if (existing) {
          db.prepare('UPDATE "AdminAuth" SET "password" = ?, "updatedAt" = ? WHERE "id" = ?')
            .run(update.password, Date.now(), targetId);
        } else {
          db.prepare('INSERT INTO "AdminAuth" ("id", "password", "createdAt", "updatedAt") VALUES (?, ?, ?, ?)')
            .run(create?.id || targetId, create?.password || update?.password, Date.now(), Date.now());
        }
        return this.findFirst();
      },
    },
    async $executeRawUnsafe(sql, ...args) {
      try {
        db.prepare(sql).run(...args);
      } catch (e) {}
    },
    async $queryRawUnsafe(sql, ...args) {
      try {
        return db.prepare(sql).all(...args);
      } catch (e) {
        return [];
      }
    },
  };
}

export default prisma;

