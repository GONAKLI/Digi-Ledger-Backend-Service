let Users= require('../Schema/Users');

let express = require('express');
let router = express.Router();


router.get('/customer', (req,res,next)=>{
    let Data = new Users({
        name :'sanju',
        phone : 9034225535,
        email : 'duttmagic5@gmail.com',
        location : 'delhi'

    })
    Data.save().then(()=>{
        res.send('saved')
    })
})

module.exports = router