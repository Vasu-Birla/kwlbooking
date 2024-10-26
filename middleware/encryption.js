// encryptionMiddleware.js
import crypto from "crypto";

// Encryption function
const encrypt = (text, secretKey) => {
    if (!secretKey) {
        throw new Error('ENCRYPTION_SECRET_KEY is not set or undefined!');
      }
  const iv = crypto.randomBytes(16); // Initialization vector
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted; // Return IV and encrypted data
};

// Decryption function (optional, if needed)
const decrypt = (encryptedText, secretKey) => {
  const [iv, encrypted] = encryptedText.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

 export default encrypt;
