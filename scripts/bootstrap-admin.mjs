import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const { DATABASE_URL, ADMIN_USERNAME = 'admin', ADMIN_PASSWORD = 'change_me' } = process.env

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })

async function main() {
  const client = await pool.connect()
  try {
    const username = ADMIN_USERNAME
    const password = ADMIN_PASSWORD

    const { rows } = await client.query('SELECT id FROM users WHERE username = $1', [username])
    if (rows.length > 0) {
      console.log('Admin user already exists')
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const insert = `
      INSERT INTO users (username, email, role, clearance_level, password_hash, is_active)
      VALUES ($1, $2, 'HQ', 'TOP_SECRET', $3, true)
      RETURNING id
    `
    const { rows: inserted } = await client.query(insert, [username, `${username}@cop.local`, passwordHash])
    console.log('Admin user created with id:', inserted[0].id)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})