import jwt from 'jsonwebtoken';
import { connection, sql } from '../config.js'; // Use mssql's connection pool

const isAuthenticatedUserGuest = async (req, res, next) => {
  // Print the entire req.body to debug
  console.log("Full body -->", req.body);
  const { user_type } = req.body; // Assuming 'type' is sent in the request body
  console.log("User type -->", user_type);

  // If 'user_type' is 'Guest', skip token verification
  if (user_type === 'Guest') {
    console.log("Guest mode");
    return next();
  }

  // If 'user_type' is not 'Guest', proceed with token verification
  let token;
  if (req.header('Authorization')) {
    token = req.header('Authorization').replace('Bearer ', '');
  }

  // Check if token exists
  if (!token) {
    return res.status(200).json({ result: 'Access denied. No token provided.' });
  }

  // Establish a connection using the pool
  const pool = await connection();
  console.log("JWT token from user", token);

  try {
    // Verify the token
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    // Query the database for the user data using the decoded id
    const result = await pool.request()
      .input('user_id', sql.Int, decodedData.id)
      .query('SELECT * FROM tbl_user WHERE user_id = @user_id');

    const user = result.recordset[0];

    // If the user is not found
    if (!user) {
      return res.status(404).json({ result: 'User not found' });
    }

    // Attach the user data to the request object
    req.user = user;

    // Continue to the next middleware
    next();

  } catch (error) {
    console.error('Error during user authentication:', error);
    res.status(400).json({ result: 'Session Timeout or Invalid Token' });
  } finally {
    // Optionally, release the connection to the pool
    pool.close(); // To close the connection explicitly
  }
};


