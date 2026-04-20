let mongoose = require('mongoose');

let User = new mongoose.Schema({
     name:{type:String, required:true},
     phone:{type:Number, required:true},
     email:{type:String, required:true},
     location:String,
     creationDate:{type:Date, default:Date.now},
     Customer : [
        {
            name: {type: String, required:true},
            phone: {type: Number, required:true},
            address: String,
            creationDate: {type:Date, default:Date.now},
            photo: String,
            transactions: [
                {
                    amount: Number,
                    note : String,
                    type : String,
                    date: String,
                }
            ]
        }
     ]
})


let Users = mongoose.model('User', User, 'User')
module.exports = Users