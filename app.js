import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser';
import cors from 'cors'

const app = express();
// const corsOptions = {
//     // origin: process.env.NODE_ENV === 'production'
//     //     ? 'https://your-production-client.com'
//     //     : 'http://localhost:5173',
//     origin:"http://localhost:5173",
//     credentials: true,
//     // methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     // allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
//     // exposedHeaders: ['Authorization']
// };

// app.use(cors(corsOptions));

// Handle preflight requests
// app.options('*', cors(corsOptions));
// Enhanced CORS configuration
const corsOptions = {
   origin: process.env.NODE_ENV === 'production'
        ? 'https://doctor-appointment-client-gray.vercel.app'
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
app.use('/api/v1/user', userRouter);
app.use('/api/v1/appointment', appointmentRoute)
app.use('/api/v1/doctor', doctorRoutes)
app.use('/api/v1/staff', StaffRoutes)
app.use('/api/v1/hospital', hospitalRoutes)
app.use('/api/v1/admin', AdminRoutes)
app.use('/', (req, res) => {
    res.send('server is runing');
})
export default app