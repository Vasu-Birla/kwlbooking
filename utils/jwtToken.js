
import jwt from 'jsonwebtoken';
//import connection from '../config.js';
import { connection, sql } from '../config.js';
import dotenv from 'dotenv'
dotenv.config({path:"./config.env"});

const con = await connection();

const sendTokenAdmin = (admin, statusCode, res)=>{
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
