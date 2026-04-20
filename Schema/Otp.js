let mongoose = require('mongoose')

let Otp = new mongoose.Schema({
    phone: {type:Number, required:true},
    otp:{type:Number, required:true, default:()=> Math.floor(100000 + Math.random()*100000) }

})


let Otps = mongoose.model('Otp', Otp, 'Otp');
module.exports = Otps