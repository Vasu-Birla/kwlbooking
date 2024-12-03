
import jwt from 'jsonwebtoken';
//import connection from '../config.js';
import { connection, sql } from '../config.js';
import dotenv from 'dotenv'
dotenv.config({path:"./config.env"});



// const sendTokenAdmin = (admin, statusCode, res)=>{
//   console.log("normal login")
//     const token =  getJWTToken(admin.admin_id ); 
//     //options for tokens  
//         const options = {
//             expires: new Date(
//                 Date.now() + process.env.COOKIE_EXPIRE*24*60*60*1000
//             ), 
//             httpOnly:true
//         }      
//     res.status(statusCode).cookie('Admin_token',token,options).redirect('/superadmin')      
// }



const sendTokenAdminlogoutandProceed = async (admin, statusCode, res)=>{
  console.log("Correct ")
  const token =  getJWTToken(admin.admin_id ); 
  //options for tokens  
      // const options = {
      //     expires: new Date(
      //         Date.now() + process.env.COOKIE_EXPIRE*24*60*60*1000
      //     ), 
      //     httpOnly:true
      // }   
      
      const options = {
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
        //secure: process.env.NODE_ENV === 'production', // Use Secure flag only in production
        sameSite: 'Strict', // Optional: Prevents CSRF attacks by limiting cross-site cookie usage
      };
  // // Send token in JSON response
  // return res.status(statusCode).json({
  //   success: true,
  //   token,
  // });

  return { token, options };
}






const sendTokenAdmin = async (admin, statusCode, res,pool) => {

  if (!pool || pool.connected === false) {
    console.log("Pool is not connected, reconnecting...");
    pool = await connection(); // Reconnect if not connected
  }

  
  // const pool = await connection();
  console.log('Connected:', pool.connected);
    try {
     
      const token = getJWTToken(admin.admin_id);
  
      // Options for tokens
      // const options = {
      //   expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
      //   httpOnly: true,
      // };

      const options = {
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
       // secure: process.env.NODE_ENV === 'production', // Use Secure flag only in production
        sameSite: 'Strict', // Optional: Prevents CSRF attacks by limiting cross-site cookie usage
      };
  
      // Check if there are existing active sessions for the admin
      const activeSessionQuery = `
        SELECT * FROM active_sessions_admin WHERE admin_id = @admin_id
      `;
      const activeSessionResult = await pool
        .request()
        .input('admin_id', sql.Int, admin.admin_id)
        .query(activeSessionQuery);
  
      const activeSession = activeSessionResult.recordset[0];
  
      // If there is an active session, delete it
      if (activeSession) {
        const deleteSessionQuery = `
          DELETE FROM active_sessions_admin WHERE admin_id = @admin_id
        `;
        await pool
          .request()
          .input('admin_id', sql.Int, admin.admin_id)
          .query(deleteSessionQuery);
      }
  
      // Store the new session
      const insertSessionQuery = `
        INSERT INTO active_sessions_admin (admin_id, token) 
        VALUES (@admin_id, @token)
      `;
      await pool
        .request()
        .input('admin_id', sql.Int, admin.admin_id)
        .input('token', sql.NVarChar, token)
        .query(insertSessionQuery);
  
      // Send the token in the response
      res.status(statusCode).cookie('Admin_token', token, options).redirect('/superadmin');
    } catch (error) {
      console.error('Error storing session or sending token:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      // Ensure the pool is closed properly
      if (pool) pool.close();
    }
  };






// const sendTokenUser = (user, statusCode, res)=>{
    
//     const token =  getJWTTokenUSER(user.primary_email); 
    

//     //options for tokens  
//         const options = {
//             expires: new Date(
//                 Date.now() + process.env.COOKIE_EXPIRE*24*60*60*1000
//             ), 
//             httpOnly:true
//         }                 
//         //res.redirect('/user/home/')
//         console.log("login success", user.primary_email)
//         res.status(statusCode).cookie('User_kwl_token',token,options).redirect('/viewBookings')      
    
       
// }



const sendTokenUserogoutandProceed = async (user, statusCode, res)=>{
    
  const token =  getJWTTokenUSER(user.primary_email); 
  

  //options for tokens  
      const options = {
          expires: new Date(
              Date.now() + process.env.COOKIE_EXPIRE*24*60*60*1000
          ), 
          httpOnly:true
      }                 
      return { token, options };   
  
     
}








const sendTokenUser = async (user, statusCode, res,pool) => {

  if (!pool || pool.connected === false) {
    console.log("Pool is not connected, reconnecting...");
    pool = await connection(); // Reconnect if not connected
  }

  
  // const pool = await connection();
  console.log('Connected:', pool.connected);
    try {
     
      const token =  getJWTTokenUSER(user.primary_email); 
      const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRE*24*60*60*1000
        ), 
        httpOnly:true
    } 
      // Check if there are existing active sessions for the admin
      const activeSessionQuery = `
        SELECT * FROM active_sessions_user WHERE user_email = @user_email
      `;
      const activeSessionResult = await pool
        .request()
        .input('user_email', sql.NVarChar, user.primary_email)
        .query(activeSessionQuery);
  
      const activeSession = activeSessionResult.recordset[0];
  
      // If there is an active session, delete it
      if (activeSession) {
        const deleteSessionQuery = `
          DELETE FROM active_sessions_user WHERE user_email = @user_email
        `;
        await pool
          .request()
          .input('user_email', sql.NVarChar, user.primary_email)
          .query(deleteSessionQuery);
      }
  
      // Store the new session
      const insertSessionQuery = `
        INSERT INTO active_sessions_user (user_email, token) 
        VALUES (@user_email, @token)
      `;
      await pool
        .request()
        .input('user_email', sql.NVarChar, user.primary_email)
        .input('token', sql.NVarChar, token)
        .query(insertSessionQuery);
  
      // Send the token in the response
      res.status(statusCode).cookie('User_kwl_token',token,options).redirect('/viewBookings')      
    } catch (error) {
      console.error('Error storing session or sending token:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      // Ensure the pool is closed properly
      if (pool) pool.close();
    }
  };





function getJWTToken(id){ 
    return jwt.sign({id:id},process.env.JWT_SECRET,{ expiresIn: process.env.JWT_EXPIRE })
}

function getJWTTokenUSER(user_email) { 
    return jwt.sign({ user_email: user_email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
}


export {sendTokenUser , sendTokenAdmin ,sendTokenAdminlogoutandProceed , sendTokenUserogoutandProceed }
