
import doctorNodel from "../model/doctor.nodel.js";
import Hospital from "../model/hospital.model.js";
import mongoose from "mongoose";


export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    //  console.log(req.body)
    //  return
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    // Find doctor by email
    const hospital = await Hospital.findOne({ email }).select("+password");
    if (!hospital) {
      return res.status(404).json({ message: "Invalid email or password" });
    }
    // Check password (assuming you have a method to compare passwords)
    const isMatch = await hospital.comparePassword(password); // Assuming you have a method to compare passwords
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // Generate a token (assuming you have a method to generate tokens)
    const token = await hospital.generateAuthToken();
    // Send response with doctor details and token
    const doctorData = hospital.toObject();
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
        user: hospital,
        token,
      });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}


export const createHospital = async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      password,
      website,
     
      rating,
      specialties,
      facilities,
    } = req.body;


    // 

    // return 

    // Validate required fields
    if (
      !name ||
      !address ||
      !city ||
      !state ||
      !pincode ||
      !phone ||
      !email ||
      !password ||
      !rating ||
      !specialties ||
      !facilities
    ) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    // Validate rating
    if (rating < 0 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 0 and 5" });
    }

    // Check if hospital already exists
    const hospitalExists = await Hospital.findOne({ email });
    if (hospitalExists) {
      return res.status(400).json({ message: "Hospital already exists" });
    }

    const hospital = new Hospital({
      name,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      password,
      website: website || "",
      image: process.env.APP_API_URL + '/'+  req.file.path,
      rating,
      specialties,
      facilities,
    });

    const createdHospital = await hospital.save();
    return res.status(201).json(
      {
        sucess: true,
        message: "hospital create successfully",
        createdHospital
      }
    );
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: error.message });
  }
};


export const getHospitals = async (req, res) => {
  try {
    const { city, state, specialty, minRating, name } = req.query;
    let query = {};

    // Filter by city if provided
    if (city) {
      query.city = { $regex: city, $options: "i" };
    }

    // Filter by state if provided
    if (state) {
      query.state = { $regex: state, $options: "i" };
    }

    // Filter by specialty if provided
    if (specialty) {
      query.specialties = { $in: [new RegExp(specialty, "i")] };
    }

    // Filter by name if provided
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    // Filter by rating if provided
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    const hospitals = await Hospital.find(query).sort({ rating: -1 });
    return res.status(200).json(hospitals);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const getHospitalById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid hospital ID" });
    }

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    res.status(200).json(hospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateHospital = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      website,
      rating,
      specialties,
      facilities,
    } = req.body;
 
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid hospital ID" });
    }

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    // Validate rating if being updated
    if (rating && (rating < 0 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be between 0 and 5" });
    }

    

    hospital.name = name || hospital.name;
    hospital.address = address || hospital.address;
    hospital.city = city || hospital.city;
    hospital.state = state || hospital.state;
    hospital.pincode = pincode || hospital.pincode;
    hospital.phone = phone || hospital.phone;
    hospital.email = email || hospital.email;
    hospital.website = website || hospital.website;
    hospital.rating = rating || hospital.rating;
    hospital.specialties = specialties || hospital.specialties;
    hospital.facilities = facilities || hospital.facilities;
    if(req.file){
      hospital.image = process.env.APP_API_URL + "/" + req.file.path;
    }
    const updatedHospital = await hospital.save();
    return res.status(200).json({
      success: true,
      message: "hospital update successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { _id } = req.user;

    const { id } = req.params

    const verifyHospital = await Hospital.findById(id);
    if (!verifyHospital) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hospital id'
      })
    }
    verifyHospital.status = status;
    await verifyHospital.save()
    return res.status(200).json({
      success: true,
      message: `${status} successfully`
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const deleteHospital = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid hospital ID" });
    }
    await doctorNodel.deleteMany({ hospitalId: id });
    const hospital = await Hospital.findByIdAndDelete(id);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hospital and associated doctors deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get hospitals by specialty
// @route   GET /api/hospitals/specialty/:specialty
// @access  Public
export const getHospitalsBySpecialty = async (req, res) => {
  try {
    const { specialty } = req.params;
    const { city, state } = req.query;
    let query = { specialties: { $in: [new RegExp(specialty, "i")] } };

    if (city) {
      query.city = { $regex: city, $options: "i" };
    }

    if (state) {
      query.state = { $regex: state, $options: "i" };
    }

    const hospitals = await Hospital.find(query).sort({ rating: -1 });
    res.status(200).json(hospitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search hospitals
// @route   GET /api/hospitals/search
// @access  Public
export const searchHospitals = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const hospitals = await Hospital.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { city: { $regex: query, $options: "i" } },
        { state: { $regex: query, $options: "i" } },
        { specialties: { $in: [new RegExp(query, "i")] } },
      ],
    }).sort({ rating: -1 });

    res.status(200).json(hospitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};