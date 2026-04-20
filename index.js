let express = require('express');
let app = express();
let mongoose = require('mongoose');
require('dotenv').config();
let GetRoutes = require('./Routes/GetRoutes');
let PostRoutes = require('./Routes/PostRoutes');


let uri = `mongodb+srv://${process.env.username}:${process.env.password}@go-nakli.9rao9tp.mongodb.net/${process.env.database}?appName=GO-NAKLI`;

app.use(GetRoutes);
app.use(PostRoutes);

mongoose.connect(uri).then(()=>{
    app.listen(5005,'0.0.0.0', ()=>{
        console.log('http://localhost:5005')
    })
})
