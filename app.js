import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser';
import cors from 'cors'

const app = express();
// app.use(cors({
//     // origin:'http://localhost:5173',
//     // origin: 'https://doctor-appointment-client-gray.vercel.app',
//     credentials: true,
// }))
app.use(cors());

app.use('/public', express.static('public'))

app.use(express.json());
app.use(cookieParser());

import userRouter from './router/user.router.js'
import appointmentRoute from './router/appointment.route.js';
import doctorRoutes from './router/doctor.route.js';
import hospitalRoutes from './router/hospital.route.js';
app.use('/api/v1/user', userRouter);
app.use('/api/v1/appointment', appointmentRoute)
app.use('/api/v1/doctor', doctorRoutes)
app.use('/api/v1/hospital', hospitalRoutes)
app.use('/', (req, res) => {
    res.send('server is runing');
})
export default app