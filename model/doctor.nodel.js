import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const SlotSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  slots: {
    type: [String],
    required: true,
  },
});

const DoctorSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /.+\@.+\..+/,
  },
  gender: {
    type: String,
    required: true,
  },

  password: {
    type: String,
    required: true,
    select: false,

  },
  role: {
    type: String,
    enum: ['doctor'],
    default: 'doctor',
  },
  specialty: {
    type: String,
    required: true,
  },
  qualification: {
    type: String,
    required: true,
  },
  currentAppointment: {
    type: Number,
    
  },
  active: {
    type: Boolean,
    default:false
  },
  totalAppointments: {
    type: Number,
  },
  experience: {
    type: Number,
    required: true,
  },
  status: {
    type: Boolean,
    // enum: ['active', 'deactive'],
    default: true,
  },
  photo: {
    type: String,
  },
  bio: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
  },
  consultationFee: {
    type: Number,
    required: true,
  },
  deactivationReason: {
    type: String,
  },
  availableSlots: {
    type: [SlotSchema],
    required: true,
  },
},{
  timestamps: true,
});

DoctorSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

DoctorSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    console.error('Error comparing passwords:', err);
    return false;
  }
};

DoctorSchema.methods.generateAuthToken = async function () {
  const token
    = await jwt.sign({ id: this._id, role: this.role, }, process.env.JWT_SECRET, {
      expiresIn: '10d',
    });
  return token;
}

export default mongoose.model('Doctor', DoctorSchema);
