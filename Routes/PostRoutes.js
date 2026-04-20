let express = require('express');
let Router = express.Router();


Router.post('/login', (req,res)=>{
   console.log('req come ')
   res.send('ok');
})



module.exports = Router