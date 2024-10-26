import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  //password: 'Kil@123456',
  port: '3306',
  database: 'car_rental',
  waitForConnections: true, // Enable queueing
  connectionLimit: 100, // Set an appropriate limit
});

const connection = () => {
  return pool.getConnection();
};

export default connection;
