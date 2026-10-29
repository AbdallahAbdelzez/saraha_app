import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { userModel } from "../../DB/models/user.model.js";
import { redisClient } from "../../DB/redis.connect.js";
import { decodeToken, tokenEnum } from "../../middlleware/auth.middleware.js";
import { random } from "../../utls/email/creatOtp.js";
import { otpConfirmationTemplate } from "../../utls/email/emailTemplate.js";
import { sendEmail } from "../../utls/email/sendEmail.js";
import { errorRes } from "../../utls/error.res.js";
import { attempsBlockCountKey, attempsBlockKey, attempsKey, confirmEmailKey, resendOtpKey, userPrefixKey, userSessionJwtIdKey, userSessionJwtIdPrefixKey } from "../../utls/redis-services.js";
import { compareHash, createHash } from "../../utls/scurity/hash.js";
import { ProviderEnum } from "./user.types.js";
import { nanoid } from "nanoid";
const googlClient = new OAuth2Client()

const clacBlockSecend = (count) => {
    const block_mins_arr = [5, 15, 60, 300, 1440]
    const index = Math.min(count, block_mins_arr.length)
    return block_mins_arr[index - 1] * 60
}

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
        // otp: {
        //     code: await createHash(otp),
        //     expirein: Date.now() + 5 * 60 * 1000
        // }
    })

    const redisKey = confirmEmailKey(user._id)
    await redisClient.set(redisKey, await createHash(otp), {
        expiration: {
            type: "EX",
            value: 5 * 60
        }
    })
    await redisClient.set(resendOtpKey(user._id), 0, {
        expiration: {
            type: "EX",
            value: 60
        }
    })
    await redisClient.incr(attempsKey(user._id))
    return {
        data: user
    }
}


export const loginServices = async (identifier, password) => {
    const user = await userModel.findOne({
        $or: [
            { email: identifier },
            { userName: identifier }
        ],
        confirmedAt: { $exists: true, $ne: null }
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

    const jwtid = nanoid()
    console.log(jwtid)
    const accessToken = jwt.sign({
        _id: user._id,
        email: user.email
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "30M",
        jwtid
    })
    const refreshToken = jwt.sign({
        _id: user._id,
        email: user.email
    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7D",
        jwtid
    })


    await redisClient.set(userSessionJwtIdKey(user._id, jwtid), jwtid, {
        expiration: {
            type: "EX",
            value: 7 * 24 * 60 * 60
        }
    })
    return {
        data: {
            accessToken,
            refreshToken
        }
    }
}


export const refreshToken = async (authorization) => {
    const { user, jti } = await decodeToken({ authorization, tokenType: tokenEnum.refresh })
    const accessToken = jwt.sign({
        _id: user._id,
        email: user.email
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "30M",
        jwtid: jti
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

export const resentConfirmEmailOtp = async (email) => {
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
    const userId = user._id

    const cannotResend = (await redisClient.get(resendOtpKey(userId))
        || await redisClient.get(attempsBlockKey(userId)))

    if (cannotResend) {
        errorRes({
            msg: "wait",
            statusCode: 404
        })
    }
    const attempts = await redisClient.incr(attempsKey(user._id))
    if (attempts >= 5) {
        const blockCount = await redisClient.incr(attempsBlockCountKey(user._id))
        await redisClient.set(attempsBlockKey(user._id), 0, {
            expiration: {
                type: "EX",
                value: clacBlockSecend(blockCount)
            }
        })

        await redisClient.set(attempsKey(user._id), 0)
    } else {
        await redisClient.set(resendOtpKey(user._id), 0, {
            expiration: {
                type: "EX",
                value: 60
            }
        })
    }
    const otp = random(6)
    sendEmail({
        to: email,
        subject: "Confirm Your Email - Saraha App ",
        html: otpConfirmationTemplate({
            name: user.firstName,
            otp
        })
    })
    const redisKey = confirmEmailKey(user._id)
    await redisClient.set(redisKey, await createHash(otp), {
        expiration: {
            type: "EX",
            value: 5 * 60
        }
    })
    return {
        data: {

        }
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
    // if (!user.otp || user.otp.expirein < Date.now()) {
    //     errorRes({
    //         msg: "otp expired",
    //         statusCode: 404
    //     })
    // }
    // if (!await compareHash(otp, user.otp.code)) {
    //     errorRes({
    //         msg: "in-valid otp",
    //         statusCode: 400
    //     })
    // }
    const hashedOtp = await redisClient.get(confirmEmailKey(user._id))
    if (!hashedOtp) {
        errorRes({
            msg: "invalid or expired otp",
            statusCode: 400
        })
    }

    const isBlocked = await redisClient.get(attempsBlockKey(user._id))
    if (isBlocked) {
        const blockedTtl = await redisClient.ttl(attempsBlockKey(user._id))
        errorRes({
            msg: `try again after ${Math.round(Math.ceil(blockedTtl / 60))} M`,
            statusCode: 400
        })
    }
    const isOtpCorrect = await compareHash(otp, hashedOtp)
    if (!isOtpCorrect) {
        const attempts = await redisClient.incr(attempsKey(user._id))
        if (attempts >= 5) {
            const blockCount = await redisClient.incr(attempsBlockCountKey(user._id))
            await redisClient.set(attempsBlockKey(user._id), 0, {
                expiration: {
                    type: "EX",
                    value: clacBlockSecend(blockCount)
                }
            })
            await redisClient.set(attempsKey(user._id), 0)
            errorRes({
                msg: `try again after ${Math.round(clacBlockSecend(blockCount) / 60)} M`,
                statusCode: 400
            })
        }
        errorRes({
            msg: `Invalid OTP. ${5 - attempts} attempts remaining`,
            statusCode: 400
        });
    } else {
        const userKeys = await redisClient.keys(`${userPrefixKey(user._id)}*`)
        await redisClient.del(userKeys)
    }

}


export const logout = async (userId, jti) => {
    const user = await userModel.findById(userId)
    if (!user) {
        errorRes({
            msg: "user not found ",
            statusCode: 404
        })
    }
    const deleteCount = await redisClient.del(userSessionJwtIdKey(userId, jti))
    if (deleteCount < 1) {
        errorRes({
            msg: "already logged out"
        })
    }
    return {
        data: {

        }
    }
}
export const logoutFroumAllDevices = async (userId) => {
    const user = await userModel.findById(userId)
    if (!user) {
        errorRes({
            msg: "user not found ",
            statusCode: 404
        })
    }
    const sessionKey = await redisClient.keys(userSessionJwtIdPrefixKey(userId) + "*")
    const deleteCount = await redisClient.del(sessionKey)
    if (deleteCount < 1) {
        errorRes({
            msg: "already logged out"
        })
    }
    return {
        data: {

        }
    }
}


















