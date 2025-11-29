import mongoose from "mongoose";
const timeSlotSchema = new mongoose.Schema({
    startTime: String,
    endTime: String,
    id: String
});

const availabilitySchema = new mongoose.Schema({
    date: String,
    timeSlots: [timeSlotSchema]
});

const Availability = new mongoose.Schema(
    {
        doctor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true,
        },
        availability: [availabilitySchema]

    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Availability', Availability);