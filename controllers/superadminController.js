//import connection from "../config.js";

import { connection, sql } from '../config.js';

import axios from 'axios';

import ejs from 'ejs';

// import * as path from 'path';
import * as url from 'url';

import fs from 'fs';
import path from 'path';

import {sendTokenAdmin} from "../utils/jwtToken.js";
import {hashPassword, comparePassword } from '../middleware/helper.js'
import moment from 'moment-timezone';
import { contains } from "cheerio";
import { count } from 'console';
// moment.tz.setDefault('Asia/Hong_Kong');

const __dirname = url.fileURLToPath(new URL('.',import.meta.url));


//=========================== Start Web  Services =============================





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
  const output = req.cookies.kwl_msg || '';

  let pool;
  let transaction;

  try {
      pool = await connection();
      transaction = new sql.Transaction(pool);
      await transaction.begin(); // Begin the transaction

      // Create a request object tied to the transaction
      const request = transaction.request();

      // Fetch counts
      const result = await request.query(`
          SELECT 
              COUNT(*) AS totalAppointments,
              COUNT(CASE WHEN booking_date = CONVERT(date, GETDATE()) THEN 1 END) AS todaysAppointments,
              COUNT(CASE WHEN booking_date > GETDATE() THEN 1 END) AS upcomingAppointments,
              COUNT(CASE WHEN booking_status = 'Cancelled' THEN 1 END) AS cancelledAppointments
          FROM tbl_bookings
      `);

      // Commit the transaction after successful query
      await transaction.commit();

      const counts = result.recordset[0];

      console.log("counts -> ", counts)

      // Render with counts passed to the template
      res.render('superadmin/index', { 
          output: output,
          counts: counts 
      });
  } catch (error) {
      // Rollback if an error occurs
      if (transaction) await transaction.rollback();
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
  } finally {
      // Close the pool to release resources
      if (pool) pool.close();
  }
};



  const homeold = async (req, res, next) => {
 
    const output = req.cookies.kwl_msg || '';

    let pool;
    let transaction;
  
    try {

      pool = await connection();
      transaction = new sql.Transaction(pool);
      await transaction.begin(); // Begin the transaction
  
      // Create a request object tied to the transaction
      const request = transaction.request();
      
   
      await transaction.commit();
  
      res.render('superadmin/index', { output: output });
    } catch (error) {
      // Rollback if an error occurs
      if (transaction) {
        await transaction.rollback();
      }
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
    } finally {
      // Close the pool to release resources
      if (pool) {
        pool.close();
      }
    }
  };






const appointments = async (req, res, next) => {
  const pool = await connection();
  const transaction = new sql.Transaction(pool);
  const output = req.cookies.kwl_msg || '';

  try {
    await transaction.begin(); // Begin the transaction

    const request = transaction.request();

    // Commit the transaction if everything is successful
    await transaction.commit();
    // Execute the query directly without wrapping in a transaction for SELECT statements
    const result = await pool.request().query('SELECT * FROM tbl_bookings ORDER BY created_at DESC');
        
    //const bookings = result.recordset; // Access the result set in `mssql`
    const bookings = result.recordset.map((booking) => {
      // Parse and format booking_times if it exists
      if (booking.booking_times) {
        booking.booking_times = moment(booking.booking_times, "YYYY-MM-DDTHHmm:ssZ").format('hh:mm A');
      } else {
        booking.booking_times = 'N/A';
      }
      return booking;
    });
    
   // console.log('bookings:', bookings);
    res.render('superadmin/appointments', { output: output , bookings:bookings});
  } catch (error) {
    // Rollback if an error occurs
    if (transaction) {
      await transaction.rollback();
    }
    console.error('Error:', error);
    res.render('superadmin/kil500', { output: `${error}` });
  } finally {
    // Always close the pool to release resources
    if (pool) {
      pool.close();
    }
  }
};




  



  
const index = async (req, res, next) => {
  const con = await connection();
  const output= req.cookies.kwl_msg || '';
  try {

    await con.beginTransaction();
    res.render('superadmin/index1',{output:output}) 
    await con.commit();

  } catch (error) {
    await con.rollback();
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    con.release();
  }
};



const login = async (req, res, next) => {
  const pool = await connection();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin(); // Begin the transaction

    res.render('superadmin/login', { output: '' });

    await transaction.commit(); // Commit if successful
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    if (pool) {
      pool.close(); // Close the pool to release resources
    }
  }
};


const loginAdmin = async (req, res, next) => {
  const pool = await connection();

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.render('superadmin/login', { output: 'Please Enter Username and Password' });
    }

    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .query('SELECT * FROM tbl_admin WHERE username = @username');

    const admin = result.recordset[0];

    console.log("admin details ", admin)

    if (!admin) {
      console.log("Invalid username")
      return res.render('superadmin/login', { output: 'Invalid Username' });
    }

    const isValid = comparePassword(password, admin.password);
    if (!isValid) {
      console.log("Incorrect Password")
      return res.render('superadmin/login', { output: 'Incorrect Password' });
    }

    sendTokenAdmin(admin, 200, res);
  } catch (error) {
    console.error('Error during login:', error);
    res.render('superadmin/login', { output: 'An error occurred. Please try again later.' });
  } finally {
    if (pool) {
      pool.close();
    }
  }
};



const logout = async (req, res) => {
  try {
    res.cookie("Admin_token", null, {
      expires: new Date(Date.now()),
      httpOnly: true
    });
    res.redirect('/superadmin/login');
  } catch (error) {
    console.error('Error logging out admin:', error);
    res.render('superadmin/kil500', { output: `${error}` });
  }
};



  
    //----------------------- Profile Forgot Password Section Start ------------------------------------- 


    const ForgotPassword = async(req,res,next)=>{  

          
      try {
       res.render('superadmin/ForgotPassword', { 
         showForgotPasswordForm: true,
         showVerifyOTPPrompt: false,
         showResetPasswordForm: false,
         "output":"Enter Your Email"
       
       });
   
       
      } catch (error) {
     

         res.render('superadmin/kil500', { output: `${error}`,loggeduser:{} });
      }
 
 }


 

 const sendOTP = async (req, res, next) => {
  const con = await connection();
  const email = req.body.email; 
   try {
     
     await con.beginTransaction();

    var [isUser] =  await con.query('SELECT * FROM tbl_admin WHERE email = ?', [email]);

   if(isUser.length == 0){
  return  res.render('superadmin/ForgotPassword', {
      showForgotPasswordForm: true,
      showVerifyOTPPrompt: false,
      showResetPasswordForm: false,
      output: 'Invalid Email.',

    });
   }


     const otp = Math.floor(100000 + Math.random() * 900000); // Generate a random 6-digit OTP

     console.log("Otpppppppp ---> ",otp)

 
 
     // Check if the user's email already exists in tbl_otp
     const [results] = await con.query('SELECT * FROM tbl_otp WHERE email = ?', [email]);
 
     if (results.length === 0) {
       // Insert a new record in tbl_otp
       const currentTime = new Date();
       const expiryTime = new Date(currentTime.getTime() + 10 * 60000); // Expiry time is set to 10 minutes from the current time
       await con.query('INSERT INTO tbl_otp (email, otp_code, expire_at) VALUES (?, ?, ?)', [email, otp, expiryTime]);
     } else {
       // Update the existing record in tbl_otp
       const currentTime = new Date();
       const expiryTime = new Date(currentTime.getTime() + 10 * 60000); // Expiry time is set to 10 minutes from the current time
       await con.query('UPDATE tbl_otp SET otp_code = ?, expire_at = ? WHERE email = ?', [otp, expiryTime, email]);
     }
 
     await con.commit();
     // Call the function to send the OTP through the appropriate channel (e.g., email, SMS)
     await sendOTPFornewPass(email, otp);
 
     res.render('superadmin/ForgotPassword', {
       showForgotPasswordForm: false,
       showVerifyOTPPrompt: true,
       showResetPasswordForm: false,
       output: 'OTP sent successfully !!',
       email: email

     });
   } catch (error) {
     console.log(error);
     await con.rollback();
     res.render('superadmin/ForgotPassword', {
       showForgotPasswordForm: true,
       showVerifyOTPPrompt: false,
       showResetPasswordForm: false,
       output: 'Failed to send OTP. Internal server error.'
       
     });
   }
 };
 


const verifyOTP = async (req, res, next) => {

 const con = await connection();
 const userOTP = req.body.otp;
 const email = req.body.verifyEmail; 
 try {
 
   const [results] = await con.query('SELECT * FROM tbl_otp WHERE email = ?', [email]);
   const storedOTP = results[0].otp_code;
   const expiryTime = new Date(results[0].expire_at);

   console.log('storedOTP',storedOTP)
   
   console.log('userOTP',userOTP)

   // Verify the OTP
   if (userOTP == storedOTP && new Date() < expiryTime) {  console.log("correct OTP")
     res.render('superadmin/ForgotPassword', {
       showForgotPasswordForm: false,
       showVerifyOTPPrompt: false,
       showResetPasswordForm: true,
       output: '',
       email: email
     
     });
   } else { console.log(" Incorrect OTP")
     res.render('superadmin/ForgotPassword', {  
       showForgotPasswordForm: false,
       showVerifyOTPPrompt: true,
       showResetPasswordForm: false,
       output: 'Invalid or expired OTP. Please try again',
       email: email
    
     });
   }
 } catch (error) {
   console.error(error);
   res.json('Error in verifying OTP');
 }
};




const resetpassword = async(req,res,next)=>{ 
 const con = await connection();  
  
 const { resetemail, npass, cpass } = req.body;

 
try {

  await con.beginTransaction();

  var [[admin]] =  await con.query('SELECT * FROM tbl_admin WHERE email = ?', [resetemail]);

  let isValid = comparePassword( cpass, admin.password ); 

  if(isValid){
  
    await con.rollback();
    return res.render('superadmin/ForgotPassword', {
      showForgotPasswordForm: false,
      showVerifyOTPPrompt: false,
      showResetPasswordForm: true,
      "output":"New password cannot be the same as the old password",
      "email":resetemail
     
    });    
   }


 if (npass !== cpass) {
  await con.rollback();

  return res.render('superadmin/ForgotPassword', {
     showForgotPasswordForm: false,
     showVerifyOTPPrompt: false,
     showResetPasswordForm: true,
     "output":"New password and confirm password do not match",
     "email":resetemail
  
   });  

  }

  var hashedPass = hashPassword(cpass);


 await con.query('UPDATE tbl_admin SET password = ? WHERE email = ?', [hashedPass, resetemail ])

 const currentTime = new Date();
 await con.query('UPDATE tbl_otp SET otp_code = ?, expire_at = ? WHERE email = ?', ['0000', currentTime, resetemail]);

  //passwordNotify(resetemail)

  await con.commit();
 res.render('superadmin/login',{"output":"Password Reset successfully !"})


 
} catch (error) {
  console.log(error)
  await con.rollback();
 res.render('superadmin/ForgotPassword', { 
   showForgotPasswordForm: true,
   showVerifyOTPPrompt: false,
   showResetPasswordForm: false,
   "output":"Failed to Reset Password , Please Try Again "
  
 });
 
}
     

}

 
//------------------------------- Forgot Password End ---------------------------- 





  
  
  

 const error404 = async(req,res,next) => {
  const con = await connection();
  try {
      await con.beginTransaction();
     res.render('superadmin/error404',{'output':''})
     await con.commit(); 
  } catch (error) {
     console.error('Error:',error);
     res.status(500).send('Internal Server Error');
  } finally {
      con.release();
  }
}

const error500 = async(req,res,next) => {
  const con = await connection();
  try {
      await con.beginTransaction();
     res.render('superadmin/error500',{'output':''})
     await con.commit(); 
  } catch (error) {
     console.error('Error:',error);
     res.status(500).send('Internal Server Error');
  } finally {
      con.release();
  }
}




const profile = async(req,res,next) => {
  const con = await connection();
  const output= req.cookies.kwl_msg || '';
  try {
      await con.beginTransaction();

     await con.commit(); 

     res.render('superadmin/profile',{output:output})

  } catch (error) {
     console.error('Error:',error);
     await con.rollback(); 
     res.status(500).send('Internal Server Error');
  } finally {
      con.release();
  }
}


const updateUserPic = async (req, res, next) => {
  console.log("sala ",req.file)
  const con = await connection();


  try {
    await con.beginTransaction();

    var image = req.admin.image

    if (req.file) {
      image = req.file.filename;
    }
    await con.query('UPDATE tbl_admin SET image = ? WHERE admin_id  = ?', [image, req.admin.admin_id]);

    await con.commit();
    res.json({ msg: "success" })
  } catch (error) {
    await con.rollback();
    console.log("failed to update profile pic --> ", error)
    res.json({ msg: "failed" })
  } finally {
    con.release();
  }


}



const profilePost = async(req,res,next) => {
  const con = await connection();
  try {
      await con.beginTransaction();
      cost
     await con.commit(); 

     res.render('superadmin/profile',{output:''})

  } catch (error) {
     console.error('Error:',error);
     await con.rollback(); 
     res.status(500).send('Internal Server Error');
  } finally {
      con.release();
  }
}





const updateAdmin = async (req, res, next) => {
  const con = await connection();

  
  // Extract form data
  const { admin_id, first_name,last_name,email,country_code,contact , username } = req.body;
  
  // Handle uploaded image (if any)
  const image = req.file ? req.file.filename : null;  // Multer attaches 'file' if image is uploaded



  try {
    await con.beginTransaction();

    // Prepare the SQL query to update the vehicle type
    let updateQuery = `
      UPDATE tbl_admin 
      SET first_name = ?, last_name = ?, email = ? , username=?, country_code=? ,contact=?
    `;
    
    const queryValues = [first_name,last_name,email,username,country_code,contact];

    // Only update the image if a new one is provided
    if (image) {
      updateQuery += `, image = ?`;
      queryValues.push(image);
    }

    updateQuery += ` WHERE admin_id = ?`;
    queryValues.push(admin_id); 

    // Execute the query
    await con.query(updateQuery, queryValues);

    await con.commit(); // Commit the transaction

    res.cookie('kwl_msg', 'Admin updated successfully!');
    res.redirect('/superadmin/profile')


  } catch (error) {
    console.error('Error:', error);   
    await con.rollback(); // Rollback the transaction in case of error
    res.render('superadmin/kil500', { output: `${error}` });
  } finally {
    con.release(); // Release the database connection
  }

};


const changepass = async (req, res, next) => {
  const con = await connection();

  try {
    await con.beginTransaction();
    const existingPass = req.admin.password;

    const email = req.admin.email;
  
    const { opass, npass, cpass } = req.body;

   

    let isValid = comparePassword( opass, existingPass );          

    if (!isValid) {    
     // return res.render('superadmin/profile',{"output":"Old password is incorrect"})

      res.cookie('kwl_msg', 'Old password is incorrect');
     return res.redirect('/superadmin/profile')
    }

    if(opass == cpass ){
      //return res.render('superadmin/profile',{"output":"New password cannot be the same as the old password."})

      res.cookie('kwl_msg', 'New password cannot be the same as the old password.');
      return res.redirect('/superadmin/profile')
    }


    if (npass !== cpass) {
     // return res.render('superadmin/profile',{"output":"New password and confirm password do not match"})

      res.cookie('kwl_msg', 'New password and confirm password do not match');
      return res.redirect('/superadmin/profile')
     
    }


    // if (opass !== existingPass) {    
    //   return res.render('superadmin/profile',{"output":"Old password is incorrect"})
    // }
    // if (npass !== cpass) {
    //  return res.render('superadmin/profile',{"output":"New password and confirm password do not match"})
     
    // }
   
    var hashedPass = hashPassword(cpass);
   
    await con.query('UPDATE tbl_admin SET password = ? WHERE admin_id = ?', [hashedPass,req.admin.admin_id]);

        res.cookie("Admin_token",null,{
          expires : new Date(Date.now()),
          httpOnly:true
      })

    // passwordNotify(email)

    await con.commit();

    res.render('superadmin/login',{"output":"Password changed successfully" })
   
   
  } catch (error) {
    console.error('Error:', error);
    await con.rollback();
    res.cookie('kwl_msg', `failed to Update Password ${error}`);
    return res.redirect('/superadmin/profile')
 
  }finally {
    con.release(); 
  }
};
















//------------------ Appointments Section ------------------------------- 


const reschedule = async (req, res, next) => {
  let pool;
  let transaction;

  try {
    
    const output = req.cookies.kwl_msg || '';
    const booking_id = req.cookies.kwl_booking_id || 0;


    //----------------------   audit Logging -------------------------- 

    const acuityUrl =  `https://acuityscheduling.com/api/v1/appointments/${booking_id}?pastFormAnswers=false`
    const reason = "Fetching Single Appointment Details"
    const userName = req.admin ? req.admin.email : 'Guest Mode';
    const userRole = req.admin ? req.admin.admin_type : 'Superadmin';

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
   

    // Step 3: Merge Acuity data into internal booking data, adding `appointmentTypeID` and `calendarID`
    const booking = {
      ...internalBooking,
      appointmentTypeID: acuityBooking.appointmentTypeID,
      calendarID: acuityBooking.calendarID,
      acuityData: acuityBooking // Optionally, store other Acuity details if needed
    };

    

    console.log(booking)

    await transaction.commit(); // Commit the transaction if successful

    // Render the reschedule page with merged booking data
    res.render('superadmin/reschedule', { output, booking });
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





const cancelBooking = async (req, res, next) => {
  console.log("cancelling", req.body);
  let pool;
  let transaction;
  let acuityResponse;
  const { id, status, cancelNote } = req.body;



  try {

    
           //----------------------  admin audit Logging -------------------------- 

            const acuityUrl =  `https://acuityscheduling.com/api/v1/appointments/${id}/cancel?admin=true`
          const reason = "Cancelling Booking"
           const userName = req.admin ? req.admin.email : 'Guest Mode';
           const userRole = req.admin ? req.admin.admin_type : 'Superadmin';
       
          await logAcuityRequest(acuityUrl, userRole, userName, reason);
       
           //----------------------   audit Logging -------------------------- 
    // Step 1: Cancel booking in Acuity
     acuityResponse = await axios.put(
      `https://acuityscheduling.com/api/v1/appointments/${id}/cancel?admin=true`, 
      {
        noShow: true,
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





const rescheduleBooking = async (req, res, next) => {
  console.log(req.body)
  const { booking_id, selectedDateTimes, booking_date } = req.body;

  let pool;
  let transaction;

  try {


           //----------------------  admin audit Logging -------------------------- 

             const acuityUrl =  `https://acuityscheduling.com/api/v1/appointments/${booking_id}/reschedule?admin=true`
        const reason = "Rescheduling Booking"
           const userName = req.admin ? req.admin.email : 'Guest Mode';
           const userRole = req.admin ? req.admin.admin_type : 'Superadmin';
       
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

      var reurl = `https://acuityscheduling.com/api/v1/appointments/${booking_id}/reschedule?admin=true`;



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
        booking_times = '${formattedDatetime}',
        booking_status = 'Rescheduled'
    WHERE booking_id = ${booking_id}
`;


        // Perform the update query
        await transaction.request().query(query);
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

  const { booking_id, firstname, lastname, country_code, contact ,admin_note } = req.body;

  if (!booking_id || !firstname || !lastname || !country_code || !contact) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required.'
    });
  }

  let pool;
  let transaction;

  try {

    
           //----------------------  admin audit Logging -------------------------- 

         const acuityUrl =  `https://acuityscheduling.com/api/v1/appointments/${booking_id}?admin=true`
        const reason = "Updating Booking Deatils"
           const userName = req.admin ? req.admin.email : 'Guest Mode';
           const userRole = req.admin ? req.admin.admin_type : 'Superadmin';
       
          await logAcuityRequest(acuityUrl, userRole, userName, reason);
       
           //----------------------   audit Logging -------------------------- 
    // Step 1: Update the booking on Acuity
    const reurl = `https://acuityscheduling.com/api/v1/appointments/${booking_id}?admin=true`;

    const acuityResponse = await axios.put(
      reurl,
      {
        firstName: firstname,
        lastName: lastname,
        phone: contact,
        notes: admin_note,
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
    await transaction.commit();

    res.cookie('kwl_msg', 'Booking updated successfully!');
    res.redirect('/superadmin/appointments');

  } catch (error) {
    // Rollback if any error occurs
    if (transaction) await transaction.rollback();
    console.error("Error during booking update:", error);

    res.cookie('kwl_msg', `Failed to Update! ${error}`);
    res.redirect('/superadmin/appointments');
  } finally {
    if (pool) pool.close();
  }
};






const updateBooking11 = async (req, res) => {
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
    res.redirect('/superadmin/appointments');
  } catch (error) {
    // Rollback transaction in case of error
    if (transaction) await transaction.rollback();
    console.error("Error during booking update:", error);

    res.cookie('kwl_msg', `Failed to Update! ${error}`);
    res.redirect('/superadmin/appointments');
  } finally {
    if (pool) pool.close();
  }
};


  

//-----------------------------Reportssssssssssssss-> 




const reports = async (req, res, next) => {
  const pool = await connection();
  const transaction = new sql.Transaction(pool);
  const output = req.cookies.kwl_msg || '';
  const { startDate, endDate, option1 } = req.body; // Assuming the data comes from POST body for filters

  console.log("filter data ->",  req.body)

  try {
    await transaction.begin(); // Begin the transaction

    const request = transaction.request();

    // Build the dynamic query based on filters
    let query = 'SELECT * FROM tbl_bookings WHERE 1=1';

    if (startDate && endDate) {
      query += ` AND booking_date BETWEEN '${startDate}' AND '${endDate}'`;
    }

    if (option1) {
      query += ` AND booking_status = '${option1}'`;
    }

    const result = await pool.request().query(query);

    const bookings = result.recordset.map((booking) => {
      if (booking.booking_times) {
        booking.booking_times = moment(booking.booking_times, "YYYY-MM-DDTHHmm:ssZ").format('hh:mm A');
      } else {
        booking.booking_times = 'N/A';
      }
      return booking;
    });



console.log("reports ", bookings)

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      const renderedfilteredReports = await ejs.renderFile('views/superadmin/bookings_partial.ejs', { bookings });
      res.json({ html: renderedfilteredReports });
    } else {
      res.render('superadmin/reports', { output: output , bookings: bookings });
    }

    await transaction.commit();
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    console.error('Error:', error);
    res.render('superadmin/kil500', { output: `${error}` });
  } finally {
    if (pool) {
      pool.close();
    }
  }
};






const auditLogs = async (req, res, next) => {
  const output = req.cookies.kwl_msg || ''; // Handling cookie message

  let pool;
  let transaction;

  try {
    pool = await connection(); // Establish database connection
    transaction = new sql.Transaction(pool); // Create a new transaction instance
    await transaction.begin(); // Begin the transaction

    // Create a request object tied to the transaction
    const request = transaction.request();

    // Query to fetch audit logs in descending order by created_at
    const result = await request.query(`
      SELECT log_id, user_role, user_name, reason, acuity_url, created_at
      FROM tbl_logs
      ORDER BY created_at DESC
    `);

    // Commit the transaction after successful query
    await transaction.commit();

    console.log(result.recordset)

    // Render the audit logs page with the fetched data
    res.render('superadmin/auditlogs', {
      output: output,
      auditLogs: result.recordset // Pass the audit logs to the template
    });

  } catch (error) {
    // Rollback if an error occurs
    if (transaction) await transaction.rollback();
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    // Close the pool to release resources
    if (pool) pool.close();
  }
};







//================================== END CONTROLLER +++++++++++++++++++++++++++++++++++++++++++++++++++

export {home, loginAdmin ,login , logout ,error404 , error500,  index,profile,profilePost,
   updateUserPic,updateAdmin ,changepass ,  ForgotPassword,sendOTP,verifyOTP,resetpassword , 
   
   appointments , reschedule,cancelBooking,updateBooking , rescheduleBooking , reports, auditLogs
   
  

} 