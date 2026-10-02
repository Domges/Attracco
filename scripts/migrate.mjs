// Applica db/schema.sql al database indicato da DATABASE_URL.
import { readFile } from "node:fs/promises";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL non impostata");
  process.exit(1);
}
const sql = postgres(url, { max: 1 });
try {
  await sql.unsafe(await readFile(new URL("../db/schema.sql", import.meta.url), "utf8"));
  console.log("Schema applicato.");
} finally {
  await sql.end();
}
