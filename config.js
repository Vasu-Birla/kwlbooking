// config.js

import sql from 'mssql';

// Configuration object for connecting to MSSQL
const config = {
  user: 'root', // replace with your MSSQL username
  password: 'Kilvish@420420', // replace with your MSSQL password
  server: '82.112.238.22', // replace with your MSSQL server address
  database: 'kwlbooking', // replace with your database name
  options: {
    encrypt: true, // Use encryption if your server supports it
    trustServerCertificate: true // change this to true if using a self-signed certificate
  }
};

// Create a function to connect to the database
const connection = async () => {
  try {
    const pool = await sql.connect(config);
   // console.log('Connected to MSSQL database successfully');
    return pool; // return pool object to use later for queries
  } catch (err) {
    console.error('Error connecting to MSSQL database:', err.message);
    throw err; // rethrow the error so the calling function knows it failed
  }
};

export { connection, sql };
