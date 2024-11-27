//import connection from "../config.js"

import { connection, sql } from '../config.js';
import {sendTokenUser, sendTokenUserogoutandProceed} from "../utils/jwtToken.js";
import axios from 'axios';
import moment from 'moment-timezone';

import fs from 'fs';
import path from 'path';

import { sendWelcomeMsg, sendBookingOTP } from '../middleware/helper.js';






//=================================== APIs Started ========================================================




// Utility function to log Acuity API requests
const logAcuityRequestonlytextfile = (url, userRole, userName, reason) => {
  // Define the file path
  const logFilePath = path.join(process.cwd(), 'public', 'logs', 'auditLogs.txt');
  
  // Get the current date and time
  const currentDateTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
  
  // Format the log entry
  const logEntry = `
------------------------------
Date and Time: ${currentDateTime}
URL Hit: ${url}
Accessed By: ${userRole} - ${userName}
Purpose: ${reason}
------------------------------
`;

  // Append the log entry to the file
  fs.appendFile(logFilePath, logEntry, (err) => {
      if (err) {
          console.error("Failed to log Acuity request:", err);
      } else {
          console.log("Acuity request logged successfully.");
      }
  });



};



const logAcuityRequest = async (url, userRole, userName, reason) => {
  let pool;
  let transaction;

  // Define the file path for the text log
  const logFilePath = path.join(process.cwd(), 'public', 'logs', 'auditLogs.txt');
  
  // Get the current date and time in a readable format
  const currentDateTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
  
  // Format the log entry for both text file and database
  const logEntry = `
------------------------------
Date and Time: ${currentDateTime}
URL Hit: ${url}
Accessed By: ${userRole} - ${userName}
Purpose: ${reason}
------------------------------
`;

  try {
      pool = await connection();
      transaction = new sql.Transaction(pool);
      await transaction.begin();

      // Insert log into tbl_logs in the database
      await transaction.request().query(`
          INSERT INTO tbl_logs (user_role, user_name, reason, acuity_url)
          VALUES (N'${userRole}', N'${userName}', N'${reason}', N'${url}')
      `);

      // Commit the transaction
      await transaction.commit();
      console.log("Acuity request logged to database successfully.");

      // Append the log entry to the text file after successful database insertion
      fs.appendFile(logFilePath, logEntry, (err) => {
          if (err) {
              console.error("Failed to log Acuity request to text file:", err);
          } else {
              console.log("Acuity request logged successfully to text file.");
          }
      });
  } catch (error) {
      if (transaction) await transaction.rollback();
      console.error("Failed to log Acuity request:", error);
  } finally {
      if (pool) pool.close();
  }
};







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



const reschedule = async (req, res, next) => {
  let pool;
  let transaction;

  try {
    const output = req.cookies.kwl_msg || '';
    const booking_id = req.cookies.kwl_booking_id || 0;


    //----------------------   audit Logging -------------------------- 

    const acuityUrl =  `https://acuityscheduling.com/api/v1/appointments/${booking_id}?pastFormAnswers=false`
    const reason = "Fetching Single Appointment Details"
    const userName = req.user.user_email; 
    const userRole = 'User';

   await logAcuityRequest(acuityUrl, userRole, userName, reason);

    //----------------------   audit Logging -------------------------- 
    
    pool = await connection(); // Establish database connection
    transaction = new sql.Transaction(pool); // Create a new transaction instance

    await transaction.begin(); // Begin the transaction

    // Step 1: Fetch booking data from internal database
    const request = transaction.request();
    const result = await request
      .input('booking_id', sql.Int, booking_id)
      .query(`SELECT * FROM tbl_bookings WHERE booking_id = @booking_id`);

    if (result.recordset.length === 0) {
      throw new Error('Booking not found in the database');
    }

    const internalBooking = result.recordset[0];


    // Step 2: Fetch booking data from Acuity API
    const acuityResponse = await axios.get(
      `https://acuityscheduling.com/api/v1/appointments/${booking_id}?pastFormAnswers=false`,
      {
        auth: {
          username: '19354905', // Use actual username
          password: 'b0a1d960446f9efab07df16c4c16b444' // Use actual password
        }
      }
    );

    // Check if the Acuity API request was successful
    if (acuityResponse.status !== 200) {
      throw new Error('Failed to fetch booking details from Acuity');
    }

  

    const acuityBooking = acuityResponse.data;
   
    console.log("acuityBookingacuityBooking,acuityBooking",acuityBooking)

    // Step 3: Merge Acuity data into internal booking data, adding `appointmentTypeID` and `calendarID`
    const booking = {
      ...internalBooking,
      appointmentTypeID: acuityBooking.appointmentTypeID,
      type_name:acuityBooking.type,
      calendarID: acuityBooking.calendarID,
      acuityData: acuityBooking // Optionally, store other Acuity details if needed
    };

    

    console.log(booking)

    await transaction.commit(); // Commit the transaction if successful

    // Render the reschedule page with merged booking data
    res.render('reschedule', { output, booking });
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


const rescheduleinternal = async (req, res, next) => {
  let pool;
  let transaction;

  try {
    const output = req.cookies.kwl_msg || '';
    const booking_id = req.cookies.kwl_booking_id || 0;
    pool = await connection(); // Establish database connection
    transaction = new sql.Transaction(pool); // Create a new transaction instance

    await transaction.begin(); // Begin the transaction

    const request = transaction.request();
    
  
    const result = await request
    .input('booking_id', sql.Int, booking_id)
    .query(`SELECT * FROM tbl_bookings WHERE booking_id = @booking_id`);


    console.log("selected booking ",result.recordset[0] )

    await transaction.commit(); // Commit the transaction if successful

    res.render('reschedule', { output , booking: result.recordset[0] });
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
    const { appointmentTypeID, month ,calendarId ,timezone } = req.query;
    

    if (!appointmentTypeID || !month) {
      return res.status(400).json({ error: 'appointmentTypeID and month are required' });
    }

        //----------------------   audit Logging -------------------------- 

        const acuityUrl =  `https://acuityscheduling.com/api/v1/availability/dates?month=${month}&appointmentTypeID=${appointmentTypeID}&timezone=`
        const reason = "Fetching Date Aailabilities"
        const userName = req.user ? req.user.user_email : 'Guest Mode';
        const userRole = 'User';
    
       await logAcuityRequest(acuityUrl, userRole, userName, reason);
    
        //----------------------   audit Logging -------------------------- 

    

        var url =  `https://acuityscheduling.com/api/v1/availability/dates?month=${month}&appointmentTypeID=${appointmentTypeID}&calendarID=${calendarId}&timezone=${timezone}`

    const response = await axios.get(
      `https://acuityscheduling.com/api/v1/availability/dates?month=${month}&appointmentTypeID=${appointmentTypeID}&calendarID=${calendarId}&timezone=${timezone}`,
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


    
        //----------------------   audit Logging -------------------------- 

        const acuityUrl =  `https://acuityscheduling.com/api/v1/appointment-types`
        const reason = "Fetching Date Appointment Types"
        const userName = req.user ? req.user.user_email : 'Guest Mode';
        const userRole = 'User';
    
       await logAcuityRequest(acuityUrl, userRole, userName, reason);
    
        //----------------------   audit Logging -------------------------- 
    // Make a request to the third-party API
    const response = await axios.get('https://acuityscheduling.com/api/v1/appointment-types', {
      auth: {
        username: '19354905',       // Replace with actual username
        password: 'b0a1d960446f9efab07df16c4c16b444'  // Replace with actual password
      }
    });

    const calendarsresponse = await axios.get('https://acuityscheduling.com/api/v1/calendars', {
      auth: {
        username: '19354905',       // Replace with actual username
        password: 'b0a1d960446f9efab07df16c4c16b444'  // Replace with actual password
      }
    });

    const appointmentTypes = response.data;
    const calendars = calendarsresponse.data;


    

    // Create a Map for quick calendar lookup
    const calendarMap = new Map(calendars.map((cal) => [cal.id, cal]));

    // Merge data
    const mergedData = appointmentTypes.map((type) => {
      const primaryCalendar = calendarMap.get(type.calendarIDs[0]); // Use the first calendar ID
      return {
        ...type,
        ...(primaryCalendar
          ? {
              calendarId: primaryCalendar.id,
              calendarName: primaryCalendar.name,
              location: primaryCalendar.location,
              timezone: primaryCalendar.timezone,
            }
          : {}),
      };
    });

    console.log("mergedData----> ",mergedData)

    // Send the appointment types data back to the client
    res.json(mergedData);
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

    await sendBookingOTP(email, otp);
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
  console.log("new booking ")
  const {
    trn, firstname, lastname, contact, country_code, user_email, agent_forwarder,
    appointment_by, appointment_type, bol_number, vessel_name, vessel_reported_date,
    chassis_number, declaration_number, container_number, number_of_items,
    booking_date, booking_times, appointmentTypeID, calendarID, selectedDateTimes ,timezone
  } = req.body;

  var location = ''

  let pool;
  let transaction;

  try {
    // Initialize the database connection

    
        //----------------------   audit Logging -------------------------- 

        const acuityUrl =  `https://acuityscheduling.com/api/v1/appointments`
        const reason = "Creating New Booking"
        const userName = req.user ? req.user.user_email : user_email;
        const userRole = 'User';
    
       await logAcuityRequest(acuityUrl, userRole, userName, reason);
    
        //----------------------   audit Logging -------------------------- 
    
    pool = await connection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

       const kiltypeid = ['70702351', '13801622', '16120840', '16581501'];

       let fields = [
        { id: 7510463, value: agent_forwarder },
        { id: 7510465, value: appointment_type },
        { id: 7510459, value: "Order12345" },
        { id: 7510464, value: number_of_items }
      ];

      if (kiltypeid.includes(appointmentTypeID)) {
        // Remove multiple fields by filtering out their IDs
        fields = fields.filter(field => ![7510463, 7510465, 7510459,7510464].includes(field.id));

        //add new 
        fields.push(
          { id: 7505634, value: agent_forwarder },
          { id: 8204034, value: vessel_name },
          { id: 7958526, value: vessel_reported_date },
          { id: 7505676, value: bol_number },
          { id: 7505639, value: '0' },
          { id: 7505640, value: '0' },
          { id: 7505641, value: '0' },
          { id: 15729585, value: '0' }

          

          
        );

        

      }
      console.log("fieldsfieldsfieldsfieldsfieldsfieldsfields",fields)
      

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
          fields: fields
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

        console.log("acuityResponse.data--> new booking data -> ",acuityResponse.data)
        const bookingId = acuityResponse.data.id;

        const type_name = acuityResponse.data.type;

        
        const created_at = moment(acuityResponse.data.datetimeCreated, 'YYYY-MM-DDTHH:mm:ssZ').format('YYYY-MM-DD HH:mm:ss.SSSSSSSZ');

        console.log("created_att",created_at)
        console.log("booking_date",booking_date)
        
        
        // Inline query string to insert data into the table
        const querywithouttimezone = `
          INSERT INTO tbl_bookings (
            booking_id, trn, firstname, lastname, contact, country_code, user_email,
            agent_forwarder, appointment_by, appointment_type, bol_number,
            vessel_name, vessel_reported_date, chassis_number, declaration_number,
            container_number, number_of_items, booking_date, booking_times
          ) VALUES (
            ${bookingId}, '${trn}', '${firstname}', '${lastname}', '${contact}', '${country_code}', '${user_email}',
            '${agent_forwarder}', '${appointment_by}', '${appointment_type}', '${bol_number}',
            '${vessel_name}', '${vessel_reported_date}', '${chassis_number}', '${declaration_number}',
            '${container_number}', '${number_of_items}', '${booking_date}', '${datetime}'
          )
        `;


        const query = `
  INSERT INTO tbl_bookings (
    booking_id, trn, firstname, lastname, contact, country_code, user_email,
    agent_forwarder, appointment_by, appointment_type, bol_number,
    vessel_name, vessel_reported_date, chassis_number, declaration_number,
    container_number, number_of_items, booking_date, booking_times,
    timezone, location, created_at, type_name
  ) VALUES (
    ${bookingId}, '${trn}', '${firstname}', '${lastname}', '${contact}', '${country_code}', '${user_email}',
    '${agent_forwarder}', '${appointment_by}', '${appointment_type}', '${bol_number}',
    '${vessel_name}', '${vessel_reported_date}', '${chassis_number}', '${declaration_number}',
    '${container_number}', '${number_of_items}', '${booking_date}', '${datetime}',
    '${timezone}', '${location}', '${created_at}', '${type_name}'
  )
`;

        // Perform the insert query
        await transaction.request().query(query);

        var reason1 = 'Confirmed'

        //const booking_times = moment(datetime, "YYYY-MM-DDTHHmm:ssZ").format('hh:mm A');
       // const booking_datetime = `${booking_date},${booking_times}`

        // Format the date using the specified timezone
// const booking_date = moment.tz(datetime, timezone).format('MMMM DD, YYYY');
const booking_times = moment.tz(datetime, timezone).format('hh:mm A');

// Combine the formatted date and time
const booking_datetime = `${booking_date}, ${booking_times}`;

        await transaction.request()
        .input('user_role', sql.NVarChar, userRole)
        .input('user_name', sql.NVarChar, userName)
        .input('reason', sql.NVarChar, reason1)
        .input('acuity_url', sql.NVarChar, acuityUrl)
        .input('booking_id', sql.Int, bookingId)
        .input('booking_datetime', sql.NVarChar, booking_datetime || '') // use empty string if null
        .input('new_datetime', sql.NVarChar,'') // use empty string if null
        .query(`
            INSERT INTO tbl_booking_logs 
            (user_role, user_name, reason, acuity_url, booking_id, booking_datetime, new_datetime) 
            VALUES (@user_role, @user_name, @reason, @acuity_url, @booking_id, @booking_datetime, @new_datetime)
        `);


        
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
    console.log(error)
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
   // console.error("Error checking times: ", error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};
















const viewBookings = async (req, res, next) => {
  let pool;
  const output = req.cookies.kwl_msg || '';
  const userEmail = req.user.user_email; // Get the email from req.user

  try {
    pool = await connection();
    
    // Step 1: Fetch all the bookings for the user
    const result = await pool
      .request()
      .input('userEmail', sql.NVarChar, userEmail) // Bind the email parameter
      .query('SELECT * FROM tbl_bookings WHERE user_email = @userEmail ORDER BY created_at DESC');

    // Step 2: Iterate over bookings and fetch logs for each booking
    const bookings = [];
    for (let booking of result.recordset) {
      // Step 2.1: Fetch logs for the current booking
      const logsResult = await pool
        .request()
        .input('booking_id', sql.Int, booking.booking_id) // Bind the booking_id
        .query('SELECT * FROM tbl_booking_logs WHERE booking_id = @booking_id ORDER BY created_at DESC');

      // Step 2.2: Format the logs array (if any)
      booking.logs = logsResult.recordset.map((log) => {
        // log.created_at = moment(log.created_at).format('YYYY-MM-DDTHH:mm:ssZ'); // Format created_at as needed
        return log;
      });




      //----------- add time zone to each booking ----------- 
    //   const acuityResponse = await axios.get(
    //     `https://acuityscheduling.com/api/v1/appointments/${booking.booking_id}?pastFormAnswers=false`,
    //     {
    //       auth: {
    //         username: '19354905', // Use actual username
    //         password: 'b0a1d960446f9efab07df16c4c16b444' // Use actual password
    //       }
    //     }
    //   );
    //   const acuityBooking = acuityResponse.data;
   

    // // Step 3: Merge Acuity data into internal booking data, adding `appointmentTypeID` and `calendarID`
    //  booking = {
    //   ...booking,        
    //   timezone:acuityBooking.timezone,
    //   location:acuityBooking.location     
    // };
    //----------- add time zone to each booking ----------- 
  

      // Step 2.3: Format booking_times
      // if (booking.booking_times) {
      //   booking.booking_times = moment(booking.booking_times, "YYYY-MM-DDTHHmm:ssZ").format('hh:mm A');
      // } else {
      //   booking.booking_times = 'N/A';
      // }

      // Step 2.4: Push formatted booking with logs into the array
      bookings.push(booking);
    }


    // Render the view with the bookings and logs
    res.render('viewBookings', { output: output, bookings: bookings });

  } catch (error) {
    console.error('Error:', error);
    res.render('kil500', { output: `${error}` });
  } finally {
    // Always close the pool to release resources
    if (pool) {
      pool.close();
    }
  }
};







const viewBookingswithoutlogs = async (req, res, next) => {
  let pool;
  const output = req.cookies.kwl_msg || '';
  const userEmail = req.user.user_email; // Get the email from req.user

  try {
    pool = await connection();
    
   
    // Execute the query with the user's email
    const result = await pool
      .request()
      .input('userEmail', sql.NVarChar, userEmail) // Bind the email parameter
      .query('SELECT * FROM tbl_bookings WHERE user_email = @userEmail ORDER BY created_at  DESC');



    // Map and format the bookings
    const bookings = result.recordset.map((booking) => {
      // Parse and format booking_times if it exists
      if (booking.booking_times) {
        booking.booking_times = moment(booking.booking_times, "YYYY-MM-DDTHHmm:ssZ").format('hh:mm A');
      } else {
        booking.booking_times = 'N/A';
      }
      return booking;
    });

    console.log("bookings",bookings)

    // Render the view with bookings
    res.render('viewBookings', { output: output, bookings: bookings });
  } catch (error) {
    console.error('Error:', error);
    res.render('kil500', { output: `${error}` });
  } finally {
    // Always close the pool to release resources
    if (pool) {
      pool.close();
    }
  }
};






const cancelBooking = async (req, res, next) => {
  console.log("cancelling", req.body);
  let pool;
  let transaction;
  let acuityResponse;
  const { id, status, cancelNote ,booking_datetime } = req.body;

  try {

    
        //----------------------   audit Logging -------------------------- 

        const acuityUrl =  `https://acuityscheduling.com/api/v1/appointments/${id}/cancel`
        const reason = "Cancelling Booking"
        const userName = req.user ? req.user.user_email : 'Guest Mode';
        const userRole = 'User';
    
       await logAcuityRequest(acuityUrl, userRole, userName, reason);
    
        //----------------------   audit Logging -------------------------- 

    // Step 1: Cancel booking in Acuity
     acuityResponse = await axios.put(
      `https://acuityscheduling.com/api/v1/appointments/${id}/cancel`, 
      {
        noShow: false,
        cancelNote: cancelNote || "Your appointment has been cancelled"
      },
      {
        auth: {
          username: '19354905', // Use the actual username
          password: 'b0a1d960446f9efab07df16c4c16b444' // Use the actual password
        }
      }
    );

    // Step 2: Check if Acuity response is successful (status 200)
    if (acuityResponse.status === 200) {
      // Step 3: Proceed to update internal database if Acuity cancellation is successful
      pool = await connection();
      transaction = new sql.Transaction(pool);
      await transaction.begin();

      // Update the status in the internal database to reflect cancellation
      const updateSql = `UPDATE tbl_bookings SET booking_status = @booking_status WHERE booking_id = @id`;
      const request = new sql.Request(transaction);
      request.input('booking_status', sql.NVarChar, status); // Use 'Cancelled' or 'No Show'
      request.input('id', sql.Int, id); // Use dynamic booking ID
      await request.query(updateSql);


      

      const bookingtime = moment.tz(booking_datetime, timezone).format('hh:mm A');
      const bookingdate = moment.tz(booking_datetime, timezone).format('YYYY-MM-DD');
      const bookingdatetime = `${bookingdate}, ${bookingtime}`;
      

      await transaction.request()
      .input('user_role', sql.NVarChar, userRole)
      .input('user_name', sql.NVarChar, userName)
      .input('reason', sql.NVarChar, status)
      .input('acuity_url', sql.NVarChar, acuityUrl)
      .input('booking_id', sql.Int, id)
      .input('booking_datetime', sql.NVarChar, bookingdatetime || '') // use empty string if null
      .input('new_datetime', sql.NVarChar,'') // use empty string if null
      .query(`
          INSERT INTO tbl_booking_logs 
          (user_role, user_name, reason, acuity_url, booking_id, booking_datetime, new_datetime) 
          VALUES (@user_role, @user_name, @reason, @acuity_url, @booking_id, @booking_datetime, @new_datetime)
      `);


      await transaction.commit();

      res.json({ success: true, msg: `Booking has been cancelled` });
    } else {
      console.log("Failed to cancel booking in Acuity");
  
      return res.status(200).json({
        success: false,
        msg: acuityResponse.data.message || 'Failed to cancel appointment on Acuity'
    
      });
    }
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Errorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr:', error.response.data);
    //res.status(error.status).json({ success: false, msg: 'Internal Server Error' });
          if(error.response.data){
            acuityResponse = error.response.data;
          }
            

        return res.status(200).json({
      success: false,
      msg: acuityResponse.message || 'Failed to cancel appointment on Acuity'
    });

  } finally {
    if (pool) pool.close(); // Close the pool
  }
};



const cancelBookindirect = async (req, res, next) => {
  console.log("cancelling", req.body);
  let pool;
  let transaction;
  const { id, status } = req.body;

  try {
      pool = await connection();
      transaction = new sql.Transaction(pool);
      await transaction.begin();

      // Update the status in the database
      const updateSql = `UPDATE tbl_bookings SET booking_status = @booking_status WHERE booking_id = @id`;
      const request = new sql.Request(transaction);
      request.input('booking_status', sql.NVarChar, status);
      request.input('id', sql.Int, id);
      await request.query(updateSql);

      await transaction.commit();

      res.json({ success: true, msg: `${status === 'Approve' ? 'Approving' : 'Cancelling'} Booking` });
  } catch (error) {
      if (transaction) await transaction.rollback();
      console.error('Error:', error);
      res.status(500).json({ success: false, msg: 'Internal Server Error' });
  } finally {
      if (pool) pool.close(); // Close the pool
  }
};


const cancelBookingsimple = async (req, res, next) => {
  console.log("new booking request", req.body);
  let pool;
  let transaction;
  const { id, status } = req.body;

  try {
      pool = await connection();
      transaction = new sql.Transaction(pool);
      await transaction.begin();

      // Simple, inline parameterized query for updating the status
      await transaction.request()
          .query(`UPDATE tbl_bookings SET status = '${status}' WHERE booking_id = ${id}`);

      await transaction.commit();

      res.json({ success: true, msg: `${status === 'Approve' ? 'Approving' : 'Cancelling'} Booking` });
  } catch (error) {
      if (transaction) await transaction.rollback();
      console.error('Error:', error);
      res.status(500).json({ success: false, msg: 'Internal Server Error' });
  } finally {
      if (pool) pool.close(); // Close the pool
  }
};








const rescheduleBooking = async (req, res, next) => {
  console.log(req.body)
  const { booking_id, selectedDateTimes, booking_date ,booking_datetime , timezone } = req.body;

  let pool;
  let transaction;

  try {

    
        //----------------------   audit Logging -------------------------- 

        const acuityUrl =  `https://acuityscheduling.com/api/v1/appointments/${booking_id}/reschedule`
        const reason = "Rescheduling Booking"
        const userName = req.user ? req.user.user_email : 'Guest Mode';
        const userRole = 'User';
    
       await logAcuityRequest(acuityUrl, userRole, userName, reason);
    
        //----------------------   audit Logging -------------------------- 

    // Initialize the database connection
    pool = await connection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Loop through each selected date/time to reschedule the appointment
    for (const datetime of selectedDateTimes) {
      // Format datetime to ensure it's correctly formatted for the Acuity API
      const formattedDatetime = moment(datetime).format('YYYY-MM-DDTHH:mm:ssZ').replace(':', '').replace('Z', '');

      var reurl = `https://acuityscheduling.com/api/v1/appointments/${booking_id}/reschedule`;



      // Send a request to Acuity to reschedule the appointment
      const acuityResponse = await axios.put(
        reurl, // Make sure `booking_id` is correctly passed
        {
          datetime: datetime // New appointment time in ISO 8601 format
        },
        {
          auth: {
            username: '19354905', // Your Acuity API username
            password: 'b0a1d960446f9efab07df16c4c16b444' // Your Acuity API password
          }
        }
      );

      // Insert the updated booking details into the database if Acuity rescheduling is successful
      if (acuityResponse.status === 200) {
        const newBookingId = acuityResponse.data.id;

        // Inline query string to update the booking in the database
        const query11 = `
          UPDATE tbl_bookings
          SET 
            booking_date = '${booking_date}', 
            booking_times = '${datetime}'
          WHERE booking_id = ${booking_id}
        `;


        const query = `
    UPDATE tbl_bookings
    SET 
        booking_date = '${booking_date}', 
        booking_times = '${datetime}',
        booking_status = 'Rescheduled'
    WHERE booking_id = ${booking_id}
`;


        // Perform the update query
        await transaction.request().query(query);

       


        // const new_time = moment(datetime, "YYYY-MM-DDTHHmm:ssZ").format('hh:mm A');
        // const old_time = moment(booking_datetime, "YYYY-MM-DDTHHmm:ssZ").format('hh:mm A');
        // const old_date = moment(booking_datetime, "YYYY-MM-DDTHHmm:ssZ").format('YYYY-MM-DD');


        const new_time = moment.tz(datetime, timezone).format('hh:mm A');
        const old_time = moment.tz(booking_datetime, timezone).format('hh:mm A');
        const old_date = moment.tz(booking_datetime, timezone).format('YYYY-MM-DD');

// Combine the formatted old date and new time into the old datetime
const old_datetime = `${old_date}, ${old_time}`;

// Combine the formatted booking date and old time into the new datetime
const new_datetime = `${booking_date}, ${new_time}`;


  

        var reason1 = 'Rescheduled'

        await transaction.request()
        .input('user_role', sql.NVarChar, userRole)
        .input('user_name', sql.NVarChar, userName)
        .input('reason', sql.NVarChar, reason1)
        .input('acuity_url', sql.NVarChar, acuityUrl)
        .input('booking_id', sql.Int, booking_id)
        .input('booking_datetime', sql.NVarChar, old_datetime || '') // use empty string if null
        .input('new_datetime', sql.NVarChar,new_datetime) // use empty string if null
        .query(`
            INSERT INTO tbl_booking_logs 
            (user_role, user_name, reason, acuity_url, booking_id, booking_datetime, new_datetime) 
            VALUES (@user_role, @user_name, @reason, @acuity_url, @booking_id, @booking_datetime, @new_datetime)
        `);


      } else {
        throw new Error('Failed to reschedule appointment on Acuity for datetime: ' + formattedDatetime);
      }
    }

    // Commit the transaction after all reschedules are successful
    await transaction.commit();

    // Respond with success
    res.status(200).json({
      success: true,
      valid: true,
      message: 'All appointments rescheduled successfully.'
    });

  } catch (error) {
    // Rollback transaction in case of error
    if (transaction) await transaction.rollback();
    console.error("Error during rescheduling:", error.response?.data || error.message);
    res.status(400).json({
      success: false,
      message: error.response?.data?.message || 'Failed to reschedule appointments with Acuity',
    });
  } finally {
    if (pool) pool.close();
  }
};








const updateBooking = async (req, res) => {

  console.log("req update ", req.body)

  const { booking_id, firstname, lastname, country_code, contact , booking_datetime ,timezone  } = req.body;

  if (!booking_id || !firstname || !lastname || !country_code || !contact) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required.'
    });
  }

  let pool;
  let transaction;

  try {


    
        //----------------------   audit Logging -------------------------- 

        const acuityUrl =  `https://acuityscheduling.com/api/v1/appointments/${booking_id}`
        const reason = "Updating Booking Deatils"
        const userName = req.user ? req.user.user_email : 'Guest Mode';
        const userRole = 'User';
    
       await logAcuityRequest(acuityUrl, userRole, userName, reason);

      //  booking_id,booking_datetime
    
        //----------------------   audit Logging -------------------------- 

    // Step 1: Update the booking on Acuity
    const reurl = `https://acuityscheduling.com/api/v1/appointments/${booking_id}`;

    const acuityResponse = await axios.put(
      reurl,
      {
        firstName: firstname,
        lastName: lastname,
        phone: contact
      
      },
      {
        auth: {
          username: '19354905', // Your Acuity API username
          password: 'b0a1d960446f9efab07df16c4c16b444' // Your Acuity API password
        }
      }
    );

    // If the Acuity update is successful, proceed with the database update
    pool = await connection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const sanitizedFirstname = firstname.trim();
    const sanitizedLastname = lastname.trim();
    const sanitizedCountryCode = country_code.trim();
    const sanitizedContact = contact.trim();

    const query = `
      UPDATE tbl_bookings
      SET
        firstname = @firstname,
        lastname = @lastname,
        country_code = @country_code,
        contact = @contact
      WHERE booking_id = @booking_id
    `;

    const request = transaction.request();
    request.input('firstname', sql.NVarChar, sanitizedFirstname);
    request.input('lastname', sql.NVarChar, sanitizedLastname);
    request.input('country_code', sql.NVarChar, sanitizedCountryCode);
    request.input('contact', sql.NVarChar, sanitizedContact);
    request.input('booking_id', sql.Int, booking_id);

    await request.query(query);

var reason1 = 'Updated'

const bookingtime = moment.tz(booking_datetime, timezone).format('hh:mm A');
const bookingdate = moment.tz(booking_datetime, timezone).format('YYYY-MM-DD');
const bookingdatetime = `${bookingdate}, ${bookingtime}`;


await transaction.request()
.input('user_role', sql.NVarChar, userRole)
.input('user_name', sql.NVarChar, userName)
.input('reason', sql.NVarChar, reason1)
.input('acuity_url', sql.NVarChar, acuityUrl)
.input('booking_id', sql.Int, booking_id)
.input('booking_datetime', sql.NVarChar, bookingdatetime || '') // use empty string if null
.input('new_datetime', sql.NVarChar,'') // use empty string if null
.query(`
    INSERT INTO tbl_booking_logs 
    (user_role, user_name, reason, acuity_url, booking_id, booking_datetime, new_datetime) 
    VALUES (@user_role, @user_name, @reason, @acuity_url, @booking_id, @booking_datetime, @new_datetime)
`);


    await transaction.commit();

    res.cookie('kwl_msg', 'Booking updated successfully!');
    res.redirect('/viewBookings');

  } catch (error) {
    // Rollback if any error occurs
    if (transaction) await transaction.rollback();
    console.error("Error during booking update:", error);

    res.cookie('kwl_msg', `Failed to Update! ${error}`);
    res.redirect('/viewBookings');
  } finally {
    if (pool) pool.close();
  }
};





const updateBookingworking = async (req, res) => {
  console.log("update data ", req.body);
  const { booking_id, firstname, lastname, country_code, contact } = req.body;

  // Validate required fields
  if (!booking_id || !firstname || !lastname || !country_code || !contact) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required.'
    });
  }

  let pool;
  let transaction;

  try {
    // Initialize the database connection
    pool = await connection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Sanitize inputs (e.g., strip spaces, check null/empty values)
    const sanitizedFirstname = firstname.trim();
    const sanitizedLastname = lastname.trim();
    const sanitizedCountryCode = country_code.trim();
    const sanitizedContact = contact.trim();

    // Use parameterized query to avoid SQL injection
    const query = `
      UPDATE tbl_bookings
      SET
        firstname = @firstname,
        lastname = @lastname,
        country_code = @country_code,
        contact = @contact
      WHERE booking_id = @booking_id
    `;

    // Log query for debugging
    console.log("Executing query: ", query);

    // Perform the update query with parameters
    const request = transaction.request();
    request.input('firstname', sql.NVarChar, sanitizedFirstname);
    request.input('lastname', sql.NVarChar, sanitizedLastname);
    request.input('country_code', sql.NVarChar, sanitizedCountryCode);
    request.input('contact', sql.NVarChar, sanitizedContact);
    request.input('booking_id', sql.Int, booking_id);

    // Execute the query with parameters
    await request.query(query);

    // Commit the transaction after successful update
    await transaction.commit();

    res.cookie('kwl_msg', 'Booking updated successfully!');
    res.redirect('/viewBookings');
  } catch (error) {
    // Rollback transaction in case of error
    if (transaction) await transaction.rollback();
    console.error("Error during booking update:", error);

    res.cookie('kwl_msg', `Failed to Update! ${error}`);
    res.redirect('/viewBookings');
  } finally {
    if (pool) pool.close();
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




const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

const verifyLoginOtp = async (req, res, next) => {
  const { email, otp } = req.body;
  let pool;

  try {
    pool = await connection();

    // Check if email and OTP are provided
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    // Check login attempts
    const attemptsQuery = `
      SELECT * 
      FROM login_attempts_user 
      WHERE user_email = @userEmail
    `;
    const attemptsResult = await pool
      .request()
      .input('userEmail', sql.VarChar, email)
      .query(attemptsQuery);
    const loginAttempt = attemptsResult.recordset[0];

    if (loginAttempt) {
      const now = new Date();
      if (loginAttempt.lockout_until && now < loginAttempt.lockout_until) {
        const remainingTime = Math.ceil((loginAttempt.lockout_until - now) / 60000); // Remaining time in minutes
        return res.status(400).json({
          success: false,
          message: `Account locked. Try again after ${remainingTime} minutes.`,
        });
      }
    }

    // Check if OTP is valid and not expired
    const otpQuery = `
      SELECT * 
      FROM tbl_login_otp 
      WHERE email = @userEmail AND otp = @otp AND expires_at > GETDATE()
    `;
    const otpResult = await pool
      .request()
      .input('userEmail', sql.VarChar, email)
      .input('otp', sql.VarChar, otp)
      .query(otpQuery);

    if (otpResult.recordset.length === 0) {
      // Increment login attempts
      if (loginAttempt) {
        const attempts = loginAttempt.attempts + 1;
        let lockoutUntil = null;
        if (attempts >= MAX_ATTEMPTS) {
          lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION);
        }
        const updateAttemptsQuery = `
          UPDATE login_attempts_user
          SET attempts = @attempts, last_attempt = GETDATE(), lockout_until = @lockoutUntil
          WHERE user_email = @userEmail
        `;
        await pool
          .request()
          .input('attempts', sql.Int, attempts)
          .input('lockoutUntil', sql.DateTime, lockoutUntil)
          .input('userEmail', sql.VarChar, email)
          .query(updateAttemptsQuery);
      } else {
        const insertAttemptQuery = `
          INSERT INTO login_attempts_user (user_email, attempts, last_attempt, lockout_until)
          VALUES (@userEmail, 1, GETDATE(), NULL)
        `;
        await pool
          .request()
          .input('userEmail', sql.VarChar, email)
          .query(insertAttemptQuery);
      }
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // OTP is valid, reset login attempts
    const resetAttemptsQuery = `
      DELETE FROM login_attempts_user 
      WHERE user_email = @userEmail
    `;
    await pool.request().input('userEmail', sql.VarChar, email).query(resetAttemptsQuery);

    // Remove OTP from database
    const deleteOtpQuery = `
      DELETE FROM tbl_login_otp 
      WHERE email = @userEmail
    `;
    await pool.request().input('userEmail', sql.VarChar, email).query(deleteOtpQuery);

    // Successful verification
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error during OTP verification:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    if (pool) pool.close();
  }
};






const verifyLoginOtpwithoutlock = async (req, res, next) => {
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
    const user = userResult.recordset[0];

    if (userResult.recordset.length === 0) {
      // Email not registered
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Email not registered' });
    }

    
    // =============================== active seetion start ===============================

    const activeSessionQuery = `
    SELECT * FROM active_sessions_user WHERE user_email = @user_email
  `;
  const activeSessionResult = await pool.request()
    .input('user_email', sql.NVarChar, user.user_email) // Corrected data type to sql.NVarChar
    .query(activeSessionQuery);
  
  const activeSession = activeSessionResult.recordset[0];
  
  if (activeSession) {
    return res.render('index', {
      output: 'You are already logged in from another device.',
      user_email: user.user_email,
       showModal: true // Flag to show the modal
    });
  }
  // =============================== active seetion end ===============================

    // User exists, send token
 
    sendTokenUser(user, 200, res,pool);

    await transaction.commit(); // Commit the transaction if successful
  } catch (error) {
    if (transaction) await transaction.rollback(); // Rollback transaction on error
    console.error("error ->", error.message);
    res.render('kil500', { output: `${error}` });
  } finally {
    // if (pool) pool.close(); // Close the connection pool
  }
};





const logoutandProceed = async (req, res) => {
  console.log("logoutandProceed")
  let pool;

  try {
    // Establish MSSQL connection
    pool = await connection();

    // Get the user ID from the JWT token (if implemented)
    const user_email  = req.body.user_email

        // Fetch user user
    const userQuery = `
      SELECT * 
      FROM tbl_bookings 
      WHERE user_email = @user_email
    `;
    const userResult = await pool.request().input('user_email', user_email).query(userQuery);
    const user = userResult.recordset[0];
   const { token, options }  =  await sendTokenUserogoutandProceed(user, 200, res);


    const activeSessionQuery = `
    SELECT * FROM active_sessions_user WHERE user_email = @user_email
  `;

  const activeSessionResult = await pool
  .request()
  .input('user_email', sql.NVarChar, user.user_email)
  .query(activeSessionQuery);


  
  const activeSession = activeSessionResult.recordset[0];
  
  // If there is an active session, delete it
  if (activeSession) {
    const deleteSessionQuery = `
      DELETE FROM active_sessions_user WHERE user_email = @user_email
    `;
    await pool
      .request()
      .input('user_email', sql.NVarChar, user.user_email)
      .query(deleteSessionQuery);
  }

  // Store the new session
  const insertSessionQuery = `
    INSERT INTO active_sessions_user (user_email, token) 
    VALUES (@user_email, @token)
  `;
  await pool
    .request()
    .input('user_email', sql.NVarChar, user.user_email)
    .input('token', sql.NVarChar, token)
    .query(insertSessionQuery);


    res.status(200).cookie('User_kwl_token',token,options).redirect('/viewBookings')     

  } catch (error) {
    console.error('Error logging out user:', error);
    res.render('kil500', { output: `${error}` });
  } finally {
   if (pool) pool.close();
  }
};



const logout = async (req, res) => {
  let pool;

  try {
    // Establish MSSQL connection
    pool = await connection();


 const user_email = req.user ? req.user.user_email : 'Guest Mode';

      // Clear the active session for the admin
      const deleteSessionQuery = `
        DELETE FROM active_sessions_user WHERE user_email = @user_email
      `;
      await pool.request()
        .input('user_email', sql.NVarChar, user_email)
        .query(deleteSessionQuery);


        res.cookie("User_kwl_token", null, {
          expires: new Date(Date.now()),
          httpOnly: true
        });

    // Redirect to the superadmin login page
    res.redirect('/');
  } catch (error) {
    console.error('Error logging out admin:', error);
    res.render('kil500', { output: `${error}` });
  } finally {
    if (pool) pool.close();
  }
};



const logoutold = async (req, res) => {

  const userName = req.user ? req.user.user_email : 'Guest Mode';
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






const acuityBookings = async (req, res, next) => {

  console.log("new booking request ", req.body)
  let pool;
  let transaction;

  try {
    pool = await connection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();


    const acuityUrl =  `https://acuityscheduling.com/api/v1/appointments`


    const response = await axios.get(acuityUrl, {
      auth: {
        username: '19354905',       // Replace with actual username
        password: 'b0a1d960446f9efab07df16c4c16b444'  // Replace with actual password
      }
    });
  
  
    const bookings  = response.data;



    await transaction.commit();
    res.status(200).json({ success: true ,bookings  });
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }finally{
    if (pool) pool.close(); // Close the pool
  } 
};


const escapeSingleQuotes = (str) => {
  if (typeof str === 'string') {
    return str.replace(/'/g, "''"); // Escape single quotes
  }
  return str;
};


const fetchAndSyncAcuityBookings = async (req, res, next) => {
  let pool;
  let transaction;
  let totalFetched = 0;
  let alreadyExists = 0;
  let insertedCount = 0;
  let skippedCount = 0;

  try {
    // Fetch bookings from Acuity API
    const acuityResponse = await axios.get('https://acuityscheduling.com/api/v1/appointments', {
      auth: { username: '19354905', password: 'b0a1d960446f9efab07df16c4c16b444' },
    });
    const acuityBookings = acuityResponse.data;
    totalFetched = acuityBookings.length;

    pool = await connection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    for (const appointment of acuityBookings) {
      try {
        const bookingId = appointment.id || 'Not Available';
        const trn = appointment.trn || 'Not Available';
        const firstname = escapeSingleQuotes(appointment.firstName || 'Not Available');
        const lastname = escapeSingleQuotes(appointment.lastName || 'Not Available');
        const contact = escapeSingleQuotes(appointment.phone || 'Not Available');
        const country_code = appointment.countryCode || '';
        const user_email = escapeSingleQuotes(appointment.email || 'Not Available');
        const timezone = appointment.timezone || 'Not Available';
        const datetime = appointment.datetime || 'Not Available';
        const booking_date = appointment.datetime ? moment(appointment.datetime).format('YYYY-MM-DD') : 'Not Available';
        const location = escapeSingleQuotes(appointment.location || 'Not Available');
        const appointment_by = 'Acuity';
        const booking_by = 'Acuity';
        const booking_status ='Confirmed';


        const created_at = moment(appointment.datetimeCreated, 'YYYY-MM-DDTHH:mm:ssZ').format('YYYY-MM-DD HH:mm:ss.SSSSSSSZ');

        // Extract custom form fields
        const formFields = appointment.forms[0]?.values || [];
        const agent_forwarder = escapeSingleQuotes(formFields.find(field => field.name === 'Agent/Freight Forwarder')?.value || 'Not Available');
        const appointment_type = escapeSingleQuotes(formFields.find(field => field.name === 'Appointment Type')?.value || 'Not Available');
        const bol_number = escapeSingleQuotes(formFields.find(field => field.name === 'BL or Order Number')?.value || 'Not Available');
        const vessel_name = escapeSingleQuotes(formFields.find(field => field.name === 'Vessel Name')?.value || 'Not Available');
        const vessel_reported_date = escapeSingleQuotes(formFields.find(field => field.name === 'Vessel Reported Date')?.value || 'Not Available');
        const chassis_number = escapeSingleQuotes(formFields.find(field => field.name === 'Chassis Number')?.value || 'Not Available');
        const declaration_number = escapeSingleQuotes(formFields.find(field => field.name === 'Declaration Number')?.value || 'Not Available');
        const container_number = escapeSingleQuotes(formFields.find(field => field.name === 'Container Number')?.value || 'Not Available');
        const number_of_items = escapeSingleQuotes(formFields.find(field => field.name === 'Number of Pieces/Packages')?.value || 'Not Available');

        // Check if the booking already exists
        const checkQuery = `SELECT COUNT(*) AS count FROM tbl_bookings WHERE booking_id = '${bookingId}'`;
        const checkResult = await transaction.request().query(checkQuery);
        if (checkResult.recordset[0].count > 0) {
          alreadyExists++;
          continue; // Skip if booking already exists
        }

        // Insert the new booking
        const insertQuery = 
          `INSERT INTO tbl_bookings (
            booking_id, trn, firstname, lastname, contact, country_code, user_email,
            agent_forwarder, appointment_by, appointment_type, bol_number,
            vessel_name, vessel_reported_date, chassis_number, declaration_number,
            container_number, number_of_items, booking_date, booking_times,
            timezone, location, created_at, booking_by, booking_status
          ) VALUES (
            '${escapeSingleQuotes(bookingId)}', '${escapeSingleQuotes(trn)}', '${firstname}', '${lastname}', '${contact}', '${country_code}', '${user_email}',
            '${agent_forwarder}', '${appointment_by}', '${appointment_type}', '${bol_number}',
            '${vessel_name}', '${vessel_reported_date}', '${chassis_number}', '${declaration_number}',
            '${container_number}', '${number_of_items}', '${booking_date}', '${datetime}',
            '${timezone}', '${location}','${created_at}', '${booking_by}', '${booking_status}'
          );`;

        try {
          await transaction.request().query(insertQuery);
          insertedCount++;
        } catch (insertError) {
          console.error(`Error inserting booking ID ${bookingId}:`, insertError.message);
          skippedCount++;
        }
      } catch (error) {
        console.error(`Error processing booking ID ${appointment.id}:`, error.message);
        skippedCount++;
      }
    }

    await transaction.commit();
    res.status(200).json({
      success: true,
      totalFetched,
      alreadyExists,
      insertedCount,
      skippedCount,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error syncing Acuity bookings:', error.message);
    res.status(500).json({ success: false, message: 'Failed to sync bookings' });
  } finally {
    if (pool) pool.close();
  }
};


const fetchAndSyncAcuityBookings1 = async (req, res, next) => {
  let pool;
  let transaction;
  let totalFetched = 0;
  let alreadyExists = 0;
  let insertedCount = 0;
  let skippedCount = 0;

  try {
    // Fetch bookings from Acuity API
    const acuityResponse = await axios.get('https://acuityscheduling.com/api/v1/appointments', {
      auth: { username: '19354905', password: 'b0a1d960446f9efab07df16c4c16b444' },
    });
    const acuityBookings = acuityResponse.data;
    totalFetched = acuityBookings.length;

    pool = await connection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    for (const appointment of acuityBookings) {
      try {
        const bookingId = appointment.id || 'Not Available';
        const trn = appointment.trn || 'Not Available';
        const firstname = appointment.firstName || 'Not Available';
        const lastname = appointment.lastName || 'Not Available';
        const contact = appointment.phone || 'Not Available';
        const country_code = appointment.countryCode || '';
        const user_email = appointment.email || 'Not Available';
        const timezone = appointment.timezone || 'Not Available';
        const datetime = appointment.datetime || 'Not Available';
        const booking_date = appointment.datetime ? moment(appointment.datetime).format('YYYY-MM-DD') : 'Not Available';
        const location = appointment.location || 'Not Available';
        const appointment_by = 'Acuity';
        const booking_by = 'Acuity';

        // Extract custom form fields
        const formFields = appointment.forms[0]?.values || [];
        const agent_forwarder = formFields.find(field => field.name === 'Agent/Freight Forwarder')?.value || 'Not Available';
        const appointment_type = formFields.find(field => field.name === 'Appointment Type')?.value || 'Not Available';
        const bol_number = formFields.find(field => field.name === 'BL or Order Number')?.value || 'Not Available';
        const vessel_name = formFields.find(field => field.name === 'Vessel Name')?.value || 'Not Available';
        const vessel_reported_date = formFields.find(field => field.name === 'Vessel Reported Date')?.value || 'Not Available';
        const chassis_number = formFields.find(field => field.name === 'Chassis Number')?.value || 'Not Available';
        const declaration_number = formFields.find(field => field.name === 'Declaration Number')?.value || 'Not Available';
        const container_number = formFields.find(field => field.name === 'Container Number')?.value || 'Not Available';
        const number_of_items = formFields.find(field => field.name === 'Number of Pieces/Packages')?.value || 'Not Available';

        // Check if the booking already exists
        const checkQuery = `SELECT COUNT(*) AS count FROM tbl_bookings WHERE booking_id = '${bookingId}'`;
        const checkResult = await transaction.request().query(checkQuery);
        if (checkResult.recordset[0].count > 0) {
          alreadyExists++;
          continue; // Skip if booking already exists
        }

        // Insert the new booking
        const insertQuery = 
          `INSERT INTO tbl_acuity_booking (
            booking_id, trn, firstname, lastname, contact, country_code, user_email,
            agent_forwarder, appointment_by, appointment_type, bol_number,
            vessel_name, vessel_reported_date, chassis_number, declaration_number,
            container_number, number_of_items, booking_date, booking_times,
            timezone, location, booking_by
          ) VALUES (
            '${bookingId}', '${trn}', '${firstname}', '${lastname}', '${contact}', '${country_code}', '${user_email}',
            '${agent_forwarder}', '${appointment_by}', '${appointment_type}', '${bol_number}',
            '${vessel_name}', '${vessel_reported_date}', '${chassis_number}', '${declaration_number}',
            '${container_number}', '${number_of_items}', '${booking_date}', '${datetime}',
            '${timezone}', '${location}','${booking_by}'
          );`;

        try {
          await transaction.request().query(insertQuery);
          insertedCount++;
        } catch (insertError) {
          console.error(`Error inserting booking ID ${bookingId}:`, insertError.message);
          skippedCount++;
        }
      } catch (error) {
        console.error(`Error processing booking ID ${appointment.id}:`, error.message);
        skippedCount++;
      }
    }

    await transaction.commit();
    res.status(200).json({
      success: true,
      totalFetched,
      alreadyExists,
      insertedCount,
      skippedCount,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error syncing Acuity bookings:', error.message);
    res.status(500).json({ success: false, message: 'Failed to sync bookings' });
  } finally {
    if (pool) pool.close();
  }
};




 //============================== User Login End ==============================================



//--------------------- Export Start ------------------------------------------
export { home , book , booking_availability , viewBookings , getLoginOtp ,verifyLoginOtp   , login , logout ,
  dates_availability , appointment_types , time_availability , getBookingOtp , verifyOTP , confirmbooking ,
  check_times , cancelBooking , reschedule ,rescheduleBooking ,updateBooking, acuityBookings , fetchAndSyncAcuityBookings ,
  logoutandProceed

 }

