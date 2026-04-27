const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const GetRoutes = require('./Routes/GetRoutes');
const PostRoutes = require('./Routes/PostRoutes');

const uri = `mongodb+srv://${process.env.username}:${process.env.password}@go-nakli.9rao9tp.mongodb.net/${process.env.database}?appName=GO-NAKLI`;

let PORT = process.env.PORT || 5005;

app.use(express.json({ limit: '10mb' })); // Added limit for security
app.use(cors());

app.use(GetRoutes);
app.use(PostRoutes);

mongoose.connect(uri)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1); // Exit on connection failure
  });
