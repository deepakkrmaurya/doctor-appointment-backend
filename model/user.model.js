import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
const userSchema = new mongoose.Schema({
    user_first_name: {
        type: String,
    },
    user_last_name: {
        type: String,
    },
    userid: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        // match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },
    email: {
        type: String,
        unique: true,
    },
    //  otp: {
    //     type: Number,
    // },
    //  otpExp: {
    //     type: Date,
    // },
    // password: {
    //     type: String,
    //     required: true,
    //     minlength: 6
    // },

    role: {
        type: String,
        enum: ['patient'],
        required: true,
        default: 'patient'
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        default: null
    }
}, {
    timestamps: true,
    versionKey: false
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (err) {
        next(err);
    }
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateJWTToken = function () {
    return jwt.sign({
        id: this._id,
        role: this.role
    },
        process.env.JWT_SECRET, {
        expiresIn: '5d'
    });
}


const User = mongoose.model('User', userSchema);

export default User;   
