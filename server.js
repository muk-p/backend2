const express= require('express');
const path = require('path');
const cors =require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const ordersRoute = require('./routes/orders');
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://gaming-f-mukaras-projects.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));


app.use(bodyParser.json());

dotenv.config();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/sales', require('./routes/sales'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/orders', ordersRoute);


const PORT = process.env.PORT || 5000;
app.listen(PORT,() => console.log(`SERVER is running on port ${PORT}`));