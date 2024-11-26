import jwt from 'jsonwebtoken'
// import connection  from '../config.js'
import { connection, sql } from '../config.js';



  const globalAuth = async (req, res, next) => {
    const { User_kwl_token } = req.cookies;

    try {
        const pool = await connection();
        if (User_kwl_token) {        
            // Decode and verify the token
            const decodedData = jwt.verify(User_kwl_token, process.env.JWT_SECRET);
                
            
      const result1 = await pool.request()
      .input('user_email', sql.NVarChar, decodedData.user_email) // Replace 1 with dynamic user_id if needed
      .query('SELECT * FROM active_sessions_user WHERE user_email = @user_email');
    
    const existingSessions = result1.recordset[0]; // Get the first result if it exists
    const storedToken = existingSessions ? existingSessions.token : null; // Safely access token if exists
    
         

            const result = await pool.request()
                .input('user_email', sql.NVarChar, decodedData.user_email)
                .query('SELECT * FROM tbl_bookings WHERE user_email = @user_email');
                
            const user = result.recordset[0];
                
            if (!user) {
                // If no user is found, set as guest and redirect to login popup
                res.app.locals.dashboard_type = 'Guest';
                return res.redirect('/#popup1');
            }

            
      if(User_kwl_token != storedToken ){
        res.cookie("User_kwl_token", null, {
            expires: new Date(Date.now()),
            httpOnly: true
          });
        return res.redirect('/#popup1');
    } 

            // User authenticated successfully
            req.user = user;
            res.app.locals.loggeduser = user;
            res.app.locals.dashboard_type = 'User';
            next();

        } else {
            // No token, set as guest
            res.app.locals.loggeduser = undefined;
            res.app.locals.dashboard_type = 'Guest';
            next();
        }
    } catch (error) {
        if (error.name === 'TokenExpiredError' && error.expiredAt) {
            console.error('Token has expired:', error);

            // Clear expired token from cookies
            res.clearCookie('User_kwl_token');

            // Set user as guest and redirect to login popup
            res.app.locals.loggeduser = undefined;
            res.app.locals.dashboard_type = 'Guest';
            return res.redirect('/#popup1');
        } else {
            console.error('Error during user authentication:', error);
            
            // Handle general errors
            res.app.locals.loggeduser = undefined;
            res.app.locals.dashboard_type = 'Guest';
            return res.redirect('/#popup1');
        }
    }
};


export  {globalAuth}