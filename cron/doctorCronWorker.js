import cron from "node-cron";
import connectDB from "../config/db.js";
import doctorNodel from "../model/doctor.nodel.js";


// --- Start Worker ---
console.log("🚀 Doctor Cron Worker Started...");

// Connect DB
await connectDB();


// 🔥 MAIN FUNCTION: SET ALL DOCTORS INACTIVE
async function setAllDoctorsInactive() {
  try {
    console.log("🔄 Cron Started:", new Date().toLocaleString());

    const result = await doctorNodel.updateMany(
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

    console.log(`✅ ${result.modifiedCount} Doctors Set to Inactive`);
    console.log("⏳ Completed:", new Date().toLocaleString());
  } catch (err) {
    console.error("❌ Error:", err);
  }
}



// =====================================================================
//  ⭐ CRON JOBS
// =====================================================================

// Every Minute TEST (उसे हटाया भी जा सकता है)
cron.schedule("* * * * *", () => {
  console.log("⏱ TEST CRON Running:", new Date().toLocaleTimeString());
});

// MAIN JOB – 11:10 PM IST → convert to UTC
// IST 23:10 = UTC 17:40 
cron.schedule("40 17 * * *", async () => {
  console.log("🌙 MAIN CRON Triggered (11:10 PM IST)");
  await setAllDoctorsInactive();
});

// BACKUP JOB – 11:11 PM IST → UTC 17:41
cron.schedule("41 17 * * *", async () => {
  console.log("🌙 BACKUP CRON Triggered (11:11 PM IST)");
  await setAllDoctorsInactive();
});


// =====================================================================
//  KEEP PROCESS ALIVE (Render Worker)
// =====================================================================

process.stdin.resume();
