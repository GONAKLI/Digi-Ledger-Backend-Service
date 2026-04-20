let express = require('express');
const { default: Otps } = require('../Schema/Otp');
let Router = express.Router();


Router.post('/login', (req,res)=>{
    let phone = req.body.phone;
    let TempAuth = new Otps({
      phone: phone
    })
    TempAuth.save().then(()=>{
      res.status(200).json({
         phone: phone
      })
    }).catch(()=>{
      res.status(501).json({
         reason : 'Unable To Send OTP'
      })
    })
})



module.exports = Router