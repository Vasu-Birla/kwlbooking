//import connection from "../config.js"

import { connection, sql } from '../config.js';
import {sendTokenUser} from "../utils/jwtToken.js";
import axios from 'axios';




const home = async (req, res, next) => {
  const pool = await connection();
  const transaction = new sql.Transaction(pool);

  try {

    const output = req.cookies.rental_msg || ''; 
    await transaction.begin(); // Begin the transaction

  
    const request = transaction.request();
    // await request.query('INSERT INTO some_table (column) VALUES (value)'); // Example query


    // If everything is fine, commit the transaction
    await transaction.commit();

    res.render('index', { output: output });
    
  } catch (error) {
    // If any error occurs, rollback the transaction
    if (transaction) {
      await transaction.rollback();
    }
    console.error('Error:', error);
    res.render('kil500', { output: `${error}` });
  } finally {
    // Always close the pool connection to release resources
    if (pool) {
      pool.close();
    }
  }
};


 





const booking_availability = async (req, res, next) => {
  let pool;
  let transaction;

  try {
    pool = await connection(); // Establish database connection
    transaction = new sql.Transaction(pool); // Create a new transaction instance

    await transaction.begin(); // Begin the transaction

    const request = transaction.request();
    const output = req.cookies.kwl_msg || '';

    // Example query to check or update booking availability (modify as needed)
    // await request.query('UPDATE bookings SET status = @status WHERE id = @bookingId');


    const username = '19354905';
    const password = 'b0a1d960446f9efab07df16c4c16b444';
    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    const response = await axios.get('https://acuityscheduling.com/api/v1/availability/dates?month=November&appointmentTypeID=18478069&timezone', {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    const availableDates = response.data.map(item => item.date);

    console.log("avilability ")


    await transaction.commit(); // Commit the transaction if successful

    res.render('booking_availability', { output });
  } catch (error) {
    // Rollback transaction if an error occurs
    if (transaction && transaction._aborted !== true) { 
      await transaction.rollback();
    }
    console.error('Error:', error);
    res.render('kil500', { output: `${error}` });
  } finally {
    // Always close the pool to release resources
    if (pool) {
      pool.close();
    }
  }
};




const dates_availability = async (req, res, next) => {


  try {
    const { appointmentTypeID, month } = req.query;

    if (!appointmentTypeID || !month) {
      return res.status(400).json({ error: 'appointmentTypeID and month are required' });
    }

    const response = await axios.get(
      `https://acuityscheduling.com/api/v1/availability/dates?month=${month}&appointmentTypeID=${appointmentTypeID}&timezone=`,
      {
        auth: {
          username: '19354905',
          password: 'b0a1d960446f9efab07df16c4c16b444'
        }
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    res.render('kil500', { output: `${error}` });
  }
};





const viewBookings = async (req, res, next) => {
  const pool = await connection();
  const transaction = new sql.Transaction(pool);
  const output = req.cookies.kwl_msg || '';

  try {
    await transaction.begin(); // Begin the transaction

    const request = transaction.request();
    
    // Example query to check or update booking availability (modify as needed)
    // await request.query('UPDATE bookings SET status = @status WHERE id = @bookingId');

    // Commit the transaction if everything is successful
    await transaction.commit();

    res.render('viewBookings', { output: output });
  } catch (error) {
    // Rollback if an error occurs
    if (transaction) {
      await transaction.rollback();
    }
    console.error('Error:', error);
    res.render('kil500', { output: `${error}` });
  } finally {
    // Always close the pool to release resources
    if (pool) {
      pool.close();
    }
  }
};








const book = async(req,res,next)=>{

    res.render('book')
 }







 //============================  User Login Start =============================================


 const getLoginOtp = async (req, res, next) => {
  console.log("sending OTP")
  let pool;
  let transaction;
  const { email } = req.body;

  try {
    pool = await connection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes from now

    // Check if email exists in tbl_bookings
    const userResult = await transaction.request().query(`
      SELECT COUNT(*) AS count FROM tbl_bookings WHERE user_email = '${email}'
    `);
    const emailExists = userResult.recordset[0].count > 0;

    if (emailExists) {
      // Check if OTP entry exists
      const otpCheckResult = await transaction.request().query(`
        SELECT COUNT(*) AS count FROM tbl_login_otp WHERE email = '${email}'
      `);
      const otpExists = otpCheckResult.recordset[0].count > 0;

      if (otpExists) {
        // Update existing OTP
        await transaction.request().query(`
          UPDATE tbl_login_otp 
          SET otp = '${otp}', expires_at = '${expiresAt.toISOString()}' 
          WHERE email = '${email}'
        `);
      } else {
        // Insert new OTP record
        await transaction.request().query(`
          INSERT INTO tbl_login_otp (email, otp, expires_at) 
          VALUES ('${email}', '${otp}', '${expiresAt.toISOString()}')
        `);
      }

      //await sendWelcomeMsg(email, otp);
      await transaction.commit();

      return res.status(200).json({ msg: true, exists: true, otp });
    } else {
      await transaction.commit();
      return res.status(200).json({ msg: true, exists: false });
    }
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("error ->", error.message);
    res.render('kil500', { output: `${error}` });
  } finally {
    if (pool) pool.close();
  }
};



const getLoginOtpWithReqInput = async (req, res, next) => {
  let pool;
  let transaction;
  const { email } = req.body;

  try {
    pool = await connection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const request = new sql.Request(transaction);

    // Define OTP and expiration time
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000);

    // Set input parameters for MSSQL
    request.input('email', sql.VarChar, email);
    request.input('otp', sql.VarChar, otp);
    request.input('expiresAt', sql.DateTime, expiresAt);

    // Check if email exists in tbl_bookings
    const userResult = await request.query('SELECT COUNT(*) AS count FROM tbl_bookings WHERE user_email = @email');
    const emailExists = userResult.recordset[0].count > 0;

    if (emailExists) {
      // Check if an OTP entry exists for this email
      const otpCheckResult = await request.query('SELECT COUNT(*) AS count FROM tbl_login_otp WHERE email = @email');
      const otpExists = otpCheckResult.recordset[0].count > 0;

      if (otpExists) {
        // Update existing OTP record
        await request.query(`
          UPDATE tbl_login_otp 
          SET otp = @otp, expires_at = @expiresAt 
          WHERE email = @email
        `);
      } else {
        // Insert new OTP record
        await request.query(`
          INSERT INTO tbl_login_otp (email, otp, expires_at) 
          VALUES (@email, @otp, @expiresAt)
        `);
      }

     // await sendWelcomeMsg(email, otp);
      await transaction.commit();

      return res.status(200).json({ msg: true, exists: true, otp });
    } else {
      await transaction.commit();
      return res.status(200).json({ msg: true, exists: false });
    }
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("error ->", error.message);
    res.render('kil500', { output: `${error}` });
  } finally {
    if (pool) pool.close();
  }
};




const verifyLoginOtp = async (req, res, next) => {
  const { email, otp } = req.body;
  let pool;

  try {
    pool = await connection();
    const request = new sql.Request(pool);
    request.input('email', sql.VarChar, email);
    request.input('otp', sql.VarChar, otp);

    // Check if OTP is valid and not expired
    const result = await request.query(
      'SELECT * FROM tbl_login_otp WHERE email = @email AND otp = @otp AND expires_at > GETDATE()'
    );

    if (result.recordset.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // OTP is valid, remove it from the database
    await request.query('DELETE FROM tbl_login_otp WHERE email = @email');

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    if (pool) pool.close(); // Close the pool
  }
};




const login = async (req, res, next) => {
  let pool;
  let transaction;
  const { email, otp } = req.body;

  try {
    pool = await connection(); // Connect to MSSQL
    transaction = new sql.Transaction(pool); // Create transaction
    await transaction.begin(); // Begin transaction

    const request = new sql.Request(transaction);
    request.input('email', sql.VarChar, email);

    // Fetch user details from tbl_bookings
    const userResult = await request.query('SELECT * FROM tbl_bookings WHERE user_email = @email');

    if (userResult.recordset.length === 0) {
      // Email not registered
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Email not registered' });
    }

    // User exists, send token
    const user = userResult.recordset[0];
    sendTokenUser(user, 200, res);

    await transaction.commit(); // Commit the transaction if successful
  } catch (error) {
    if (transaction) await transaction.rollback(); // Rollback transaction on error
    console.error("error ->", error.message);
    res.render('kil500', { output: 'Internal Server Error' });
  } finally {
    if (pool) pool.close(); // Close the connection pool
  }
};



const logout = async (req, res) => {
  try {
    res.cookie("User_kwl_token", null, {
      expires: new Date(Date.now()),
      httpOnly: true
    });
    res.redirect('/');
  } catch (error) {
    console.error('Error logging out admin:', error);
    res.render('kil500', { output: `${error}` });
  }
};




 //============================== User Login End ==============================================



//--------------------- Export Start ------------------------------------------
export { home , book , booking_availability , viewBookings , getLoginOtp ,verifyLoginOtp   , login , logout ,
  dates_availability

 }

