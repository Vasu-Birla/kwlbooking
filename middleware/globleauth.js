import jwt from 'jsonwebtoken'
// import connection  from '../config.js'
import { connection, sql } from '../config.js';



  const globalAuth = async (req, res, next) => {
    const { User_kwl_token } = req.cookies;

    try {
        if (User_kwl_token) {        
            // Decode and verify the token
            const decodedData = jwt.verify(User_kwl_token, process.env.JWT_SECRET);
                
            const pool = await connection();

            const result = await pool.request()
                .input('user_email', sql.NVarChar, decodedData.user_email)
                .query('SELECT * FROM tbl_bookings WHERE user_email = @user_email');
                
            const user = result.recordset[0];
                
            if (!user) {
                // If no user is found, set as guest and redirect to login popup
                res.app.locals.dashboard_type = 'Guest';
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