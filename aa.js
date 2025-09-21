import mongoose from "mongoose";
import connectDB from "./config/db.js";
import apponitment from "./model/apponitment.js";



// Sample data (100 appointments)
const appointmentsData = [
  {
      "patient": "Rahul Sharma",
      "mobile": "9876543210",
      "dob": "1990-05-15",
      "patientId": "68b815c970dfb230e45892bd",
      "doctorId": "68c3b09cfb9b01b1b535670f",
      "hospitalId": "68c309949468d6f5cd13bbb6",
      "booking_amount": 500,
      "paymentStatus": "completed",
      "date": "2025-09-21",
      "status": "confirmed",
      "amount": 500,
      "token": "AP-20250920-001",
      "createdAt": "2025-09-20T09:30:00.000Z",
      "updatedAt": "2025-09-20T10:15:00.000Z",
      "appointmentNumber": 1,
      "__v": 0,
      "paymentMethod": "online"
    },
    {
      "patient": "Priya Patel",
      "mobile": "8765432109",
      "dob": "1985-08-22",
      "patientId": "68b815c970dfb230e45892bd",
      "doctorId": "68c3b09cfb9b01b1b535670f",
      "hospitalId": "68c309949468d6f5cd13bbb6",
      "booking_amount": 600,
      "paymentStatus": "pending",
      "date": "2025-09-21",
      "status": "confirmed",
      "amount": 600,
      "token": "AP-20250920-002",
      "createdAt": "2025-09-20T10:00:00.000Z",
      "updatedAt": "2025-09-20T10:00:00.000Z",
      "appointmentNumber": 2,
      "__v": 0,
      "paymentMethod": "Cash"
    },
    {
      "patient": "Amit Kumar",
      "mobile": "7654321098",
      "dob": "1992-12-10",
      "patientId": "68b815c970dfb230e45892bd",
      "doctorId": "68c3b09cfb9b01b1b535670f",
      "hospitalId": "68c309949468d6f5cd13bbb6",
      "booking_amount": 450,
      "paymentStatus": "completed",
      "date": "2025-09-21",
      "status": "confirmed",
      "amount": 450,
      "token": "AP-20250920-003",
      "createdAt": "2025-09-20T10:30:00.000Z",
      "updatedAt": "2025-09-20T11:00:00.000Z",
      "appointmentNumber": 3,
      "__v": 0,
      "paymentMethod": "online"
    },
    {
      "patient": "Sneha Gupta",
      "mobile": "6543210987",
      "dob": "1988-03-25",
      "patientId": "68b815c970dfb230e45892bd",
      "doctorId": "68c3b09cfb9b01b1b535670f",
      "hospitalId": "68c309949468d6f5cd13bbb6",
      "booking_amount": 550,
      "paymentStatus": "completed",
      "date": "2025-09-21",
      "status": "confirmed",
      "amount": 550,
      "token": "AP-20250920-004",
      "createdAt": "2025-09-20T11:00:00.000Z",
      "updatedAt": "2025-09-20T11:30:00.000Z",
      "appointmentNumber": 4,
      "__v": 0,
      "paymentMethod": "Card"
    },
    {
      "patient": "Vikram Singh",
      "mobile": "5432109876",
      "dob": "1995-07-18",
      "patientId": "68b815c970dfb230e45892bd",
      "doctorId": "68c3b09cfb9b01b1b535670f",
      "hospitalId": "68c309949468d6f5cd13bbb6",
      "booking_amount": 700,
      "paymentStatus": "pending",
      "date": "2025-09-21",
      "status": "confirmed",
      "amount": 700,
      "token": "AP-20250920-005",
      "createdAt": "2025-09-20T11:30:00.000Z",
      "updatedAt": "2025-09-20T11:30:00.000Z",
      "appointmentNumber": 5,
      "__v": 0,
      "paymentMethod": "Cash"
    }
];

// Function to insert data
const insertAppointments = async () => {
  try {
    await mongoose.connect('mongodb+srv://deepakmaurya2211:deepak123@cluster0.1h55ubo.mongodb.net/')
    await apponitment.insertMany(appointmentsData);
    console.log('100 appointments inserted successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error inserting appointments:', error);
    mongoose.connection.close();
  }
};

insertAppointments();