import sql from 'mssql';

const poolPromise = new sql.ConnectionPool({
  user: 'root',                // Username
  password: 'Kilvish@420420', // Password
  server: '82.112.238.22',    // Remote SQL Server address
  database: 'kwlbooking',     // Database name
  options: {
    encrypt: false,           // Set to true if using Azure
    trustServerCertificate: true // Set to true if using self-signed certificate
  }
}).connect(); // Establish the connection pool

// Function to get a connection from the pool
const connection = () => {
  return poolPromise;
};

export default connection;
