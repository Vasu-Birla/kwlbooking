import jwt from 'jsonwebtoken'
// import connection  from '../config.js'
import { connection, sql } from '../config.js';



const isAuthenticatedUser = async (req, res, next) => {
    const { User_kwl_token } = req.cookies;
  
    if (!User_kwl_token) {
      return res.redirect('/#popup1');
    }
  
    try {
      const decodedData = jwt.verify(User_kwl_token, process.env.JWT_SECRET);
      const pool = await connection();
  
      const result = await pool.request()
        .input('user_email', sql.Int, decodedData.id)
        .query('SELECT * FROM tbl_bookings WHERE user_email = @user_email');
  
      const user = result.recordset[0];
  
      if (!user) {
          res.app.locals.dashboard_type = 'Guest'
         return res.redirect('/#popup1');
      }
  
      req.user = user;
      res.app.locals.loggeduser = user;
    res.app.locals.dashboard_type = 'User'
  
   
  
      next();
    } catch (error) {
      console.error('Error during user authentication:', error);
      return res.redirect('/#popup1');
    }
  };

export  {isAuthenticatedUser}