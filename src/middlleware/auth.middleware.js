import jwt from "jsonwebtoken"
import { userModel } from "../DB/models/user.model.js"
import { errorRes } from "../utls/error.res.js"
import { redisClient } from "../DB/redis.connect.js"
import { userSessionJwtIdKey } from "../utls/redis-services.js"



export const tokenEnum = {
    access: "access",
    refresh: "refresh"
}


export const auth = async (req, res, next) => {
    const { user,jti } = await decodeToken({ authorization: req.headers.authorization })
    // console.log(user)
    req.user = user
    req.jti = jti

    next()
}


export const decodeToken = async ({ authorization, tokenType = tokenEnum.access }) => {
    if (!authorization || !authorization.startsWith("Bearer")) {
        errorRes({
            msg: "in_valid token",
            statusCode: 401
        })
    }
    const token = authorization.split(" ")[1]

    const payload = jwt.verify(token,
        tokenType == tokenEnum.access ?
            process.env.ACCESS_TOKEN_SECRET :
            process.env.REFRESH_TOKEN_SECRET
    )

    const user = await userModel.findById(payload._id)
    if (!user) {
        errorRes({
            msg: "user not found",
            statusCode: 404
        })
    }
    if (!user.confirmedAt) {
        errorRes({
            msg: "confirm first",
            statusCode: 401
        })
    }
    const { jti } = payload
    if (!jti) {
        errorRes({
            msg: "in-valid token", statusCode: 400
        })
    }
    const redisJti = await redisClient.get(userSessionJwtIdKey(user._id, jti))
    if (!redisJti) {
        errorRes({
            msg: "logged out login agin",
            statusCode: 400
        })
    }
    return {
        user,
        jti
    }
}


export const authorization = (...roules) => {
    return (req, res, next) => {
        if (!roules.includes(req.user.role)) {
            errorRes({
                msg: "un Authorized",
                statusCode: 401
            })
        }
        next()
    }
}