const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const GetRoutes = require('./Routes/GetRoutes');
const PostRoutes = require('./Routes/PostRoutes');



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@go-nakli.9rao9tp.mongodb.net/${process.env.DB_NAME}?appName=GO-NAKLI`;

let PORT = process.env.PORT || 5005;

app.use(express.json({ limit: '10mb' })); // Added limit for security
app.use(cors());

app.use(GetRoutes);
app.use(PostRoutes);

mongoose.connect(uri)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1); // Exit on connection failure
  });
