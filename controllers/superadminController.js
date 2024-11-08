//import connection from "../config.js";

import { connection, sql } from '../config.js';

import * as path from 'path';
import * as url from 'url';
import {sendTokenAdmin} from "../utils/jwtToken.js";
import {hashPassword, comparePassword } from '../middleware/helper.js'
import moment from 'moment-timezone';
import { contains } from "cheerio";
// moment.tz.setDefault('Asia/Hong_Kong');

const __dirname = url.fileURLToPath(new URL('.',import.meta.url));


//=========================== Start Web  Services =============================




  const home = async (req, res, next) => {
    const pool = await connection();
    const transaction = new sql.Transaction(pool);
    const output = req.cookies.rental_msg || '';
  
    try {
      await transaction.begin(); // Begin the transaction
  
      // Create a request object tied to the transaction
      const request = transaction.request();
      
      // If you have specific SQL queries, add them here using `request.query(...)`
      // For example:
      // await request.query('UPDATE some_table SET column = value WHERE condition');
  
      // Commit the transaction after rendering if everything is successful
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
  const output = req.cookies.rental_msg || '';

  try {
    await transaction.begin(); // Begin the transaction

    const request = transaction.request();
    
    // Add any necessary SQL queries related to appointments here
    // For example:
    // await request.query('SELECT * FROM appointments WHERE condition');

    // Commit the transaction after rendering if everything is successful
    await transaction.commit();

    res.render('superadmin/appointments', { output: output });
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




  



  
const index = async (req, res, next) => {
  const con = await connection();
  const output= req.cookies.rental_msg || '';
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
  const output= req.cookies.rental_msg || '';
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

    res.cookie('rental_msg', 'Admin updated successfully!');
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

      res.cookie('rental_msg', 'Old password is incorrect');
     return res.redirect('/superadmin/profile')
    }

    if(opass == cpass ){
      //return res.render('superadmin/profile',{"output":"New password cannot be the same as the old password."})

      res.cookie('rental_msg', 'New password cannot be the same as the old password.');
      return res.redirect('/superadmin/profile')
    }


    if (npass !== cpass) {
     // return res.render('superadmin/profile',{"output":"New password and confirm password do not match"})

      res.cookie('rental_msg', 'New password and confirm password do not match');
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
    res.cookie('rental_msg', `failed to Update Password ${error}`);
    return res.redirect('/superadmin/profile')
 
  }finally {
    con.release(); 
  }
};











  




//================================== END CONTROLLER +++++++++++++++++++++++++++++++++++++++++++++++++++

export {home, loginAdmin ,login , logout ,error404 , error500,  index,profile,profilePost,
   updateUserPic,updateAdmin ,changepass ,  ForgotPassword,sendOTP,verifyOTP,resetpassword , 
   
   appointments
   
  

} 