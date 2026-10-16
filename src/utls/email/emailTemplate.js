export const otpConfirmationTemplate = ({ name, otp }) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Your Email</title>
    </head>
    <body style="margin:0; padding:0; font-family:Arial,sans-serif; background-color:#f4f4f7;">
        <div style="max-width:600px; margin:30px auto; background:#ffffff; border-radius:12px; overflow:hidden;">
            
            <div style="background:#4f46e5; padding:25px; text-align:center; color:#ffffff;">
                <h1 style="margin:0;">Saraha App</h1>
                <p style="margin-bottom:0;">Email Verification</p>
            </div>

            <div style="padding:30px; text-align:center; color:#333333;">
                <h2>Hello ${name || "User"}!</h2>

                <p style="font-size:16px; line-height:1.6;">
                    Thank you for signing up. Please use the code below to confirm your email address.
                </p>

                <div style="margin:25px 0; padding:15px; background:#f3f4f6; border-radius:8px;">
                    <span style="font-size:32px; font-weight:bold; letter-spacing:8px; color:#4f46e5;">
                        ${otp}
                    </span>
                </div>

                <p style="font-size:14px; color:#666666;">
                    This code expires in 10 minutes.
                </p>

                <p style="font-size:14px; color:#666666;">
                    If you did not create an account, please ignore this email.
                </p>
            </div>

            <div style="padding:15px; text-align:center; background:#f9fafb; color:#888888; font-size:12px;">
                &copy; ${new Date().getFullYear()} Saraha App. All rights reserved.
            </div>

        </div>
    </body>
    </html>
    `;
};