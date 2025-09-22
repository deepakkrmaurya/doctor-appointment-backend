import hospitalModel from "../model/hospital.model.js";
import User from "../model/user.model.js";
import { sendOTP } from "../utils/SendOtp.js";

async function generate4DigitOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

const login = async (req, res) => {
    try {
        const { user_phone_number: userid, user_json_url } = req.body.userObj;
        // console.log(req.body.userObj)
        // console.log(userid)
        // console.log(user_json_url)
        const use = await fetch(user_json_url)

        if (!userid) {
            return res.status(400).json({
                success: false,
                message: 'userid is required'
            });
        }
        let user = await User.findOne({ userid });
        if (!user) {
            const { user_first_name, user_last_name } = await use.json()
            user = await User.create({
                userid,
                user_first_name,
                user_last_name
            })
            await user.save();

        }


        const options = {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000
        };
        const token = await user.generateJWTToken();
        return res
            .cookie('token', token, options)
            .json({
                success: true,
                message: "Login successfully",
                token: token,
                user: user
            });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

export const verifyOtp = async (req, res) => {
    const { userid, otp } = req.body;
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    try {
        const otpDoc = await User.findOne({
            userid,
            otp,
            otpExp: { $gte: fiveMinutesAgo }
        });
        if (!otpDoc) {
            return res.status(400).json({
                message: 'Invalid otp',
                expired: true
            });
        }
        otpDoc.otp = undefined
        otpDoc.otpExp = undefined
        await otpDoc.save()
        const options = {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000
        };

        const token = await otpDoc.generateJWTToken();
        return res
            .cookie('token', token, options)
            .json({
                success: true,
                message: "Login successfully",
                token: token,
                user: otpDoc
            });
    } catch (err) {
        return res.status(500).json({ error: 'Error verifying OTP' });
    }
}

export const Logout = async (req, res) => {
    try {
        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .clearCookie('token', null, options)
            .json({
                success: true,
                message: "user Logout successfully"
            })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const Register = async (req, res) => {
    try {
        // Simulate user registration logic
        const { name, email, mobile, password } = req.body;
        if (!name || !email || !mobile || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const verifiUser = await User.findOne({
            $or: [{ email }, { mobile }],
        });
        if (verifiUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email or mobile number'
            });
        }
        const newUser = await User.create({
            name,
            email,
            mobile,
            password
        });
        const token = await newUser.generateJWTToken();
        await newUser.save();
        const createUser = await User.findById(newUser._id).select('-password');
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: 'Strict', // Adjust as needed
            maxAge: 24 * 60 * 60 * 1000 // 1 day in milliseconds
        };

        return res.status(201)
            .cookie('token', token, options)
            .json({
                success: true,
                message: 'User registered successfully',
                user: createUser,
                token: token
            });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

const appointment = async (req, res) => {
    try {

        const { date, time, doctorId } = req.body;
        if (!date || !time || !doctorId) {
            return res.status(400).json({
                success: false,
                message: 'Date, time, and doctor ID are required'
            });
        }
        // Here you would typically save the appointment to the database
        return res.status(200).json({
            success: true,
            message: 'Appointment booked successfully',
            appointment: { date, time, doctorId }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

const getUser = async (req, res) => {
    try {
        const user = req.user;

        const hospital = await hospitalModel.findById(user?.hospitalId)
        return res.send({
            user,
            hospital
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

export const updateProfile = async (req,res) => {
    try {
        const use = req.user;
        const {user_first_name,user_last_name,email}= req.body;
       const user =   await User.findByIdAndUpdate(use._id,{
              user_first_name,
              user_last_name,
              email
        })

        await user.save()

        return res.status(200).json({
            success:true,
            message:"profile update successfull",
            user
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

export { login, Register, appointment, getUser }