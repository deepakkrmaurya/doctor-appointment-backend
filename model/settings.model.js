import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  lastResetDate: { type: String },
});

export default mongoose.model("Settings", settingsSchema);
