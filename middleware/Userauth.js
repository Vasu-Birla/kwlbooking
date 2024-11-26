import jwt from 'jsonwebtoken'
// import connection  from '../config.js'
import { connection, sql } from '../config.js';



const isAuthenticatedUser = async (req, res, next) => {
  console.log("...Authenticati..")
    const { User_kwl_token } = req.cookies;

    const pool = await connection();
  
    if (!User_kwl_token) {
      return res.redirect('/#popup1');
    }
  
    try {
      const decodedData = jwt.verify(User_kwl_token, process.env.JWT_SECRET);

      
      const result1 = await pool.request()
      .input('user_email', sql.NVarChar, decodedData.user_email) // Replace 1 with dynamic user_id if needed
      .query('SELECT * FROM active_sessions_user WHERE user_email = @user_email');
    
    const existingSessions = result1.recordset[0]; // Get the first result if it exists
    const storedToken = existingSessions ? existingSessions.token : null; // Safely access token if exists
    
     


            // Adjusting to match the expected data type
    const result = await pool.request()
    .input('user_email', sql.NVarChar, decodedData.user_email) // using sql.NVarChar instead of sql.Int
    .query('SELECT * FROM tbl_bookings WHERE user_email = @user_email');
  
      const user = result.recordset[0];
  
      if (!user) {
          res.app.locals.dashboard_type = 'Guest'
         return res.redirect('/#popup1');
      }

      if(User_kwl_token != storedToken ){
        res.cookie("User_kwl_token", null, {
          expires: new Date(Date.now()),
          httpOnly: true
        });
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