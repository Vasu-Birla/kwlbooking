
import jwt from 'jsonwebtoken';
//import connection from '../config.js';
import { connection, sql } from '../config.js';
import dotenv from 'dotenv'
dotenv.config({path:"./config.env"});

const con = await connection();

const sendTokenAdminold = (admin, statusCode, res)=>{
    console.log("Correct ")
    const token =  getJWTToken(admin.admin_id ); 
    //options for tokens  
        const options = {
            expires: new Date(
                Date.now() + process.env.COOKIE_EXPIRE*24*60*60*1000
            ), 
            httpOnly:true
        }      
    res.status(statusCode).cookie('Admin_token',token,options).redirect('/superadmin')      
}


const sendTokenAdmin = async (admin, statusCode, res) => {
    let pool;
    try {
      // Ensure the pool is connected and open
      pool = await connection();
  
      const token = getJWTToken(admin.admin_id);
  
      // Options for tokens
      const options = {
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
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






const sendTokenUser = (user, statusCode, res)=>{
    
    const token =  getJWTTokenUSER(user.user_email); 
    

    //options for tokens  
        const options = {
            expires: new Date(
                Date.now() + process.env.COOKIE_EXPIRE*24*60*60*1000
            ), 
            httpOnly:true
        }                 
        //res.redirect('/user/home/')
        console.log("login success", user.user_email)
        res.status(statusCode).cookie('User_kwl_token',token,options).redirect('/viewBookings')      
    
       
}




function getJWTToken(id){ 
    return jwt.sign({id:id},process.env.JWT_SECRET,{ expiresIn: process.env.JWT_EXPIRE })
}

function getJWTTokenUSER(user_email) { 
    return jwt.sign({ user_email: user_email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
}


export {sendTokenUser , sendTokenAdmin }
