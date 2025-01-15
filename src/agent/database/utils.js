import { SqliteDatabaseAdapter } from "@elizaos/adapter-sqlite";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabaseAdapter() {
  const dbDir = path.join(__dirname, "../../db");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const databaseAdapter = new SqliteDatabaseAdapter(new Database(path.resolve(dbDir, "db.sqlite")));
  await databaseAdapter.init();
  return databaseAdapter;
}
