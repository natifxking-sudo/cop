import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export async function query(text: string, params?: any[]) {
  const start = Date.now()
  const client = await pool.connect()

  try {
    const res = await client.query(text, params)
    const duration = Date.now() - start
    console.log("[v0] Database query executed", { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error("[v0] Database query error:", error)
    throw error
  } finally {
    client.release()
  }
}

export async function getClient() {
  return await pool.connect()
}

export const db = pool

export default pool
