import twilio from 'twilio'

// const client = new twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

// const client = new twilio(
//  'AC6761ac165a577a429ba72aa2f864fc44',
//   'b541884dd2fdeccde556f20ed4372566'
// );
const client = new twilio(
 'ACffa08511b72a9aba171f829dc43d379e',
  '8a17be254a1a53d8846e30678a59f230'
);


export async function sendOTP(userid,otp) {
    try {
    const message = await client.messages.create({
      body: `Your verification code is ${otp}. It is valid for 5 minutes. Never share this code with anyone.`,
    //   from: '+16282374807',
    //   from: '+16282374807',
      to: '+'+91+userid,
    });
    return otp;
  } catch (error) {
    console.error("Failed to send OTP:", error.message);
    return null;
  }
}

