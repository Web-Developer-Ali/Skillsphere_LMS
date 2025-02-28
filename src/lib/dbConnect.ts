import sql from "mssql";

type ConnectionObject = {
  pool?: sql.ConnectionPool;
  isConnected?: boolean;
};

const connection: ConnectionObject = {};

// Use this configuration to connect to the database
const dbConfig = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "your_database",
  user: process.env.DB_USER || "your_user",
  password: process.env.DB_PASSWORD || "your_password",
  options: {
    encrypt: process.env.DB_ENCRYPT === "true", // Use encryption for Azure
    trustServerCertificate: process.env.DB_TRUST_CERT === "true", // Ensure a secure connection
  },
};

// Function to establish a connection
async function connectToDatabase(): Promise<sql.ConnectionPool> {
  if (connection.pool && connection.isConnected) {
    return connection.pool; // Return existing connection if already connected
  }

  try {
    connection.pool = await sql.connect(dbConfig);
    connection.isConnected = true;
    console.log("SQL Database connected successfully.");
    return connection.pool;
  } catch (error) {
    console.error("Error connecting to the SQL Database:", error);
    throw new Error("Database connection failed.");
  }
}

// Export the connection function
export default connectToDatabase;
