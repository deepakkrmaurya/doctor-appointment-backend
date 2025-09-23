import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
const HospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default:true
  },
  pincode: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    default: 'hospital'
  },
  password: {
    type: String,
    required: true,
  },
  website: {
    type: String,
    required: false,
  },
  deactivationReason: {
    type: String,
  },
  image: {
    type: String,
    required: false,
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
  },
  specialties: {
    type: [String],
    required: true,
  },
  facilities: {
    type: [String],
    required: true,
  },
  
}, {
  timestamps: true,
});

HospitalSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10)
  }
  next()
})

HospitalSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    console.error('Error comparing passwords:', err);
    return false;
  }
}

HospitalSchema.methods.generateAuthToken = async function () {
  const token = await jwt.sign({ id: this._id, role: this.role, }, process.env.JWT_SECRET, {
    expiresIn: '10d',
  })
  return token;
}

export default mongoose.model('Hospital', HospitalSchema);
