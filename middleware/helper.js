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







export { hashPassword , comparePassword ,encrypt,decrypt , encrypt64 ,decrypt64 };

