import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
const adminSchema = new mongoose.Schema({
    
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['admin'],
        required: true,
        default: 'admin'
    },
}, {
    timestamps: true,
    versionKey: false
});

adminSchema.pre('save', async function (next) {
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
adminSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

adminSchema.methods.generateJWTToken = function () {
    return jwt.sign({
        id: this._id,
        role: this.role
    },
        process.env.JWT_SECRET, {
        expiresIn: '5d'
    });
}


const Admin = mongoose.model('Admin', adminSchema);

export default Admin;   
