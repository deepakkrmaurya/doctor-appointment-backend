import Razorpay from 'razorpay';
import crypto from 'crypto'
import dotenv from 'dotenv';
dotenv.config()
import mongoose from "mongoose";
import apponitment from "../model/apponitment.js";
import User from '../model/user.model.js';
import io from '../index.js';
import doctorNodel from '../model/doctor.nodel.js';
import hospitalModel from '../model/hospital.model.js';
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});
// Create a new appointment
export const createAppointment = async (req, res) => {
    const today = new Date();
    const formatted = today.toISOString().split("T")[0];
    try {
        const {
            patient,
            mobile,
            dob,
            patientId,
            doctorId,
            hospitalId,
            date,
            // slot,
            amount,
            booking_amount,
            paymentStatus
        } = req.body;
        //    console.log("Received appointment data:", req.body); // Debugging line
        // Validate required fields
        if (
            !patient ||
            !doctorId ||
            !hospitalId ||
            !date ||
            !booking_amount
        ) {
            return res.status(400).json({ message: "All fields are required" });
        }
        // Debugging line
        // Check if the slot is available (you might want to add this logic)
        // const existingAppointment = await apponitment.findOne({
        //     doctorId,
        //     date,
        //     slot,
        //     status: { $ne: "cancelled" },
        // });
        // if (existingAppointment) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Slot is already booked"
        //     });
        // }

        const doctor = await doctorNodel.findById(doctorId)
        const hospital = await hospitalModel.findById(hospitalId)
        if(!doctor.status){
            return res.status(400).json({
                success:false,
                message:`Doctor In Active : ${doctor.deactivationReason}`
            })
        }
        if(!hospital.status){
            return res.status(400).json({
                success:false,
                message:`Hospital In Active : ${hospital.deactivationReason}`
            })
        }

        const newAppointment = new apponitment({
            patient,
            mobile,
            dob,
            patientId,
            doctorId,
            hospitalId,
            date,
            // slot,
            amount,
            booking_amount,
        });
        const savedAppointment = await newAppointment.save();
        newAppointment.paymentMethod = 'Cash'
        newAppointment.paymentStatus = 'pending'
        await newAppointment.save();
        if(date==formatted){
            io.emit("createAppointment", savedAppointment)
        }
        return res.status(201).json({
            success: true,
            savedAppointment
        });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ message: error.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify the payment signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, error: 'Invalid signature' });
        }

        // Update appointment
        const appointment = await apponitment.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            {
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                status: 'Confirmed',
                paymentStatus: "Completed"
            },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }

        res.json({ success: true, appointment });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
}

// Get all appointments
export const getAppointments = async (req, res) => {
    try {
        const { role, _id } = req.user;
        const user = await User.findById(_id)
        let query = {};
        // Filter based on user role
        if (role === "patient") {
            query = {
                $or: [
                    { patientId: _id },
                    { mobile: user?.userid }
                ]
            };

        } else if (role === "doctor") {
            query.doctorId = _id;
        } else if (role === "hospital") {
            query.hospitalId = _id;
        } else if (role === "staff") {
            query.hospitalId = req.user.hospitalId;
        }
        // Admin can see all appointments

        const appointments = await apponitment.find(query)
            .populate("doctorId", "currentAppointment")
            .sort({ createdAt: -1 });

        return res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single appointment by ID
export const getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid appointment ID" });
        }
        const appointments = await apponitment.findById(id)
            .populate("patientId", "name email mobile")
            .populate("doctorId", "name specialty experience")
            .populate("hospitalId", "name email location address phone city state");

        if (!appointments) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Check if the requesting user has permission to view this appointment
        // const { role, userId } = req.user;
        // if (
        //     role !== "admin" &&
        //     appointment.patientId._id.toString() !== userId &&
        //     appointment.doctorId._id.toString() !== userId &&
        //     appointment.hospitalId._id.toString() !== userId
        // ) {
        //     return res.status(403).json({ message: "Unauthorized access" });
        // }

        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update appointment status
export const updateAppointmentStatus = async (req, res) => {
    try {
        const user = req.user
        const { id } = req.params;
        const { status } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid appointment ID" });
        }

        if (!status || !["confirmed", "cancelled", "completed"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }


        const appointment = await apponitment.findById(id);

        const updatedDoctor = await doctorNodel.findByIdAndUpdate(
            user._id,
            { currentAppointment: appointment.appointmentNumber },
            { new: true }
        );
 
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }
        appointment.status = status;
        const newAppointment = await appointment.save();
        io.emit("appointmentUpdate", newAppointment);
        io.emit("doctorUpdate", updatedDoctor);
        return res.json(appointment)
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cancel an appointment
export const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid appointment ID" });
        }

        const appointment = await apponitment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Check if the appointment can be cancelled (not already completed or cancelled)
        if (appointment.status === "completed") {
            return res
                .status(400)
                .json({ message: "Completed appointments cannot be cancelled" });
        }

        if (appointment.status === "cancelled") {
            return res
                .status(400)
                .json({ message: "Appointment is already cancelled" });
        }


        appointment.status = "cancelled";
        const updatedAppointment = await appointment.save();

        return res.status(200).json({
            success: true,
            message: "Appointment cancelled successfully."
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
export const getToDayAppointment = async (req, res) => {
    try {
        const doctorId = req.user._id;
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ message: "Invalid doctor ID" });
        }
        // Get start and end of today
        const today = new Date();
        const formatted = today.toISOString().split("T")[0];
        // Get all appointments for this doctor created today that aren't cancelled
        let appointments = null;
        if (req.user.role == 'hospital') {
            const appointment = await apponitment.find({
                hospitalId: doctorId,
                date: formatted,
                status: { $ne: 'cancelled' } // Exclude cancelled appointments
            });

            appointments = appointment
        }
        if (req.user.role == 'doctor') {

            const appointment = await apponitment.find({
                doctorId,
                date: formatted,
                status: { $ne: 'cancelled' } // Exclude cancelled appointments
            });

            appointments = appointment
            
        }

        if (req.user.role == 'staff') {
            const appointment = await apponitment.find({
                hospitalId: req.user.hospitalId,
                date: formatted,
                status: { $ne: 'cancelled' } // Exclude cancelled appointments
            });
            appointments = appointment
        }

        if (req.user.role == 'admin') {
            const appointment = await apponitment.find({
                date: formatted,
                status: { $ne: 'cancelled' }
            });

            appointments = appointment
        }




        return res.status(200).json({
            success: true,
            appointments
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
// Get available slots for a doctor on a specific date
export const getAvailableSlots = async (req, res) => {
    try {
        const { doctorId, date } = req.params;

        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ message: "Invalid doctor ID" });
        }

        // Get all appointments for this doctor on this date that aren't cancelled
        const appointments = await Appointment.find({
            doctorId,
            date,
            status: { $ne: "cancelled" },
        });

        // This assumes you have some way to determine all possible slots
        // You might want to get this from the Doctor's schedule
        const allSlots = [
            "09:00-10:00",
            "10:00-11:00",
            "11:00-12:00",
            "12:00-13:00",
            "14:00-15:00",
            "15:00-16:00",
            "16:00-17:00",
        ];

        // Get booked slots
        const bookedSlots = appointments.map((appt) => appt.slot);

        // Filter out booked slots
        const availableSlots = allSlots.filter(
            (slot) => !bookedSlots.includes(slot)
        );

        res.status(200).json({ availableSlots });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid appointment ID" });
        }

        if (
            !paymentStatus ||
            !["pending", "completed", "failed"].includes(paymentStatus)
        ) {
            return res.status(400).json({ message: "Invalid payment status" });
        }

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Typically only admin or payment system should update payment status
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        appointment.paymentStatus = paymentStatus;
        const updatedAppointment = await appointment.save();

        res.status(200).json(updatedAppointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAppointmentBydoctorIdAndHospitalIdAndAdminId = async (req, res) => {
    try {
        const doctorId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ message: "Invalid doctor ID" });
        }
        let appointments = null;
        if (req.user.role == 'hospital') {
            const appointment = await apponitment.find({
                hospitalId: doctorId,

            });

            appointments = appointment
        }
        if (req.user.role == 'doctor') {
            const appointment = await apponitment.find({
                doctorId,
            });

            appointments = appointment
        }
        return res.status(200).json({
            success: true,
            appointments
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const getAppointmentByAppointmentId = async (req, res) => {
    try {
        const { patientId, doctorId, hospitalId } = req.params;
        return res.send(req.params)
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
