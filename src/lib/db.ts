import mysql, { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var __englishEverydayPool: Pool | undefined;
}

function createPool() {
  return mysql.createPool({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "english_everyday",
    waitForConnections: true,
    connectionLimit: 10,
    timezone: "+08:00",
    dateStrings: true,
    multipleStatements: true,
  });
}

export function getPool() {
  if (!global.__englishEverydayPool) {
    global.__englishEverydayPool = createPool();
  }
  return global.__englishEverydayPool;
}

export type { ResultSetHeader, RowDataPacket };
