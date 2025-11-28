import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser';
import cors from 'cors'
import fetch from "node-fetch";
const app = express();
// import './service/doctorCronService.js';
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? 'https://hummarichikitsa.vercel.app'
    : 'http://localhost:5173',

  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200, // For legacy browsers
};

app.use(cors(corsOptions));

// Handle preflight requests
// app.options('*', cors(corsOptions));

app.use('/public', express.static('public'))

app.use(express.json());
app.use(cookieParser());

import userRouter from './router/user.router.js'
import appointmentRoute from './router/appointment.route.js';
import doctorRoutes from './router/doctor.route.js';
import hospitalRoutes from './router/hospital.route.js';
import StaffRoutes from './router/staff.route.js';
import AdminRoutes from './router/admin.route.js';
import DashboardRoutes from './router/userDashboardRoutes.js';
app.use('/api/v1/user', userRouter);
app.use('/api/v1/appointment', appointmentRoute)
app.use('/api/v1/doctor', doctorRoutes)
app.use('/api/v1/staff', StaffRoutes)
app.use('/api/v1/hospital', hospitalRoutes)
app.use('/api/v1/admin', AdminRoutes)
app.use('/api/v1/dashboard', DashboardRoutes)

// const user_json_url = "URL_OF_YOUR_JSON_FILE";
// app.get(user_json_url, (res) => {
//   let data = '';

//   // A chunk of data has been received.
//   res.on('data', (chunk) => {
//     data += chunk;
//   });

//   // The whole response has been received.
//   res.on('end', () => {
//     const jsonData = JSON.parse(data);

//     // Access user_country_code and user_phone_number
//     const user_country_code = jsonData.user_country_code;
//     const user_phone_number = jsonData.user_phone_number;
//     const user_first_name = jsonData.user_first_name;
//     const user_last_name = jsonData.user_last_name;

//     console.log("User Country Code:", user_country_code);
//     console.log("User Phone Number:", user_phone_number);
//     console.log("User First Name:", user_first_name);
//     console.log("User Last name:", user_last_name);
//   });

// }).on("error", (err) => {
//   console.log("Error: " + err.message);
// });
// app.post("/get-phone", async (req, res) => {
//   const { url } = req.body;
//   try {
//     const response = await fetch(url);
//     const data = await response.json();
//     console.log(data.user_phone_number)

//     // Assuming phone number is inside "phone" key
//     res.json({ phone: data.user_phone_number });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ error: "Failed to fetch phone number" });
//   }
// });
app.use('/', (req, res) => {
  res.send('server is runing');
})
export default app