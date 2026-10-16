import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { userModel } from "../../DB/models/user.model.js";
import { decodeToken, tokenEnum } from "../../middlleware/auth.middleware.js";
import { random } from "../../utls/email/creatOtp.js";
import { otpConfirmationTemplate } from "../../utls/email/emailTemplate.js";
import { sendEmail } from "../../utls/email/sendEmail.js";
import { errorRes } from "../../utls/error.res.js";
import { encryption } from "../../utls/scurity/encryption.js";
import { compareHash, createHash } from "../../utls/scurity/hash.js";
import { ProviderEnum } from "./user.types.js";
const googlClient = new OAuth2Client()

export const signupServices = async ({ fullname, email, password, gender, phone, bio, age, userName }) => {
    // const [isEmailExist, isUserNameExist] = await Promise.all([
    //     userModel.findOne({ email }),
    //     userModel.findOne({ userName })
    // ])

    // if (isEmailExist || isUserNameExist) {
    //     errorRes({
    //         msg: `${isEmailExist ? "email" : "userNmae"} already exist`,
    //         statusCode: 400
    //     })
    // }
    const isExist = await userModel.findOne({
        $or: [
            { email },
            { userName }
        ]
    })

    if (isExist) {
        errorRes({
            msg: `${isExist.email == email ? "email" : "userNmae"} already exist`,
            statusCode: 400
        })
    }
    const otp = random(6)
    sendEmail({
        to: email,
        subject: "Confirm Your Email - Saraha App ",
        html: otpConfirmationTemplate({
            name: fullname,
            otp
        })
    })
    const user = await userModel.create({
        fullname,
        email,
        password: await createHash(password),
        gender,
        phone,
        bio,
        age,
        userName,
        otp: {
            code: await createHash(otp),
            expirein: Date.now() + 5 * 60 * 1000
        }
    })

    return {
        data: user
    }
}


export const loginServices = async (identifier, password) => {
    const user = await userModel.findOne({
        $or: [
            { email: identifier },
            { userName: identifier }
        ]
    })


    if (!user) {
        errorRes({
            msg: "invalid credential x",
            statusCode: 400
        })
    }

    const isPasswordMatch = await compareHash(password, user.password)


    if (!isPasswordMatch) {
        errorRes({
            msg: "invalid credential",
            statusCode: 400
        })
    }
    const accessToken = jwt.sign({
        _id: user._id,
        email: user.email
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "30M"
    })
    const refreshToken = jwt.sign({
        _id: user._id,
        email: user.email
    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7D"
    })
    return {
        data: {
            accessToken,
            refreshToken
        }
    }
}


export const refreshToken = async (authorization) => {
    const { user } = await decodeToken({ authorization, tokenType: tokenEnum.refresh })
    const accessToken = jwt.sign({
        _id: user._id,
        email: user.email
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "30M"
    })
    return {
        data: {
            accessToken
        }
    }
}

export const googleLogin = async (token) => {
    const ticket = await googlClient.verifyIdToken({
        idToken: token,
        audience: process.env.CLIENT_ID
    })
    const { email, name, picture } = ticket.getPayload()
    let user = await userModel.findOne({ email })
    let statusCode = 200

    if (user) {
        if (user.provider !== ProviderEnum.google) {
            errorRes({
                msg: "use your provider"
            })
        }

    } else {
        statusCode = 201
        user = await userModel.create({
            email,
            fullname: name,
            profileImage: picture,
            provider: ProviderEnum.google,
            confirmedAt: Date.now()
        })
    }
    const accessToken = jwt.sign({
        _id: user._id,
        email: user.email
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15M"
    })
    const refreshToken = jwt.sign({
        _id: user._id,
        email: user.email
    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7D"
    })
    return {
        data: {
            accessToken,
            refreshToken
        },
        statusCode

    }
}

export const confirmEmail = async (email, otp) => {
    const user = await userModel.findOne({
        email,
        confirmedAt: {
            $exists: false
        }
    })
    if (!user) {
        errorRes({
            msg: "user not found ",
            statusCode: 404
        })
    }
    await checkOtp(user, otp)
    user.confirmedAt = Date.now()
    user.otp = undefined;
    await user.save()
    return {
        data: {
            user
        }
    }
}

export const forgetPassSendOtp = async (email) => {
    const user = await userModel.findOne({ email })
    if (!user) {
        return
    }
    if (user.otp && user.otp.expirein > Date.now()) {
        errorRes({
            msg: "wait 5 minutes to resend otp"
        })
    }
    const otp = random(6)
    user.otp = {
        code: await createHash(otp),
        expirein: new Date(Date.now() + 5 * 60 * 1000)
    };
    await user.save()

    sendEmail({
        to: email,
        subject: "Confirm Your Email - Saraha App ",
        html: otpConfirmationTemplate({
            name: user.firstName + " " + user.lastName,
            otp
        })
    })
    return {
        data: {

        }
    }
}



export const resetPassword = async (email, otp, password) => {
    const user = await userModel.findOne({ email })
    if (!user) {
        errorRes({
            msg: "user not found ",
            statusCode: 404
        })
    }

    await checkOtp(user, otp)
    user.password = await createHash(password)
    await user.save()

    return {
        data: {}
    }
}



const checkOtp = async (user, otp) => {
    if (!user.otp || user.otp.expirein < Date.now()) {
        errorRes({
            msg: "otp expired",
            statusCode: 404
        })
    }
    if (!await compareHash(otp, user.otp.code)) {
        errorRes({
            msg: "in-valid otp",
            statusCode: 400
        })
    }
}


















