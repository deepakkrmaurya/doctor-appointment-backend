import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  date: { type: String, required: true }, // YYYY-MM-DD format
  seq: { type: Number, default: 0 },
});

export default mongoose.model("Counter", counterSchema);
