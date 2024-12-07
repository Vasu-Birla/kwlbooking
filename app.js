import http from 'http';
import express from 'express';
import * as url from 'url';
import * as path from 'path';
import csurf from 'csurf';
import cookie from 'cookie-parser';
import dotenv from 'dotenv'
import helmet from 'helmet';
// import connection from "./config.js";
import { connection, sql } from './config.js';
import requestIp from "request-ip";

import SuperAdminRouter from "./routes/superadminRoute.js";
import IndexRouter from "./routes/indexRoute.js";

import { validateRedirectUrl } from './middleware/validateRedirect.js';

dotenv.config({path:"./config.env"});

//---------------Import Section Finish ----------------
const app = express();
const server = http.createServer(app);
const port = 3015;
const __dirname = url.fileURLToPath(new URL('.',import.meta.url));

//----------------------  global  Middleware start ----------------

app.use(cookie());

app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.static(path.join(__dirname,"public")));


//========== CSRF Start Middleware ======================

// const csrfMiddleware = csurf({ cookie: true });
// app.use(csrfMiddleware);
// app.use((req, res, next) => {
//   res.locals.csrfToken = req.csrfToken();
//   next();
// });
//========== CSRF End ======================


//========== CSRF Start Middleware ======================

// Define CSRF middleware with cookie
const csrfMiddleware = csurf({ cookie: true });

// Skip CSRF for specific routes by using a condition
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/kilvish') {
    return next(); // Skip CSRF for /api and / routes
  }
  csrfMiddleware(req, res, next); // Apply CSRF protection for other routes
});

// Set csrfToken for the rest of the routes (only where CSRF protection is applied)
app.use((req, res, next) => {
  if (!(req.path.startsWith('/api') || req.path === 'kilvish')) {
    res.locals.csrfToken = req.csrfToken(); // Set csrfToken for non-skipped routes
  }
  next();
});

//========== CSRF End ======================





//Configure HSTS -> Enforce the browser to use HTTPS:
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});





// Add this before your routes
// app.use(
//   helmet({
//       contentSecurityPolicy: {
//           directives: {
//               defaultSrc: ["'self'"],
//               frameAncestors: ["'none'"], // Prevent framing entirely
//           },
//       },
//       frameguard: {
//           action: 'deny', // Prevent framing using X-Frame-Options
//       },
//   })
// );



//If certain domains or pages need to embed your application, modify the frameAncestors directive:

// app.use(
//   helmet({
//       contentSecurityPolicy: {
//           directives: {
//               defaultSrc: ["'self'"],
//               frameAncestors: ["'self'", "https://trusted-domain.com"],
//           },
//       },
//   })
// );





// Add helmet for security
// app.use(
//     helmet({
//         contentSecurityPolicy: {
//             directives: {
//                 defaultSrc: ["'self'"], // Allow resources from the same origin
//                 scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts
//                 styleSrc: ["'self'"], // Allow styles from the same origin
//                 frameAncestors: ["'none'"], // Prevent embedding in iframes
//             },
//         },
//     })
// );



app.use(async (req, res, next) => {

    const con = await connection();
    try {
    
      app.locals.host  =  process.env.Host;
      app.locals.currentUrl = req.originalUrl;
      app.locals.showModal = true;
  
      // const [locations] = await con.query('SELECT * FROM tbl_locations');
      // app.locals.locations = locations;        
      // req.locations = locations;
      app.locals.dashboard_type = 'User';
      
     


      app.locals.currency  =  process.env.currency;
      req.currency = process.env.currency;
     
      next();
    } catch (error) {
      console.error('Global Variables Error ->> :', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      con.release(); // Release the connection back to the pool
    }
    
  });



  app.use(validateRedirectUrl);



  

app.use('/superadmin',SuperAdminRouter);
app.use('/',IndexRouter);

app.set("view engine","ejs");
app.set("views",[
    path.join(__dirname,"./views"),
    path.join(__dirname,"./views/superadmin"),
])

app.get('/api', (req, res) => {
  res.json({ message: 'Hello, World!' });
});




//==================================================



server.listen(port,() => {
    console.log(`Server is running on port ${port}`);
})

