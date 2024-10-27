import connection from "../config.js"





const home = async (req, res, next) => {
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



 
const booking_availability = async (req, res, next) => {
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




const book = async(req,res,next)=>{

    res.render('book')
 }




//--------------------- Export Start ------------------------------------------
export { home , book , booking_availability }

