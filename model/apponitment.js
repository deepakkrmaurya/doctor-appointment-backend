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
    type: Number,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  paymentStatus: { type: String },
  date: {
    type: String,
    required: true,
  },
  slot: {
    type: String,
    // required: true,
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
    enum: ['UPI', 'Card', 'Cash', 'NetBanking', 'online'],
  },
  transactionId: {
    type: String,
  },
  amount: {
    type: Number,
  },
  token: {
    type: String,
    unique: true,
    index: true, // Improves query performance
    default: function () {
      return "TEMP-" + Math.random().toString(36).substring(2, 10); // Temporary unique ID
    }
  }
}, {
  timestamps: true,
});


AppointmentSchema.pre('save', async function (next) {
  // Only generate token if it's still the temporary one
  if (this.token.startsWith('TEMP-')) {
    let attempts = 0;
    const maxAttempts = 3;
    let tokenGenerated = false;

    while (attempts < maxAttempts && !tokenGenerated) {
      try {
        // Get the last appointment from the same day
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const lastAppointment = await this.constructor.findOne({
          createdAt: { $gte: todayStart }
        }).sort({ createdAt: -1 });

        let newToken;
        if (lastAppointment && !lastAppointment.token.startsWith('TEMP-')) {
          newToken = incrementToken(lastAppointment.token);
        } else {
          newToken = generateNewToken();
        }

        // Verify uniqueness
        const exists = await this.constructor.findOne({ token: newToken });
        if (!exists) {
          this.token = newToken;
          tokenGenerated = true;
        }
      } catch (err) {
        console.error(`Token generation attempt ${attempts + 1} failed:`, err);
      }
      attempts++;
    }

    if (!tokenGenerated) {
      return next(new Error('Failed to generate unique token after multiple attempts'));
    }
  }
  next();
});

// Helper functions
function generateNewToken() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `AP-${dateStr}-001`; // Starting sequence
}

function incrementToken(lastToken) {
  const parts = lastToken.split('-');
  if (parts.length === 3 && parts[0] === 'AP') {
    const sequence = parseInt(parts[2]) + 1;
    return `AP-${parts[1]}-${sequence.toString().padStart(3, '0')}`;
  }
  return generateNewToken(); // Fallback if format is invalid
}

// Add a post-save hook to clean up any TEMP tokens (just in case)
AppointmentSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000 && error.keyValue.token) {
    // Duplicate key error on token
    doc.token = "TEMP-" + Math.random().toString(36).substring(2, 10);
    doc.save().then(() => next()).catch(next);
  } else {
    next(error);
  }
});

export default mongoose.model('Appointment', AppointmentSchema);
