import Staff from "../model/staff.model.js";

export const StaffRegister = async (req, res) => {
    try {
        const { name, email, password, role, number, hospitalId } = req.body;

        // Check if all fields are present
        if (!name || !email || !password || !number || !hospitalId) {
            return res.status(400).json({
                success: false,
                message: "All fields  are required.",
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format.",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long.",
            });
        }

        const contactRegex = /^[0-9]{10}$/;
        if (!contactRegex.test(number)) {
            return res.status(400).json({
                success: false,
                message: "Contact number must be a 10-digit number.",
            });
        }

        const existingStaff = await Staff.findOne({ email });
        if (existingStaff) {
            return res.status(400).json({
                success: false,
                message: "Email is already registered.",
            });
        }

        const staff = await Staff.create({
            name,
            email,
            password,
            role,
            number,
            hospitalId
        });
        await staff.save();
        return res.status(201).json({
            success: true,
            message: 'staff register successfully'
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required." });
        }

        // Check if staff exists
        const staff = await Staff.findOne({ email }).select('+password');
        if (!staff) {
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }

        // Check password (if hashed using bcrypt)
        const isMatch = await staff.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }
        const token = await staff.getSignedJwtToken()
        const option = {
            httpOnly: true,
            secure: true
        }
        return res.status(200)
            .cookie('token', token, option)
            .json({
                success: true,
                user: staff,
                token: token,
                message: 'login successfully'
            })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const getStaff = async (req, res) => {
    try {
        const { role, _id } = req.user;
        var Allstaff = null;
        if (role === 'admin') {
            const staff = await Staff.find();
            Allstaff = staff
        } else if (role === 'hospital') {
            const staff = await Staff.find({
                hospitalId: _id
            });
            Allstaff = staff
        }
        return res.status(200).json({
            success: true,
            staff: Allstaff
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await Staff.findByIdAndDelete(id);
        if (!staff) {
            return res.status(400).json({
                success: false,
                message: "invalid staff id"
            })
        }

        return res.status(200).json({
            success: true,
            message: "remove successfully"
        })


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const getStaffByHospitalId = async(req,res)=>{
    try {
          const {hospital}=req.params;
          const staff = await Staff.find({hospitalId:hospital})
          if(!staff){
            return res.status(400).json({
                success:false,
                message:"not found staff"
            })
          }
          return res.status(200).json(staff)
    } catch (error) {
         return res.status(500).json({
            success:false,
            message:error.message
         })
    }
}