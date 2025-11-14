import cron from 'node-cron';
import doctorNodel from '../model/doctor.nodel.js';
import counterModel from '../model/counter.model.js';


class DoctorCronService {
  constructor() {
    this.initCronJobs();
  }

  initCronJobs() {
    // Run every day at 11:00 PM (23:00) to set all doctors to inactive
    cron.schedule('0 23 * * *', async () => {
      console.log('🌙 Running doctor status update cron job...');
      await this.setAllDoctorsInactive();
    });

    // Optional: Run at 2:00 AM as backup
    cron.schedule('0 2 * * *', async () => {
      console.log('🌙 Backup: Running doctor status update cron job...');
      await this.setAllDoctorsInactive();
    });

    console.log('✅ Doctor cron jobs initialized');
  }

  async setAllDoctorsInactive() {
    try {
        
      const result = await doctorNodel.updateMany(
        { active: true },
        {
          $set: { 
            active: false,
            currentAppointment:0,
            lastActive: new Date(),
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ Set ${result.modifiedCount} doctors to inactive status`);
      console.log(`🕒 All doctors set to inactive at: ${new Date().toLocaleString()}`);

      return {
        success: true,
        message: `Set ${result.modifiedCount} doctors to inactive`,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Error setting doctors to inactive:', error);
      return {
        success: false,
        message: error.message,
        timestamp: new Date()
      };
    }
  }

  // Manual trigger function
  async manualSetInactive() {
    console.log('🔄 Manually setting all doctors to inactive...');
    return await this.setAllDoctorsInactive();
  }

  // Get current active doctors count
  async getActiveDoctorsCount() {
    try {
      const count = await doctorNodel.countDocuments({ active: true });
      return count;
    } catch (error) {
      console.error('❌ Error getting active doctors count:', error);
      return 0;
    }
  }
}

// Create and export singleton instance
const doctorCronService = new DoctorCronService();
export default doctorCronService;