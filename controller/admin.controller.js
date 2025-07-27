import Admin from "../model/admin.js";

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    // Find doctor by email
    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    // Check password (assuming you have a method to compare passwords)
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // Generate a token (assuming you have a method to generate tokens)
    const token = await admin.generateJWTToken(); // Assuming you have a method to generate tokens
    // Send response with doctor details and token
    const doctorData = admin.toObject();
    delete doctorData.password;

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