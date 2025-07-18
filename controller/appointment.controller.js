
import mongoose from "mongoose";
import apponitment from "../model/apponitment.js";

// Create a new appointment
export const createAppointment = async (req, res) => {
    try {
        const {
            patientId,
            doctorId,
            hospitalId,
            date,
            slot,
            amount,
        } = req.body;
        //    console.log("Received appointment data:", req.body); // Debugging line
        // Validate required fields
        if (
            !patientId ||
            !doctorId ||
            !hospitalId ||
            !date ||
            !slot ||
            !amount
        ) {
            return res.status(400).json({ message: "All fields are required" });
        }
        // Debugging line
        // Check if the slot is available (you might want to add this logic)
        const existingAppointment = await apponitment.findOne({
            doctorId,
            date,
            slot,
            status: { $ne: "cancelled" },
        });
        if (existingAppointment) {
            return res.status(400).json({ message: "Slot is already booked" });
        }

        const newAppointment = new apponitment({
            patientId,
            doctorId,
            hospitalId,
            date,
            slot,
            amount,
            // status: "confirmed", // or "pending" based on your workflow
            // paymentStatus: "completed", // or "pending" based on your payment flow
        });

        const savedAppointment = await newAppointment.save();
        return res.status(201).json({
            success: true,
            message: "Appointment created successfully",
            appointment: savedAppointment,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Get all appointments
export const getAppointments = async (req, res) => {
    try {
        const { role, _id } = req.user;
        let query = {};
        // Filter based on user role
        if (role === "patient") {
            query.patientId = _id;
        } else if (role === "doctor") {
            query.doctorId = _id;
        } else if (role === "hospital") {
            query.hospitalId = _id;
        }
        // Admin can see all appointments
        // console.log(query)
        const appointments = await apponitment.find(query)
            .populate("patientId", "name email")
            .populate("doctorId", "name specialization")
        // .populate("hospitalId", "name location");
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
            .populate("hospitalId", "name location address phone");

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
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid appointment ID" });
        }

        if (!status || !["confirmed", "cancelled", "completed"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const appointment = await apponitment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Check permissions (only doctor, hospital admin, or patient can update status)
        // const { role, _id } = req.user;
        //   console.log(mongoose.Types.ObjectId.isValid(id))
        // const isAuthorized =
        //     role === "admin" ||
        //     appointment.patientId.toString() === _id ||
        //     appointment.doctorId.toString() === _id ||
        //     appointment.hospitalId.toString() === _id;
          
        // if (!isAuthorized) {
        //     return res.status(403).json({ message: "Unauthorized access" });
        // }

        appointment.status = status;
        const updatedAppointment = await appointment.save();

       return res.status(200).json({
        success:true,
        message:"Appointment confirmed"
       });
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
            success:true,
            message:"Appointment cancelled successfully."
        });
    } catch (error) {
      return  res.status(500).json({ message: error.message });
    }
};
export const getToDayAppointment = async (req, res) => {
    try {
        const doctorId = req.user._id;
         console.log(doctorId)
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ message: "Invalid doctor ID" });
        }

        // Get start and end of today
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of day (00:00:00)

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // Start of next day

       
        // Get all appointments for this doctor created today that aren't cancelled
        let appointments = null;
        if (req.user.role == 'hospital') {
            const appointment = await apponitment.find({
                hospitalId: doctorId,
                createdAt: {
                    $gte: today,  // Greater than or equal to start of today
                    $lt: tomorrow // Less than start of tomorrow
                },
                status: { $ne: 'cancelled' } // Exclude cancelled appointments
            });

            appointments = appointment
        }
        if (req.user.role == 'doctor') {
            const appointment = await apponitment.find({
                doctorId,
                createdAt: {
                    $gte: today,  // Greater than or equal to start of today
                    $lt: tomorrow // Less than start of tomorrow
                },
                status: { $ne: 'cancelled' } // Exclude cancelled appointments
            });
             
            appointments = appointment
        }

        if (req.user.role == 'admin') {
            const appointment = await apponitment.find();

            appointments = appointment
        }




        return res.status(200).json({
            success: true,
            appointments
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
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
