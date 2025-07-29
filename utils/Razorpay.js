// utils/multiHospitalRazorpay.js
import Razorpay from 'razorpay'
import crypto from 'crypto'
import Hospital from '../model/hospital.model.js'
import Appointment  from '../model/apponitment.js'


const getRazorpayInstance = async (hospitalId) => {
  const hospital = await Hospital.findById(hospitalId);
  
  if (!hospital) {
    throw new Error('Hospital not found');
  }
  
  const keyId = hospital.paymentSettings.razorpayAccountId || process.env.RAZORPAY_KEY_ID;
  const keySecret = hospital.paymentSettings.razorpayAccountId ? 
    process.env[`RAZORPAY_SECRET_${hospital.paymentSettings.razorpayAccountId}`] : 
    process.env.RAZORPAY_KEY_SECRET;
  
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
};

// Calculate final amount with hospital-specific fees
const calculateFinalAmount = (baseAmount, hospitalId) => {
  return Hospital.findById(hospitalId).then(hospital => {
    if (!hospital) throw new Error('Hospital not found');
    
    const { processingFee, taxPercentage } = hospital.paymentSettings;
    let finalAmount = baseAmount;
    
    // Add processing fee
    finalAmount += processingFee;
    
    // Add tax
    if (taxPercentage > 0) {
      finalAmount += (baseAmount * taxPercentage) / 100;
    }
    
    return Math.round(finalAmount * 100); // Convert to paise
  });
};

// Create order for specific hospital
exports.createHospitalOrder = async (appointmentId, hospitalId, baseAmount) => {
  try {
    const finalAmount = await calculateFinalAmount(baseAmount, hospitalId);
    const razorpay = await getRazorpayInstance(hospitalId);
    
    const options = {
      amount: finalAmount,
      currency: 'INR',
      receipt: `hosp_${hospitalId}_appt_${appointmentId}`,
      payment_capture: 1,
      notes: {
        hospitalId,
        appointmentId,
        type: 'hospital_appointment'
      }
    };

    const response = await razorpay.orders.create(options);
    
    // Update appointment with payment details
    await Appointment.findByIdAndUpdate(appointmentId, {
      paymentOrderId: response.id,
      paymentStatus: 'created',
      paymentAmount: finalAmount / 100, // Store in rupees
      hospital: hospitalId
    });

    return response;
  } catch (error) {
    console.error('Error creating hospital order:', error);
    throw error;
  }
};

// Verify payment for specific hospital
exports.verifyHospitalPayment = async (req, appointmentId) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const appointment = await Appointment.findById(appointmentId).populate('hospital');
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    
    const razorpay = await getRazorpayInstance(appointment.hospital._id);
    
    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', razorpay.key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return { success: false, error: 'Invalid signature' };
    }

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        paymentId: razorpay_payment_id,
        paymentOrderId: razorpay_order_id,
        paymentStatus: 'completed',
        paymentDate: new Date()
      },
      { new: true }
    ).populate('patient doctor hospital');

    return {
      success: true,
      appointment: updatedAppointment
    };
  } catch (error) {
    console.error('Error verifying hospital payment:', error);
    throw error;
  }
};