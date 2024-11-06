//import connection from "../config.js"

import { connection, sql } from '../config.js';




const home1 = async (req, res, next) => {
   const con = await connection();
   const output= req.cookies.kwl_msg || '';
   try {

     await con.beginTransaction();
   
   
     await con.commit();
     res.render('index',{output:output}) 

   } catch (error) {
     await con.rollback();
     console.error('Error:', error);
     res.status(500).send('Internal Server Error');
   } finally {
     con.release();
   }
 };




const home = async (req, res, next) => {
  const pool = await connection();
  const transaction = new sql.Transaction(pool);

  const output = req.cookies.rental_msg || ''; 

  try {

    
    await transaction.begin(); // Begin the transaction

  
    const request = transaction.request();
    // await request.query('INSERT INTO some_table (column) VALUES (value)'); // Example query


    // If everything is fine, commit the transaction
    await transaction.commit();

    res.render('index', { output: output });
    
  } catch (error) {
    // If any error occurs, rollback the transaction
    if (transaction) {
      await transaction.rollback();
    }
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    // Always close the pool connection to release resources
    if (pool) {
      pool.close();
    }
  }
};


 

 
const booking_availability1 = async (req, res, next) => {
   const con = await connection();
   const output= req.cookies.kwl_msg || '';
   try {

     await con.beginTransaction();
   
   
     await con.commit();
     res.render('booking_availability',{output:output}) 

   } catch (error) {
     await con.rollback();
     console.error('Error:', error);
     res.status(500).send('Internal Server Error');
   } finally {
     con.release();
   }
 };




const booking_availability = async (req, res, next) => {
  const pool = await connection();
  const transaction = new sql.Transaction(pool);
  const output = req.cookies.kwl_msg || '';

  try {
    await transaction.begin(); // Begin the transaction

    const request = transaction.request();
    
    // Example query to check or update booking availability (modify as needed)
    // await request.query('UPDATE bookings SET status = @status WHERE id = @bookingId');

    // Commit the transaction if everything is successful
    await transaction.commit();

    res.render('booking_availability', { output: output });
  } catch (error) {
    // Rollback if an error occurs
    if (transaction) {
      await transaction.rollback();
    }
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    // Always close the pool to release resources
    if (pool) {
      pool.close();
    }
  }
};







const book = async(req,res,next)=>{

    res.render('book')
 }




//--------------------- Export Start ------------------------------------------
export { home , book , booking_availability }

