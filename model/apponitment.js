import mongoose from "mongoose";
const AppointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User/Patient model
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
  },
  date: {
    type: String, // or Date if you want to use native Date type
    required: true,
  },
  slot: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed', 'pending'],
    default: 'pending',
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Card', 'Cash', 'NetBanking'],
  },
  transactionId: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Appointment', AppointmentSchema);
