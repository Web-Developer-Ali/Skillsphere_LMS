import { Pool } from "pg";

const config = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
};

let pool: Pool | null = null;

function createPool(): Pool {
  if (!pool) {
    pool = new Pool(config);
    pool.on("connect", () => console.log("✅ PostgreSQL pool created."));
    pool.on("error", (err) => {
      console.error("❌ Unexpected PG error:", err);
      // You might want to restart the server or alert devs
    });
  }
  return pool;
}

export default function connectToDatabase(): Pool {
  return createPool();
}
