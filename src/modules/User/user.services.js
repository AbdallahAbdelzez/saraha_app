import { userModel } from "../../DB/models/user.model.js";
import { errorRes } from "../../utls/error.res.js";
import jwt from "jsonwebtoken";
import { decodeToken, tokenEnum } from "../../middlleware/auth.middleware.js"
import { compareHash, createHash } from "../../utls/scurity/hash.js";
import { encryption } from "../../utls/scurity/encryption.js";


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

    const user = await userModel.create({
        fullname, email, password: await createHash(password), gender, phone: encryption(phone), bio, age, userName
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

    const isPasswordMatch = await compareHash(password , user.password)

    
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

