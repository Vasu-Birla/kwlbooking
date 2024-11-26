import jwt from 'jsonwebtoken'
// import connection  from '../config.js'
import { connection, sql } from '../config.js';



const isAuthenticatedAdmin = async (req, res, next) => {
    const { Admin_token } = req.cookies;
    const pool = await connection();
  
   
    if (!Admin_token) {
      return res.redirect('/superadmin/login');
    }
  
    try {

      const decodedData = jwt.verify(Admin_token, process.env.JWT_SECRET);

      const result1 = await pool.request()
  .input('admin_id', sql.Int, decodedData.id) // Replace 1 with dynamic user_id if needed
  .query('SELECT * FROM active_sessions_admin WHERE admin_id = @admin_id');

const existingSessions = result1.recordset[0]; // Get the first result if it exists
const storedToken = existingSessions ? existingSessions.token : null; // Safely access token if exists

     
      
  
      const result = await pool.request()
        .input('admin_id', sql.Int, decodedData.id)
        .query('SELECT * FROM tbl_admin WHERE admin_id = @admin_id');
  
      const admin = result.recordset[0];
  
      if (!admin) {
        return res.redirect('/superadmin/login');
      }

      if(Admin_token != storedToken ){
        res.cookie('Admin_token', null, {
          expires: new Date(Date.now()),
          httpOnly: true,
        });
    
        return res.redirect('/superadmin/login');
    }  
  
      req.admin = admin;
      res.app.locals.loggeduser = admin;
      res.app.locals.permissions = admin.permissions;
  
      res.app.locals.dashboard_type = admin.admin_type === 'superadmin' ? 'superadmin' : 'subadmin';
  
      next();
    } catch (error) {
      console.error('Error during admin authentication:', error);
      return res.redirect('/superadmin/login');
    }
  };

export  {isAuthenticatedAdmin}