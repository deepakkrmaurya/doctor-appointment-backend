import Doctor from "../model/doctor.nodel.js";
import mongoose from "mongoose";

// Create a new doctor
export const createDoctor = async (req, res) => {
  try {
    const {
      hospitalId,
      name,
      specialty,
      qualification,
      experience,
      photo,
      password,
      bio,
      email,
      rating,
      consultationFee,
      availableSlots,
    } = req.body;

    // console.log(req.body)
    // Validate required fields
    if (
      !hospitalId ||
      !name ||
      !specialty ||
      !qualification ||
      experience === undefined ||
      !email ||
      !password ||
      !bio ||
      rating === undefined ||
      consultationFee === undefined ||
      !availableSlots
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    //   console.log(availableSlots)
    //  return
    // Validate hospitalId
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({ message: "Invalid hospital ID" });
    }
    const existDoctor = await Doctor.findOne({ email });
    if (existDoctor) {
      return res.status(400).json({
        success: false,
        message: "email already registerd"
      })
    }
    // Validate rating range
    if (rating < 0 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 0 and 5" });
    }

    // Validate consultation fee
    if (consultationFee < 0) {
      return res
        .status(400)
        .json({ message: "Consultation fee cannot be negative" });
    }
    // console.log(availableSlots)
    // Validate available slots
    if (!Array.isArray(availableSlots) || availableSlots.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one available slot is required" });
    }
    var slot = []
    availableSlots.map((e) => {
      slot.push(JSON.parse(e));
      // console.log(JSON.parse(e))
    })

    // console.log(slot)
    const newDoctor = new Doctor({
      hospitalId,
      name,
      specialty,
      qualification,
      experience,
      photo: process.env.APP_API_URL + '/' + req.file.path,
      password,
      bio,
      email,
      rating,
      consultationFee,
      // availableSlots:JSON.parse(availableSlots),
      availableSlots: slot,
    });

    const savedDoctor = await newDoctor.save();
    return res.status(201).json({
      sucess: true,
      message: "register successfully",
      savedDoctor
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Validate email and password
    console.log(req.body)
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    // Find doctor by email
    const doctor = await Doctor.findOne({ email }).select("+password").populate("hospitalId", "name location");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    // Check password (assuming you have a method to compare passwords)
    const isMatch = await doctor.comparePassword(password); // Assuming you have a method to compare passwords
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // Generate a token (assuming you have a method to generate tokens)
    const token = await doctor.generateAuthToken(); // Assuming you have a method to generate tokens
    // Send response with doctor details and token
    const doctorData = doctor.toObject();
    delete doctorData.password; // Remove password from response 

    const option = {
      httpOnly: true,
      secure: true
    }
    return res.status(200)
      .cookie('token', token, option)
      .json({
        success: true,
        message: "Login successful",
        user: doctorData,
        token,
      });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
// Get all doctors
export const getDoctors = async (req, res) => {
  try {
    const { hospitalId, specialty, minRating, maxRating } = req.query;
    let query = {};
    //  console.log('hos')
    // Filter by hospital if provided
    if (hospitalId) {
      if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
        return res.status(400).json({ message: "Invalid hospital ID" });
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
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single doctor by ID
export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    const doctor = await Doctor.findById(id).populate(
      "hospitalId",
      "name location address"
    );
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update doctor information
export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    // Validate rating if being updated
    if (updateData.rating !== undefined) {
      if (updateData.rating < 0 || updateData.rating > 5) {
        return res
          .status(400)
          .json({ message: "Rating must be between 0 and 5" });
      }
    }

    // Validate consultation fee if being updated
    if (updateData.consultationFee !== undefined) {
      if (updateData.consultationFee < 0) {
        return res
          .status(400)
          .json({ message: "Consultation fee cannot be negative" });
      }
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (req.file) {
      updatedDoctor.photo = process.env.APP_API_URL + "/" + req.file.path
      await updatedDoctor.save()
    }

    if (!updatedDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    return res.status(200).json({
      success: true,
      message: "update successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getDoctorByHospitalId = (req, res) => {
  try {
    const { hospitalId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({ message: "Invalid hospital ID" });
    }

    Doctor.find({ hospitalId })
      .populate("hospitalId", "name location")
      .then((doctors) => {
        if (doctors.length === 0) {
          return res.status(404).json({ message: "No doctors found for this hospital" });
        }
        res.status(200).json(doctors);
      })
      .catch((error) => {
        res.status(500).json({ message: error.message });
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Delete a doctor
export const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    const deletedDoctor = await Doctor.findByIdAndDelete(id);

    if (!deletedDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Add available slots for a doctor
export const addDoctorSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, slots } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    if (!date || !slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        message: "Date and at least one slot are required",
      });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Check if slots for this date already exist
    const existingSlotIndex = doctor.availableSlots.findIndex(
      (slot) => slot.date === date
    );

    if (existingSlotIndex !== -1) {
      // Add new slots to existing date
      const existingSlots = doctor.availableSlots[existingSlotIndex].slots;
      const newSlots = [...new Set([...existingSlots, ...slots])]; // Remove duplicates
      doctor.availableSlots[existingSlotIndex].slots = newSlots;
    } else {
      // Add new date with slots
      doctor.availableSlots.push({ date, slots });
    }

    const updatedDoctor = await doctor.save();
    res.status(200).json(updatedDoctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove slots from a doctor's availability
export const removeDoctorSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, slots } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    if (!date || !slots || !Array.isArray(slots)) {
      return res.status(400).json({
        message: "Date and slots array are required",
      });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Find the slot entry for this date
    const slotEntryIndex = doctor.availableSlots.findIndex(
      (slot) => slot.date === date
    );

    if (slotEntryIndex === -1) {
      return res.status(404).json({ message: "No slots found for this date" });
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
   return res.status(200).json(updatedDoctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get available slots for a doctor on specific date
export const getDoctorSlotsByDate = async (req, res) => {
  try {
    const { id, date } = req.params;
    console.log(id)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Find slots for the requested date
    const slotEntry = doctor.availableSlots.find((slot) => slot.date === date);

    if (!slotEntry) {
      return res.status(404).json({ message: "No slots available for this date" });
    }

    res.status(200).json({
      doctorId: doctor._id,
      doctorName: doctor.name,
      date: slotEntry.date,
      availableSlots: slotEntry.slots,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};