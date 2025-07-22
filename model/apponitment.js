import mongoose from "mongoose";
const AppointmentSchema = new mongoose.Schema({
  patient: {
    type: String,
    requred: true
  },
  mobile: {
    type: String,
    requred: true
  },
  dob: {
    type: Date,
  },
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
  booking_amount: { type: Number, required: true },
  razorpayOrderId: { type: String},
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String},
  paymentStatus: { type: String},
  date: {
    type: String,
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
