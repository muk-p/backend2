const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const { route } = require("./auth");
const router = require("./auth");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: 'http://localhost:3000', 
}));  

app.use(bodyParser.json());

const {
  CONSUMER_KEY,
  CONSUMER_SECRET,
  SHORTCODE,
  PASSKEY,
  CALLBACK_URL
} = process.env;

const getToken = async () => {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
  const res = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
    headers: { Authorization: `Basic ${auth}` }
  });
  return res.data.access_token;
};

const stkPush = async (phone, amount) => {
  const token = await getToken();
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString("base64");

  const payload = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phone,
    PartyB: SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: CALLBACK_URL,
    AccountReference: "CheckoutTest",
    TransactionDesc: "Test STK Push"
  };

  const res = await axios.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  return res.data;
};

app.post("/pay", async (req, res) => {
  try {
    const { phone, amount } = req.body;
    const response = await stkPush(phone, amount);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.error("Payment error:", err.message);
  }
});

app.post("/callback", (req, res) => {
  console.log("🔔 M-Pesa Callback:", req.body);
  res.status(200).json({ message: "Callback received" });
});

app.get("/", (req, res) => {
  res.send("M-Pesa Checkout API is running");
});

module.exports = router = app;