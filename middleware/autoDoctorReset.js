import Doctor from "../model/doctor.nodel.js";
import Settings from "../model/settings.model.js";

export const autoDoctorReset = async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    let settings = await Settings.findOne();
    if (!settings) {
      // First time create settings
      settings = await Settings.create({ lastResetDate: today });
      return next();
    }

    // अगर आज reset नहीं हुआ है
    if (settings.lastResetDate !== today) {
      console.log("🔄 Auto Doctor Reset Triggered!");

      await Doctor.updateMany(
        { active: true },
        {
          $set: {
            active: false,
            currentAppointment: 0,
            lastActive: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      settings.lastResetDate = today;
      await settings.save();

      console.log("✔ All Doctors Successfully Deactivated!");
    }

    next();
  } catch (error) {
    console.log("❌ Auto Doctor Reset Error:", error);
    next();
  }
};
