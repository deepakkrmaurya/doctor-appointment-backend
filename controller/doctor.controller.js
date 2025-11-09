import Doctor from "../model/doctor.nodel.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import cloudinary from 'cloudinary';
import fs from 'fs/promises';
import io from "../index.js";
import hospitalModel from "../model/hospital.model.js";
import doctorNodel from "../model/doctor.nodel.js";

// Create a new doctor
export const createDoctor = async (req, res) => {
  try {
    const {
      hospitalId,
      name,
      specialty,
      qualification,
      experience,
      gender,
      password,
      bio,
      email,
      rating,
      consultationFee,
    } = req.body;

    // Validate required fields
    if (
      !hospitalId ||
      !name ||
      !specialty ||
      !qualification ||
      experience === undefined ||
      !email ||
      !gender ||
      !password ||
      !bio ||
      rating === undefined ||
      consultationFee === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Validate hospitalId
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hospital ID"
      });
    }

    const existDoctor = await Doctor.findOne({ email });
    if (existDoctor) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Validate rating range
    if (rating < 0 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 0 and 5"
      });
    }

    // Validate consultation fee
    if (consultationFee < 0) {
      return res.status(400).json({
        success: false,
        message: "Consultation fee cannot be negative"
      });
    }

    const newDoctor = new Doctor({
      hospitalId,
      name,
      specialty,
      qualification,
      experience,
      photo: '',
      password,
      gender,
      bio,
      email,
      rating,
      consultationFee,
      availableSlots: [] // Initialize empty slots array
    });

    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folders: 'MHAB',
        width: 250,
        height: 250,
        gravity: 'faces',
        crop: 'fill'
      });

      if (result) {
        newDoctor.photo = result.secure_url;
        await fs.rm(`uploads/${req.file.filename}`);
      }
    }

    const savedDoctor = await newDoctor.save();

    return res.status(201).json({
      success: true,
      message: "Doctor registered successfully",
      savedDoctor
    });
  } catch (error) {
    console.error('Error creating doctor:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const doctor = await Doctor.findOne({ email }).select("+password").populate("hospitalId", "name location");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    const isMatch = await doctor.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = await doctor.generateAuthToken();
    doctor.password = undefined;

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    };

    return res.status(200)
      .cookie('token', token, options)
      .json({
        success: true,
        message: "Login successful",
        user: doctor,
        token,
      });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all doctors
export const getDoctors = async (req, res) => {
  try {
    const { hospitalId, specialty, minRating, maxRating } = req.query;
    let query = {};

    // Filter by hospital if provided
    if (hospitalId) {
      if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid hospital ID"
        });
      }
      query.hospitalId = hospitalId;
    }

    // Filter by specialty if provided
    if (specialty) {
      query.specialty = { $regex: specialty, $options: "i" };
    }

    // Filter by rating range if provided
    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = parseFloat(minRating);
      if (maxRating) query.rating.$lte = parseFloat(maxRating);
    }

    const doctors = await Doctor.find(query).populate("hospitalId", "name location");

    res.status(200).json({
      success: true,
      doctors
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single doctor by ID
export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID"
      });
    }

    const doctor = await Doctor.findById(id).populate("hospitalId", "name location address");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    res.status(200).json({
      success: true,
      doctor
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update doctor information
export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID"
      });
    }

    // Validate rating if being updated
    if (updateData.rating !== undefined) {
      if (updateData.rating < 0 || updateData.rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 0 and 5"
        });
      }
    }

    // Validate consultation fee if being updated
    if (updateData.consultationFee !== undefined) {
      if (updateData.consultationFee < 0) {
        return res.status(400).json({
          success: false,
          message: "Consultation fee cannot be negative"
        });
      }
    }

    let updatedDoctor = await Doctor.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folders: 'MHAB',
        width: 250,
        height: 250,
        gravity: 'faces',
        crop: 'fill'
      });

      if (result) {
        updatedDoctor.photo = result.secure_url;
        await updatedDoctor.save();
        await fs.rm(`uploads/${req.file.filename}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      doctor: updatedDoctor
    });
  } catch (error) {
    console.error('Error updating doctor:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getDoctorByHospitalId = async (req, res) => {
  try {
    const { hospitalId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hospital ID"
      });
    }

    const doctors = await Doctor.find({ hospitalId }).populate("hospitalId", "name location");

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No doctors found for this hospital"
      });
    }

    res.status(200).json({
      success: true,
      doctors
    });
  } catch (error) {
    console.error('Error fetching doctors by hospital:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a doctor
export const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID"
      });
    }

    const deletedDoctor = await Doctor.findByIdAndDelete(id);

    if (!deletedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// SLOTS MANAGEMENT FUNCTIONS

// Add available slots for a doctor
export const addDoctorSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, slots } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID"
      });
    }

    if (!date || !slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Date and at least one slot are required",
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    // Validate slots format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    for (const slot of slots) {
      if (!timeRegex.test(slot)) {
        return res.status(400).json({
          success: false,
          message: `Invalid time format for slot: ${slot}. Use HH:MM format`,
        });
      }
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // Check if slots for this date already exist
    const existingSlotIndex = doctor.availableSlots.findIndex(
      (slot) => slot.date === date
    );

    if (existingSlotIndex !== -1) {
      // Add new slots to existing date and remove duplicates
      const existingSlots = doctor.availableSlots[existingSlotIndex].slots;
      const newSlots = [...new Set([...existingSlots, ...slots])];

      // Sort slots chronologically
      newSlots.sort((a, b) => {
        const [aHours, aMinutes] = a.split(':').map(Number);
        const [bHours, bMinutes] = b.split(':').map(Number);
        return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
      });

      doctor.availableSlots[existingSlotIndex].slots = newSlots;
    } else {
      // Add new date with slots (sorted)
      const sortedSlots = [...slots].sort((a, b) => {
        const [aHours, aMinutes] = a.split(':').map(Number);
        const [bHours, bMinutes] = b.split(':').map(Number);
        return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
      });

      doctor.availableSlots.push({ date, slots: sortedSlots });
    }

    const updatedDoctor = await doctor.save();

    // Emit socket event for real-time updates
    if (io) {
      io.emit('doctorSlotsUpdated', {
        doctorId: id,
        date,
        slots: doctor.availableSlots.find(slot => slot.date === date)?.slots || []
      });
    }

    res.status(200).json({
      success: true,
      message: "Slots added successfully",
      doctor: updatedDoctor
    });
  } catch (error) {
    console.error('Error adding slots:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update doctor slots
export const updateDoctorSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, slots } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID"
      });
    }

    if (!date || !slots || !Array.isArray(slots)) {
      return res.status(400).json({
        success: false,
        message: "Date and slots array are required",
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    // Validate slots format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    for (const slot of slots) {
      if (!timeRegex.test(slot)) {
        return res.status(400).json({
          success: false,
          message: `Invalid time format for slot: ${slot}. Use HH:MM format`,
        });
      }
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // Find the slot entry for this date
    const slotEntryIndex = doctor.availableSlots.findIndex(
      (slot) => slot.date === date
    );

    if (slotEntryIndex === -1) {
      // If no slots exist for this date, create new entry
      const sortedSlots = [...slots].sort((a, b) => {
        const [aHours, aMinutes] = a.split(':').map(Number);
        const [bHours, bMinutes] = b.split(':').map(Number);
        return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
      });

      doctor.availableSlots.push({ date, slots: sortedSlots });
    } else {
      // Update existing slots (sorted)
      const sortedSlots = [...slots].sort((a, b) => {
        const [aHours, aMinutes] = a.split(':').map(Number);
        const [bHours, bMinutes] = b.split(':').map(Number);
        return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
      });

      doctor.availableSlots[slotEntryIndex].slots = sortedSlots;
    }

    const updatedDoctor = await doctor.save();

    // Emit socket event
    if (io) {
      io.emit('doctorSlotsUpdated', {
        doctorId: id,
        date,
        slots: doctor.availableSlots.find(slot => slot.date === date)?.slots || []
      });
    }

    res.status(200).json({
      success: true,
      message: "Slots updated successfully",
      doctor: updatedDoctor
    });
  } catch (error) {
    console.error('Error updating slots:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Remove slots from a doctor's availability
export const removeDoctorSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, slots } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID"
      });
    }

    if (!date || !slots || !Array.isArray(slots)) {
      return res.status(400).json({
        success: false,
        message: "Date and slots array are required",
      });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // Find the slot entry for this date
    const slotEntryIndex = doctor.availableSlots.findIndex(
      (slot) => slot.date === date
    );

    if (slotEntryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "No slots found for this date"
      });
    }

    // Filter out the slots to be removed
    const updatedSlots = doctor.availableSlots[slotEntryIndex].slots.filter(
      (slot) => !slots.includes(slot)
    );

    if (updatedSlots.length === 0) {
      // If no slots left for this date, remove the entire date entry
      doctor.availableSlots.splice(slotEntryIndex, 1);
    } else {
      // Otherwise just update the slots
      doctor.availableSlots[slotEntryIndex].slots = updatedSlots;
    }

    const updatedDoctor = await doctor.save();

    // Emit socket event
    if (io) {
      io.emit('doctorSlotsUpdated', {
        doctorId: id,
        date,
        slots: updatedSlots
      });
    }

    return res.status(200).json({
      success: true,
      message: "Slots removed successfully",
      doctor: updatedDoctor
    });
  } catch (error) {
    console.error('Error removing slots:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get available slots for a doctor on specific date
export const getDoctorSlotsByDate = async (req, res) => {
  try {
    const { id, date } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID"
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // Find slots for the requested date
    const slotEntry = doctor.availableSlots.find((slot) => slot.date === date);

    if (!slotEntry) {
      return res.status(200).json({
        success: true,
        doctorId: doctor._id,
        doctorName: doctor.name,
        date,
        availableSlots: [],
        message: "No slots available for this date"
      });
    }

    res.status(200).json({
      success: true,
      doctorId: doctor._id,
      doctorName: doctor.name,
      date: slotEntry.date,
      availableSlots: slotEntry.slots,
    });
  } catch (error) {
    console.error('Error fetching slots by date:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all slots for a doctor
export const getAllDoctorSlots = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID"
      });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    res.status(200).json({
      success: true,
      doctorId: doctor._id,
      doctorName: doctor.name,
      availableSlots: doctor.availableSlots,
    });
  } catch (error) {
    console.error('Error fetching all slots:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Clear all slots for a date
export const clearDoctorSlotsByDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID"
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // Filter out the date entry
    const initialLength = doctor.availableSlots.length;
    doctor.availableSlots = doctor.availableSlots.filter(slot => slot.date !== date);

    if (initialLength === doctor.availableSlots.length) {
      return res.status(404).json({
        success: false,
        message: "No slots found for this date"
      });
    }

    const updatedDoctor = await doctor.save();

    // Emit socket event
    if (io) {
      io.emit('doctorSlotsUpdated', {
        doctorId: id,
        date,
        slots: []
      });
    }

    res.status(200).json({
      success: true,
      message: "All slots cleared for the date",
      doctor: updatedDoctor
    });
  } catch (error) {
    console.error('Error clearing slots:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const ChangePassword = async (req, res) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    let getUser = await Doctor.findById(user._id).select('+password');
    if (!getUser) {
      getUser = await hospitalModel.findById(user._id).select('+password');
    }

    if (!getUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const verifyPassword = await bcrypt.compare(currentPassword, getUser.password);
    if (!verifyPassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid current password"
      });
    }

    getUser.password = newPassword;
    await getUser.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const ActiveDoctor = async (req, res) => {
  try {
    const user = req.user;
    const doctor = await Doctor.findById(user._id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    doctor.active = !doctor.active;
    await doctor.save();
    const getDoctor = await Doctor.findById(user._id);

    io.emit("doctoractive", getDoctor)


    return res.status(200).json({
      success: true,
      doctor: getDoctor
    });
  } catch (error) {
    console.error('Error updating doctor active status:', error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// import Doctor from "../models/Doctor.js";

// Add availability for doctor
export const addAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, startTime, endTime } = req.body;

    // Validate input
    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Date, start time and end time are required"
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD"
      });
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Use HH:MM in 24-hour format"
      });
    }

    // Check if end time is after start time
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time"
      });
    }

    // Find doctor
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }


    // Format time for display (convert to 12-hour format)
    const formatTimeForDisplay = (time) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);

      if (hour === 0) {
        return `12:${minutes} AM`;
      } else if (hour === 12) {
        return `12:${minutes} PM`;
      } else if (hour > 12) {
        return `${hour - 12}:${minutes} PM`;
      } else {
        return `${hour}:${minutes} AM`;
      }
    };

    const display = `${formatTimeForDisplay(startTime)} - ${formatTimeForDisplay(endTime)}`;

    // Check if availability already exists for this date
    const existingAvailabilityIndex = doctor.availability.findIndex(
      avail => avail.date === date
    );

    if (existingAvailabilityIndex !== -1) {
      // Update existing availability
      doctor.availability[existingAvailabilityIndex] = {
        date,
        display: [display]
      };
    } else {
      // Add new availability
      doctor.availability.push({
        date,
        display: [display]
      });
    }
    console.log(req.body);
    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Availability added successfully",
      data: {
        date,
        startTime,
        endTime,
        display
      }
    });

  } catch (error) {
    console.error("Error adding availability:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Add bulk availability for multiple dates
export const addBulkAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { dates, startTime, endTime } = req.body;

    // Validate input
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Dates array is required and should not be empty"
      });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Start time and end time are required"
      });
    }
    console.log(req.body)
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Use HH:MM in 24-hour format"
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time"
      });
    }

    // Find doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // Format time for display
    const formatTimeForDisplay = (time) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);

      if (hour === 0) {
        return `12:${minutes} AM`;
      } else if (hour === 12) {
        return `12:${minutes} PM`;
      } else if (hour > 12) {
        return `${hour - 12}:${minutes} PM`;
      } else {
        return `${hour}:${minutes} AM`;
      }
    };

    const display = `${formatTimeForDisplay(startTime)} - ${formatTimeForDisplay(endTime)}`;

    // Process each date
    let addedCount = 0;
    let updatedCount = 0;

    dates.forEach(date => {
      const existingIndex = doctor.availability.findIndex(
        avail => avail.date === date
      );

      if (existingIndex !== -1) {
        // Update existing
        doctor.availability[existingIndex] = {
          date,
          display: [display]
        };
        updatedCount++;
      } else {
        // Add new
        doctor.availability.push({
          date,
          display: [display]
        });
        addedCount++;
      }
    });

    await doctor.save();

    res.status(200).json({
      success: true,
      message: `Availability set for ${dates.length} days`,
      data: {
        totalDates: dates.length,
        added: addedCount,
        updated: updatedCount,
        display
      }
    });

  } catch (error) {
    console.error("Error adding bulk availability:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Remove availability
export const removeAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { dates } = req.body;

    if (!dates || !Array.isArray(dates)) {
      return res.status(400).json({
        success: false,
        message: "Dates array is required"
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // Filter out the dates to remove
    const initialLength = doctor.availability.length;
    doctor.availability = doctor.availability.filter(
      avail => !dates.includes(avail.date)
    );

    const removedCount = initialLength - doctor.availability.length;

    await doctor.save();

    res.status(200).json({
      success: true,
      message: `Availability removed for ${removedCount} days`,
      data: {
        removed: removedCount
      }
    });

  } catch (error) {
    console.error("Error removing availability:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get doctor availability
export const getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId).select('availability name specialty');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        doctor: {
          name: doctor.name,
          specialty: doctor.specialty,
          availability: doctor.availability
        }
      }
    });

  } catch (error) {
    console.error("Error fetching availability:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get availability by date range
export const getAvailabilityByDateRange = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required"
      });
    }

    const doctor = await Doctor.findById(doctorId).select('availability');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    const availabilityInRange = doctor.availability.filter(avail => {
      return avail.date >= startDate && avail.date <= endDate;
    });

    res.status(200).json({
      success: true,
      data: {
        availability: availabilityInRange,
        total: availabilityInRange.length
      }
    });

  } catch (error) {
    console.error("Error fetching availability by date range:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
export const ActiveDoctors = async (req, res) => {
  try {
    const { deactivationReason } = req.body
   
    const doctor = await doctorNodel.findById(req.user.id)
    doctor.deactivationReason= deactivationReason
    doctor.status= !doctor.status
   const updatedDoctor =  await doctor.save()
    res.status(200).json({
      success: true,
      data: updatedDoctor
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      err: "internal error"
    })
  }
}