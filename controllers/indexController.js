//import connection from "../config.js"

import { connection, sql } from '../config.js';
import {sendTokenUser} from "../utils/jwtToken.js";
import axios from 'axios';
import moment from 'moment-timezone';


import { sendWelcomeMsg } from '../middleware/helper.js';




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


    // const username = '19354905';
    // const password = 'b0a1d960446f9efab07df16c4c16b444';
    // const auth = Buffer.from(`${username}:${password}`).toString('base64');

    // const response = await axios.get('https://acuityscheduling.com/api/v1/availability/dates?month=November&appointmentTypeID=18478069&timezone', {
    //   headers: {
    //     Authorization: `Basic ${auth}`
    //   }
    // });

    // const availableDates = response.data.map(item => item.date);

    // console.log("avilability ")


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




const dates_availability = async (req, res, next) => { console.log("............data availabilty",req.query)


  try {
    const { appointmentTypeID, month } = req.query;
    

    if (!appointmentTypeID || !month) {
      return res.status(400).json({ error: 'appointmentTypeID and month are required' });
    }

    var appointmentTypeID1 =  18478069

    const response = await axios.get(
      `https://acuityscheduling.com/api/v1/availability/dates?month=${month}&appointmentTypeID=${appointmentTypeID1}&timezone=`,
      {
        auth: {
          username: '19354905',
          password: 'b0a1d960446f9efab07df16c4c16b444'
        }
      }
    );

    console.log(response.data)

    res.status(200).json(response.data);
  } catch (error) {
    res.render('kil500', { output: `${error}` });
  }
};


const appointment_types = async (req, res, next) => {


  try {
    // Make a request to the third-party API
    const response = await axios.get('https://acuityscheduling.com/api/v1/appointment-types', {
      auth: {
        username: '19354905',       // Replace with actual username
        password: 'b0a1d960446f9efab07df16c4c16b444'  // Replace with actual password
      }
    });

    // Send the appointment types data back to the client
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching appointment types:', error);
    res.status(500).json({ message: 'Failed to fetch appointment types' });
  }

};






const time_availability = async (req, res, next) => { console.log("............Timeslots availabilty",req.query)


  try {
    const { appointmentTypeID, date } = req.query;
    

    if (!appointmentTypeID || !date) {
      return res.status(400).json({ error: 'appointmentTypeID and date are required' });
    }

 

    const response = await axios.get(
      `https://acuityscheduling.com/api/v1/availability/times?date=${date}&appointmentTypeID=${appointmentTypeID}&timezone=`,
      {
        auth: {
          username: '19354905',
          password: 'b0a1d960446f9efab07df16c4c16b444'
        }
      }
    );

    console.log(response.data)

    res.status(200).json(response.data);
  } catch (error) {
    res.render('kil500', { output: `${error}` });
  }
};











const getBookingOtp = async (req, res, next) => {
  console.log("sending Booking OTP", req.body)
  let pool;
  let transaction;
  const { email } = req.body;

  try {
    pool = await connection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes from now

    console.log(otp)

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

    await sendWelcomeMsg(email, otp);
    await transaction.commit();

    return res.status(200).json({ msg: true, exists: true, otp });

   
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("error ->", error.message);
    res.render('kil500', { output: `${error}` });
  } finally {
    if (pool) pool.close();
  }
};




const verifyOTP = async (req, res, next) => {
  console.log(req.body,"verify")
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

    res.status(200).json({ success: true , valid: true  });
  } catch (error) {
    console.log("error in booing OTP ", error)
    res.status(500).json({ success: false, message: 'Internal Server Error', valid: false });
  } finally {
    if (pool) pool.close(); // Close the pool
  }
};






const confirmbookingformat = async (req, res, next) => {

  console.log("new booking request ", req.body)
  let pool;
  let transaction;

  try {
    pool = await connection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();



    await transaction.commit();
    res.status(200).json({ success: true , valid: true  });
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ success: false, message: 'Internal Server Error', valid: false });
  }finally{
    if (pool) pool.close(); // Close the pool
  } 
};


const confirmbookingwithInput = async (req, res, next) => {
  const {
    trn, firstname, lastname, contact, country_code, user_email, agent_forwarder,
    appointment_by, appointment_type, bol_number, vessel_name, vessel_reported_date,
    chassis_number, declaration_number, container_number, number_of_items,
    booking_date, booking_times, appointmentTypeID, calendarID, selectedDateTimes
  } = req.body;

  let pool;
  let transaction;

  try {
    // Initialize the database connection
    pool = await connection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const bookingResults = await Promise.all(
      selectedDateTimes.map(async (datetime) => {
        // Format each datetime correctly
        const formattedDatetime = moment(datetime).format('YYYY-MM-DDTHH:mm:ssZ').replace(':', '').replace('Z', '');

        // Book appointment on Acuity for each datetime
        const acuityResponse = await axios.post(
          'https://acuityscheduling.com/api/v1/appointments',
          {
            datetime: datetime,
            appointmentTypeID: appointmentTypeID,
            firstName: firstname,
            lastName: lastname,
            email: user_email,
            calendarID: calendarID,
            phone: `${country_code}${contact}`,
            timezone: 'America/New_York',
            fields: [
              { id: 7510463, value: agent_forwarder },
              { id: 7510465, value: appointment_type },
              { id: 7510459, value: "Order12345" },
              { id: 7510464, value: number_of_items }
            ]
          },
          {
            auth: {
              username: '19354905',
              password: 'b0a1d960446f9efab07df16c4c16b444'
            }
          }
        );

        // Insert booking details into the database if Acuity booking is successful
        if (acuityResponse.status === 200) {
          // Extract booking id from the Acuity response
          const bookingId = acuityResponse.data.id;

          // Use parameterized query to prevent SQL injection
          const request = transaction.request();
          request.input('bookingId', sql.BigInt, bookingId);
          request.input('trn', sql.NVarChar(255), trn);
          request.input('firstname', sql.NVarChar(255), firstname);
          request.input('lastname', sql.NVarChar(255), lastname);
          request.input('contact', sql.NVarChar(255), contact);
          request.input('country_code', sql.NVarChar(10), country_code);
          request.input('user_email', sql.NVarChar(255), user_email);
          request.input('agent_forwarder', sql.NVarChar(255), agent_forwarder);
          request.input('appointment_by', sql.NVarChar(255), appointment_by);
          request.input('appointment_type', sql.NVarChar(255), appointment_type);
          request.input('bol_number', sql.NVarChar(255), bol_number);
          request.input('vessel_name', sql.NVarChar(255), vessel_name);
          request.input('vessel_reported_date', sql.NVarChar(50), vessel_reported_date);
          request.input('chassis_number', sql.NVarChar(255), chassis_number);
          request.input('declaration_number', sql.NVarChar(255), declaration_number);
          request.input('container_number', sql.NVarChar(255), container_number);
          request.input('number_of_items', sql.NVarChar(255), number_of_items);
          request.input('booking_date', sql.NVarChar(50), booking_date);
          request.input('booking_times', sql.NVarChar(sql.MAX), datetime);

          // Perform the insert
          await request.query(`
            INSERT INTO tbl_bookings (
              booking_id, trn, firstname, lastname, contact, country_code, user_email,
              agent_forwarder, appointment_by, appointment_type, bol_number,
              vessel_name, vessel_reported_date, chassis_number, declaration_number,
              container_number, number_of_items, booking_date, booking_times
            ) VALUES (
              @bookingId, @trn, @firstname, @lastname, @contact, @country_code, @user_email,
              @agent_forwarder, @appointment_by, @appointment_type, @bol_number,
              @vessel_name, @vessel_reported_date, @chassis_number, @declaration_number,
              @container_number, @number_of_items, @booking_date, @booking_times
            )
          `);

          return {
            datetime,
            success: true,
            acuityResponse: acuityResponse.data
          };
        } else {
          throw new Error('Failed to book appointment on Acuity for datetime: ' + datetime);
        }
      })
    );

    // Commit the transaction after all bookings are successful
    await transaction.commit();

    res.status(200).json({
      success: true,
      valid: true,
      bookingResults
    });
  } catch (error) {
    // Rollback transaction in case of error
    if (transaction) await transaction.rollback();
    console.error("Error during booking:", error.response?.data || error.message);
    res.status(400).json({
      success: false,
      message: error.response?.data?.message || 'Failed to book appointments with Acuity',
    });
  } finally {
    if (pool) pool.close();
  }
};





const confirmbookingwithoutloop = async (req, res, next) => {

  console.log("new booking request ", req.body)

  const {
    trn, firstname, lastname, contact, country_code, user_email, agent_forwarder,
    appointment_by, appointment_type, bol_number, vessel_name, vessel_reported_date,
    chassis_number, declaration_number, container_number, number_of_items,
    booking_date, booking_times , appointmentTypeID ,calendarID , selectedDateTimes
  } = req.body;

  let pool;
  let transaction;

  // const datetime = moment.tz(`${booking_date} ${booking_times[0]}`, 'YYYY-MM-DD hh:mm A', 'America/New_York').format('YYYY-MM-DDTHH:mm:ssZ');

  const datetime = moment.tz(`${booking_date} ${booking_times[0]}`, 'YYYY-MM-DD hh:mm A', 'America/New_York').format('YYYY-MM-DDTHH:mm:ssZ').replace(':', '').replace('Z', ''); 


  console.log("datetime",datetime)

  try {
    // Step 1: Book appointment on Acuity
    const acuityResponse = await axios.post(
      'https://acuityscheduling.com/api/v1/appointments',
      {
        datetime: selectedDateTimes[0], // Using the first time slot for simplicity
        appointmentTypeID: appointmentTypeID, // Replace with actual appointmentTypeID if dynamic
        firstName: firstname,
        lastName: lastname,
        email: user_email,
        calendarID:calendarID,
        phone: `${country_code}${contact}`,
        timezone: 'America/New_York', // Adjust as needed
        fields: [
          { id: 7510463, value: req.body.agent_forwarder },        
          { id: 7510465, value: req.body.appointment_type },
          { id: 7510459, value: "Order12345" },
          { id: 7510464, value: req.body.number_of_items }                
          // { id: 8204034, value: req.body.vessel_name },
        ]
      },
      {
        auth: {
          username: '19354905',
          password: 'b0a1d960446f9efab07df16c4c16b444'
        }
      }
    );

    // Step 2: Check if Acuity booking was successful (status 200)
    if (acuityResponse.status === 200) {
      // Step 3: Proceed with database transaction if Acuity response is successful
      pool = await connection();
      transaction = new sql.Transaction(pool);
      await transaction.begin();

      await transaction.request().query(`
        INSERT INTO tbl_bookings (
          trn, firstname, lastname, contact, country_code, user_email,
          agent_forwarder, appointment_by, appointment_type, bol_number,
          vessel_name, vessel_reported_date, chassis_number, declaration_number,
          container_number, number_of_items, booking_date, booking_times
        ) VALUES (
          '${trn}', '${firstname}', '${lastname}', '${contact}', '${country_code}', '${user_email}',
          '${agent_forwarder}', '${appointment_by}', '${appointment_type}', '${bol_number}',
          '${vessel_name}', '${vessel_reported_date}', '${chassis_number}', '${declaration_number}',
          '${container_number}', '${number_of_items}', '${booking_date}', '${booking_times.join(", ")}'
        )
      `);

      await transaction.commit();
      res.status(200).json({ success: true, valid: true, acuityResponse: acuityResponse.data });
    } else {
      console.log("failed to Book ")
      // If Acuity response is not 200, do not insert into the database
    //  res.status(500).json({ success: false, message: 'Failed to book appointment on Acuity', valid: false });
    throw new Error('Error booking appointment with Acuity');
    }
  } catch (error) {
    console.log("failed to Book ", error)
    // Rollback transaction in case of error
    if (transaction) await transaction.rollback();
    console.error("Error during booking:", error.response?.data || error.message);
    res.status(400).json({ success: false, message: error.response?.data?.message || 'Failed to book appointment with Acuity' });

  } finally {
    if (pool) pool.close(); // Close the pool
  }
};






const confirmbooking = async (req, res, next) => {
  const {
    trn, firstname, lastname, contact, country_code, user_email, agent_forwarder,
    appointment_by, appointment_type, bol_number, vessel_name, vessel_reported_date,
    chassis_number, declaration_number, container_number, number_of_items,
    booking_date, booking_times, appointmentTypeID, calendarID, selectedDateTimes
  } = req.body;

  let pool;
  let transaction;

  try {
    // Initialize the database connection
    pool = await connection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Book appointments sequentially for each selected date/time
    for (const datetime of selectedDateTimes) {
      const formattedDatetime = moment(datetime).format('YYYY-MM-DDTHH:mm:ssZ').replace(':', '').replace('Z', '');

      // Book appointment on Acuity for each datetime
      const acuityResponse = await axios.post(
        'https://acuityscheduling.com/api/v1/appointments',
        {
          datetime: datetime,
          appointmentTypeID: appointmentTypeID,
          firstName: firstname,
          lastName: lastname,
          email: user_email,
          calendarID: calendarID,
          phone: `${country_code}${contact}`,
          timezone: 'America/New_York',
          fields: [
            { id: 7510463, value: agent_forwarder },
            { id: 7510465, value: appointment_type },
            { id: 7510459, value: "Order12345" },
            { id: 7510464, value: number_of_items }
          ]
        },
        {
          auth: {
            username: '19354905',
            password: 'b0a1d960446f9efab07df16c4c16b444'
          }
        }
      );

      // Insert booking details into the database if Acuity booking is successful
      if (acuityResponse.status === 200) {
        const bookingId = acuityResponse.data.id;

        // Inline query string to insert data into the table
        const query = `
          INSERT INTO tbl_bookings (
            booking_id, trn, firstname, lastname, contact, country_code, user_email,
            agent_forwarder, appointment_by, appointment_type, bol_number,
            vessel_name, vessel_reported_date, chassis_number, declaration_number,
            container_number, number_of_items, booking_date, booking_times
          ) VALUES (
            ${bookingId}, '${trn}', '${firstname}', '${lastname}', '${contact}', '${country_code}', '${user_email}',
            '${agent_forwarder}', '${appointment_by}', '${appointment_type}', '${bol_number}',
            '${vessel_name}', '${vessel_reported_date}', '${chassis_number}', '${declaration_number}',
            '${container_number}', '${number_of_items}', '${booking_date}', '${formattedDatetime}'
          )
        `;

        // Perform the insert query
        await transaction.request().query(query);
      } else {
        throw new Error('Failed to book appointment on Acuity for datetime: ' + formattedDatetime);
      }
    }

    // Commit the transaction after all bookings are successful
    await transaction.commit();

    // Respond with success
    res.status(200).json({
      success: true,
      valid: true,
      message: 'All appointments booked successfully.'
    });

  } catch (error) {
    // Rollback transaction in case of error
    if (transaction) await transaction.rollback();
    console.error("Error during booking:", error.response?.data || error.message);
    res.status(400).json({
      success: false,
      message: error.response?.data?.message || 'Failed to book appointments with Acuity',
    });
  } finally {
    if (pool) pool.close();
  }
};




const check_times = async (req, res, next) => {
  const { date, time, appointmentTypeID , calendarID , datetime } = req.body;

  console.log(".... checking time ", req.body);

  try {

    // Convert the date and time into the correct format for Acuity
   // const datetime = moment.tz(`${date} ${time}`, 'YYYY-MM-DD hh:mm A', 'America/New_York').format('YYYY-MM-DDTHH:mm:ssZ');

    // Send the request to Acuity API
    const response = await axios.post(
      'https://acuityscheduling.com/api/v1/availability/check-times',
      [
        {
          datetime, // Correctly formatted datetime
          appointmentTypeID, // Appointment type ID
          calendarID // Calendar ID
        }
      ],
      {
        auth: {
          username: '19354905',
          password: 'b0a1d960446f9efab07df16c4c16b444' // Replace with your actual credentials
        }
      }
    );


    // Log and send the response from Acuity
    console.log(response.data);
    res.status(200).json(response.data);

  } catch (error) {
    console.error("Error checking times: ", error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
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
  console.log("sending OTP", req.body)
  let pool;
  let transaction;
  const { email } = req.body;

  try {
    pool = await connection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes from now

    console.log(otp)

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

      await sendWelcomeMsg(email, otp);
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
  dates_availability , appointment_types , time_availability , getBookingOtp , verifyOTP , confirmbooking ,
  check_times

 }

