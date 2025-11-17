import cron from 'node-cron';
import doctorNodel from '../model/doctor.nodel.js';

class DoctorCronService {
  constructor() {
    console.log('🔄 DoctorCronService constructor called at:', new Date().toLocaleString());
    this.initCronJobs();
  }

  initCronJobs() {
    console.log('⏰ Initializing cron jobs at:', new Date().toLocaleString());
    
    // Test cron - हर मिनट (debugging के लिए)
    cron.schedule('* * * * *', () => {
      console.log('✅ TEST CRON WORKING! Time:', new Date().toLocaleString());
    });

    // Main job - रोज 11:23 PM (19:18) पर
    cron.schedule('11 23 * * *', async () => {
      console.log('🌙 MAIN CRON: Running at 7:18 PM (19:18)');
      await this.setAllDoctorsInactive();
    });

    // Backup job - 11:20 PM पर (2 minute बाद)
    cron.schedule('11 23 * * *', async () => {
      console.log('🌙 BACKUP CRON: Running at 11:02 PM (23:11)');
      await this.setAllDoctorsInactive();
    });

    console.log('✅ All cron jobs scheduled for 11:02 PM and 11:02 PM');
    
    // Show next execution times
    this.showNextRuns();
  }

  showNextRuns() {
    // Next 7:18 PM calculation
    const now = new Date();
    const targetTime = new Date();
    targetTime.setHours(19, 18, 0, 0);
    
    if (now > targetTime) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    const timeDiff = targetTime - now;
    const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log(`⏳ Next cron execution at 7:18 PM (in ${hoursLeft}h ${minutesLeft}m)`);
  }

  async setAllDoctorsInactive() {
    try {
      console.log('🔄 Starting setAllDoctorsInactive...');
      
      const result = await doctorNodel.updateMany(
        { active: true },
        {
          $set: { 
            active: false,
            currentAppointment: 0,
            lastActive: new Date(),
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ Set ${result.modifiedCount} doctors to inactive`);
      console.log(`🕒 Completed at: ${new Date().toLocaleString()}`);
      
      return {
        success: true,
        message: `Set ${result.modifiedCount} doctors to inactive`,
        modifiedCount: result.modifiedCount,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Error in setAllDoctorsInactive:', error);
      return {
        success: false,
        message: error.message,
        timestamp: new Date()
      };
    }
  }

  // Manual trigger function (testing के लिए)
  async manualSetInactive() {
    console.log('🔄 Manually triggering setAllDoctorsInactive...');
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

  // Test function for immediate execution
  async testNow() {
    console.log('🧪 TEST: Executing cron job immediately...');
    return await this.setAllDoctorsInactive();
  }
}

// Singleton instance
console.log('📝 Creating DoctorCronService instance...');
const doctorCronService = new DoctorCronService();
export default doctorCronService;