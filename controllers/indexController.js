import connection from "../config.js"
const home = async(req,res,next)=>{
    res.send("KWL Booking")
   // res.redirect('/superadmin')
}

//--------------------- Export Start ------------------------------------------
export { home }

