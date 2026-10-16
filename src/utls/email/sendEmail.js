import nodemailer from "nodemailer";


export const sendEmail = async ({ to, subject, html }) => {
    const transporter = nodemailer.createTransport({
        auth: {
            user: process.env.EMAI_USER,
            pass: process.env.EMAI_PASS
        },
        service: "gmail"
    })

    const info = await transporter.sendMail({
        from: "sarah app <saraha@gmail.com>",
        to,
        subject,
        html
    })
    console.log(info.accepted)
}