import User from "../model/user.model.js";


const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(req.body);
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }
        const options = {
            httpOnly: true,
            secure: true, 
            sameSite: 'none',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        };

        const token = await user.generateJWTToken();
        const userData = await User.findById(user._id).select('-password');
        return res.status(200)
            .cookie('token', token, options)
            .json({
                success: true,
                message: "Login successful",
                user: userData,
                token: token
            })
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error', error: error.message });
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

export { login, Register, appointment }