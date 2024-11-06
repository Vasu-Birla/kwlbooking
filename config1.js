import sql from 'mssql';

const poolPromise = new sql.ConnectionPool({
  user: 'kw-dev-user',               // Username
  password: 'A#hgfvyewr6376423',     // Password
  server: '20.98.216.185',           // Server Address
  database: 'kw-dev',                // Database Name
  port: 2019,                        // Port Number
  options: {
    encrypt: false,                  // Set to true if using Azure
    trustServerCertificate: true     // Set to true if using self-signed certificate
  }
}).connect(); // Establish the connection pool

// Function to get a connection from the pool
const connection = () => {
  return poolPromise;
};

export default connection;
