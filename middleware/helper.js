import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { connection, sql } from '../config.js';
import crypto from 'crypto';






//------------------ hash password and comapare again  ------------------
const hashPassword = function (password) {    

    const salt = bcrypt.genSaltSync(); 
	return bcrypt.hashSync(password, salt); 
}

const comparePassword = function (raw,hash) {    
 
    return bcrypt.compareSync(raw, hash)
}



function encrypt(text) {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'kilvishSecureKey12345678901234si';
    
    // Check if the key length is valid
    if (Buffer.from(ENCRYPTION_KEY).length !== 32) {
        throw new Error('Encryption key must be 32 bytes long.');
    }

    const IV_LENGTH = 16; // For AES, this is always 16
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Returning IV and encrypted text
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}
  
  
  // Decrypt Function
  function decrypt(text) {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'kilvishSecureKey12345678901234si';
    const IV_LENGTH = 16; // For AES, this is always 16

    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }







  function encrypt64(text) {
    const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_SECRET_KEY, 'hex');

    // Check if the key length is valid
    if (ENCRYPTION_KEY.length !== 32) {
        throw new Error('Encryption key must be 32 bytes long.');
    }

    const IV_LENGTH = 16; // For AES, this is always 16
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Returning IV and encrypted text
    return iv.toString('hex') + ':' + encrypted;
}


function decrypt64(text) {
    const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_SECRET_KEY, 'hex');
    const IV_LENGTH = 16; // For AES, this is always 16

    const parts = text.split(':');
    if (parts.length !== 2) {
        throw new Error('Invalid input format for decryption');
    }

    const [iv, encrypted] = parts;
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, Buffer.from(iv, 'hex'));
    
    let decrypted;
    try {
        decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
    } catch (err) {
        throw new Error('Decryption failed: ' + err.message);
    }

    return decrypted;
}



  

//------------------ Hash Password end ...............................





//----------------------- send Login OTP ------------ 

const sendWelcomeMsg = async (email, otp) => {
    const con = await connection();
    let pool;
let transaction;
  
    try {

        pool = await connection();

        // Create a transaction
        transaction = await pool.transaction();
        await transaction.begin();
     
        const result = await pool.request()
        .input('id', sql.Int, 1)  // Bind the 'id' parameter with type sql.Int
        .query('SELECT appEmail, appPassword FROM tbl_apppass WHERE id = @id');
    
      // Access the result
      const AppEmail = result.recordset[0].appEmail;
      const AppPassword = result.recordset[0].appPassword;
    
      // Commit the transaction if needed
      await transaction.commit();
  
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: AppEmail,
                pass: AppPassword
            }
        });
  
        const mailOptions = {
            from: AppEmail,
            to: email,
            subject: 'Email Verification OTP (Kingston Booking)',
            html: `
            <html>
            <head>
                <style>
                    /* Add your CSS styles here */
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f5f5f5;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f4f4f4;
                        border: 1px solid #e0e0e0;
                        border-radius: 5px;
                    }
                    h1 {
                        color: #333;
                    }
                    p {
                        font-size: 16px;
                        line-height: 1.5;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Welcome to Kingston Booking</h1>
                    <p>Dear User,</p>
                       <div style="background-color: #ffffff; padding: 10px; border: 1px solid #dddddd; border-radius: 5px; margin-top: 15px;">
                      <h3 style="color: #333333;">Your One Time Password (OTP): <span style="color: #007BFF;">${otp}</span></h3>
                  </div>
                    <p>We are excited to welcome you to our Kigston Booking App. You are now part of a community that simplifies your journey.</p>
                    <p>With our system, you can easily Book your appoinments , cancel, update and track your Bookings ..</p>
                    <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
                    <p>Thank you for choosing Kingston Booking!</p>
                    <p>Best regards,</p>
                    <p>Your Kingston Booking Team</p>
                    <p>Kilvish Birla</p>
                </div>
            </body>
            </html>
        `
        };
  
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully.");
    } catch (error) {
        console.error('Error in sendMailOTP:', error);
        throw new Error('Error in sending Welcome email');
    } finally {
        if (pool) {
            pool.close();
          }
    }
  };
  






export { hashPassword , comparePassword ,encrypt,decrypt , encrypt64 ,decrypt64 , sendWelcomeMsg };

