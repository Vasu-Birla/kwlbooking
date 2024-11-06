import jwt from 'jsonwebtoken'
// import connection  from '../config.js'
import { connection, sql } from '../config.js';

const isAuthenticatedAdmin1 = async (req, res, next) => {
    const { Admin_token } = req.cookies;

    if (!Admin_token) {
        return res.redirect('/superadmin/login');
    }

    try {
        const decodedData = jwt.verify(Admin_token, process.env.JWT_SECRET);
        const con = await connection();
        const [results] = await con.query('SELECT * FROM tbl_admin WHERE admin_id = ?', [decodedData.id]);
    
            req.admin = results[0];
            res.app.locals.loggeduser = req.admin;
            res.app.locals.permissions = req.admin.permissions;  

            

            if(req.admin.admin_type=='superadmin'){
                res.app.locals.dashboard_type = 'superadmin';
            }else{
                res.app.locals.dashboard_type = 'subadmin';
            }

            
            next();
    } catch (error) {
        return res.redirect('/superadmin/login');
    }
};



const isAuthenticatedAdmin = async (req, res, next) => {
    const { Admin_token } = req.cookies;
  
    if (!Admin_token) {
      return res.redirect('/superadmin/login');
    }
  
    try {
      const decodedData = jwt.verify(Admin_token, process.env.JWT_SECRET);
      const pool = await connection();
  
      const result = await pool.request()
        .input('admin_id', sql.Int, decodedData.id)
        .query('SELECT * FROM tbl_admin WHERE admin_id = @admin_id');
  
      const admin = result.recordset[0];
  
      if (!admin) {
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