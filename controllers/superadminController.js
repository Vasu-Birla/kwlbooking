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
              COUNT(CASE WHEN booking_status = 'Cancelled' THEN 1 END) AS cancelledAppointments,
              COUNT(CASE WHEN booking_status = 'Confirmed' THEN 1 END) AS ConfirmedAppointments
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
        
    // //const bookings = result.recordset; // Access the result set in `mssql`
    // const bookings = result.recordset.map((booking) => {
    //   // Parse and format booking_times if it exists
    //   if (booking.booking_times) {
    //     booking.booking_times = moment(booking.booking_times, "YYYY-MM-DDTHHmm:ssZ").format('hh:mm A');
    //   } else {
    //     booking.booking_times = 'N/A';
    //   }
    //   return booking;
    // });



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
      const acuityResponse = await axios.get(
        `https://acuityscheduling.com/api/v1/appointments/${booking.booking_id}?pastFormAnswers=false`,
        {
          auth: {
            username: '19354905', // Use actual username
            password: 'b0a1d960446f9efab07df16c4c16b444' // Use actual password
          }
        }
      );
      const acuityBooking = acuityResponse.data;
   

    // Step 3: Merge Acuity data into internal booking data, adding `appointmentTypeID` and `calendarID`
     booking = {
      ...booking,        
      timezone:acuityBooking.timezone,
      location:acuityBooking.location     
    };
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





const profile = async (req, res, next) => {
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

      

      await transaction.commit();

      const counts = result.recordset[0];
      // Render with counts passed to the template
      res.render('superadmin/profile',{output:output})
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






const updateUserPic = async (req, res, next) => {
  const output = req.cookies.kwl_msg || '';

  let pool;
  let transaction;

  try {
    let image = req.admin.image;
    if (req.file) {
      image = req.file.filename;
    }

    pool = await connection();
    transaction = new sql.Transaction(pool);

    // Ensure transaction begins successfully
    await transaction.begin();

    // Create a request object tied to the transaction
    const request = transaction.request();

    // Execute the update query
    await request
      .input('image', sql.NVarChar, image)
      .input('admin_id', sql.Int, req.admin.admin_id)
      .query('UPDATE tbl_admin SET image = @image WHERE admin_id = @admin_id');

    // Commit transaction
    await transaction.commit();

    res.json({ msg: "success" })
    // Render response with success
    //res.render('superadmin/profile', { output });
  } catch (error) {
    // Rollback if an error occurs
    if (transaction && transaction._isolationLevel) {
      await transaction.rollback();
    }
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    // Close the pool to release resources
    if (pool) pool.close();
  }
};


const profilePost = async (req, res, next) => {  console.log("updaing admin ", req.body)
  const output = req.cookies.kwl_msg || '';

  let pool;
  let transaction;
  const {  first_name, last_name, email, country_code, contact, username } = req.body;

  

  // Handle uploaded image (if any)
  const image = req.file ? req.file.filename : null; // Multer attaches 'file' if image is uploaded

  try {
    pool = await connection();
    transaction = new sql.Transaction(pool);
    await transaction.begin(); // Begin the transaction

    // Create a request object tied to the transaction
    const request = transaction.request();

    // Base update query
    let updateQuery = `
      UPDATE tbl_admin 
      SET first_name = @first_name, 
          last_name = @last_name, 
          email = @email, 
          username = @username, 
          country_code = @country_code, 
          contact = @contact
    `;

    // Add image field to the query if a new image is provided
    if (image) {
      updateQuery += `, image = @image`;
      request.input('image', sql.NVarChar, image);
    }

    // Finalize query with the WHERE clause
    updateQuery += ` WHERE admin_id = @admin_id`;

    // Bind the inputs
    request
      .input('first_name', sql.NVarChar, first_name)
      .input('last_name', sql.NVarChar, last_name)
      .input('email', sql.NVarChar, email)
      .input('username', sql.NVarChar, username)
      .input('country_code', sql.NVarChar, country_code)
      .input('contact', sql.NVarChar, contact)
      .input('admin_id', sql.Int, req.admin.admin_id);

    // Execute the query
    await request.query(updateQuery);

    // Commit the transaction
    await transaction.commit();

    // Set success message and redirect
    res.cookie('kwl_msg', 'Admin updated successfully!');
    res.redirect('/superadmin/profile');
  } catch (error) {
    // Rollback the transaction if an error occurs
    if (transaction) await transaction.rollback();
    console.error('Error:', error);
    res.render('superadmin/kil500', { output: `${error}` });
  } finally {
    // Release the pool resources
    if (pool) pool.close();
  }
};





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
  let pool;
  let transaction;

  try {
    pool = await connection(); // Get the connection pool
    transaction = new sql.Transaction(pool);
    await transaction.begin(); // Begin the transaction

    const existingPass = req.admin.password;
    const email = req.admin.email;

    const { opass, npass, cpass } = req.body;

    // Validate the old password
    const isValid = comparePassword(opass, existingPass);

    if (!isValid) {
      res.cookie('kwl_msg', 'Old password is incorrect');
      return res.redirect('/superadmin/profile');
    }

    if (opass === cpass) {
      res.cookie('kwl_msg', 'New password cannot be the same as the old password.');
      return res.redirect('/superadmin/profile');
    }

    if (npass !== cpass) {
      res.cookie('kwl_msg', 'New password and confirm password do not match.');
      return res.redirect('/superadmin/profile');
    }

    // Hash the new password
    const hashedPass = hashPassword(cpass);

    // Update the password in the database
    const request = transaction.request();
    await request
      .input('hashedPass', sql.NVarChar, hashedPass)
      .input('admin_id', sql.Int, req.admin.admin_id)
      .query('UPDATE tbl_admin SET password = @hashedPass WHERE admin_id = @admin_id');

    // Clear the Admin token cookie
    res.cookie('Admin_token', null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

    // Uncomment this line to send a password change notification email
    // passwordNotify(email);

    await transaction.commit(); // Commit the transaction

    // Redirect to login page with success message
    res.render('superadmin/login', { output: 'Password changed successfully' });
  } catch (error) {
    console.error('Error:', error);

    if (transaction) await transaction.rollback(); // Rollback the transaction on error

    res.cookie('kwl_msg', `Failed to update password: ${error.message}`);
    return res.redirect('/superadmin/profile');
  } finally {
    if (pool) pool.close(); // Release the pool
  }
};


const changepass111 = async (req, res, next) => {
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
      type_name:acuityBooking.type,
      calendarID: acuityBooking.calendarID,      
      timezone:acuityBooking.timezone,
      location:acuityBooking.location,
      acuityData: acuityBooking
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
  const { id, status, cancelNote ,booking_datetime } = req.body;



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



      await transaction.request()
      .input('user_role', sql.NVarChar, userRole)
      .input('user_name', sql.NVarChar, userName)
      .input('reason', sql.NVarChar, status)
      .input('acuity_url', sql.NVarChar, acuityUrl)
      .input('booking_id', sql.Int, id)
      .input('booking_datetime', sql.NVarChar, booking_datetime || '') // use empty string if null
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





const rescheduleBooking = async (req, res, next) => {
  console.log(req.body)
  const { booking_id, selectedDateTimes, booking_date , booking_datetime , timezone} = req.body;

  console.log("reqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq", req.body)

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
const old_datetime = `${old_date}, ${new_time}`;

// Combine the formatted booking date and old time into the new datetime
const new_datetime = `${booking_date}, ${old_time}`;


        //  const old_datetime = `${old_date},${new_time}`
        //   const new_datetime = `${booking_date},${old_time}`

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

  const { booking_id, firstname, lastname, country_code, contact ,admin_note, booking_datetime } = req.body;

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


    var reason1 = 'Updated'

    await transaction.request()
    .input('user_role', sql.NVarChar, userRole)
    .input('user_name', sql.NVarChar, userName)
    .input('reason', sql.NVarChar, reason1)
    .input('acuity_url', sql.NVarChar, acuityUrl)
    .input('booking_id', sql.Int, booking_id)
    .input('booking_datetime', sql.NVarChar, booking_datetime || '') // use empty string if null
    .input('new_datetime', sql.NVarChar,'') // use empty string if null
    .query(`
        INSERT INTO tbl_booking_logs 
        (user_role, user_name, reason, acuity_url, booking_id, booking_datetime, new_datetime) 
        VALUES (@user_role, @user_name, @reason, @acuity_url, @booking_id, @booking_datetime, @new_datetime)
    `);
    

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

  console.log("filter data ->",  req.body);

  try {
    await transaction.begin(); // Begin the transaction

    const request = transaction.request();

    // Build the dynamic query based on filters
    let query = 'SELECT * FROM tbl_bookings WHERE 1=1';

    // Check if startDate and endDate are provided
    if (startDate && endDate) {
      const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
      const formattedEndDate = moment(endDate).format('YYYY-MM-DD');
      
      // If option1 is empty, filter by created_at, otherwise filter by booking_date
      if (option1 === '') {
        query += ` AND CAST(created_at AS DATE) BETWEEN '${formattedStartDate}' AND '${formattedEndDate}'`;
      } else {
        query += ` AND booking_date BETWEEN '${formattedStartDate}' AND '${formattedEndDate}'`;
      }
    }

    // Apply booking_status filter if option1 is provided (not empty)
    if (option1 && option1 !== '') {
      query += ` AND booking_status = '${option1}'`;
    }

    console.log("Query to execute:", query);

    const result = await pool.request().query(query);

    const bookings = result.recordset.map((booking) => {
      if (booking.booking_times) {
        booking.booking_times = moment(booking.booking_times, "YYYY-MM-DDTHHmm:ssZ").format('hh:mm A');
      } else {
        booking.booking_times = 'N/A';
      }
      return booking;
    });

    console.log("reports ", bookings);

    // Return filtered data as HTML for AJAX requests
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      const renderedfilteredReports = await ejs.renderFile('views/superadmin/bookings_partial.ejs', { bookings });
      res.json({ html: renderedfilteredReports });
    } else {
      res.render('superadmin/reports', { output: output, bookings: bookings });
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



const reports1 = async (req, res, next) => {
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
    res.render('superadmin/auditLogs', {
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