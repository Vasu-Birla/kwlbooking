import http from 'http';
import express from 'express';
import * as url from 'url';
import * as path from 'path';
import cookie from 'cookie-parser';
import dotenv from 'dotenv'
// import connection from "./config.js";
import { connection, sql } from './config.js';
import requestIp from "request-ip";

import SuperAdminRouter from "./routes/superadminRoute.js";
import IndexRouter from "./routes/indexRoute.js";



dotenv.config({path:"./config.env"});

//---------------Import Section Finish ----------------
const app = express();
const server = http.createServer(app);
const port = 3015;
const __dirname = url.fileURLToPath(new URL('.',import.meta.url));

//----------------------  global  Middleware start ----------------
app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.static(path.join(__dirname,"public")));
app.use(cookie());
app.use(requestIp.mw());


app.use(async (req, res, next) => {

    const con = await connection();
    try {
    
      app.locals.host  =  process.env.Host;
      app.locals.currentUrl = req.originalUrl;

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

