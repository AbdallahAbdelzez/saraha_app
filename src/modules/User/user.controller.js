import { Router } from "express"
import { auth, authorization } from "../../middlleware/auth.middleware.js"
import { validation } from "../../middlleware/validation.middleware.js"
import { deCryption } from "../../utls/scurity/encryption.js"
import { successRes } from "../../utls/success.res.js"
import { loginServices, refreshToken, signupServices } from "./user.services.js"
import { RoleEnum } from "./user.types.js"
import { loginSchema, signUpSchema } from "./user.validation.js"

const router = Router()

export const routes = {
    base: "/users",
    signup: "/signup", //POST
    login: "/login", //POST
    me: "/me",  //GET
    refreshToken: "/refersh-token"//POST
}

router.post(routes.signup, validation(signUpSchema), async (req, res) => {

    const { data } = await signupServices(req.body)
    return successRes({
        res,
        status: 201,
        msg: "Created"
    })
})

router.post(routes.login, validation(loginSchema), async (req, res) => {
    const { identifier, password } = req.body
    const { data } = await loginServices(identifier, password)

    return successRes({
        res,
        data: data
    })
})

router.get(routes.me, auth, authorization(RoleEnum.user), async (req, res) => {


    const user = req.user
    user.phone = deCryption(user.phone)
    successRes({ res, data: user })
})

router.post(routes.refreshToken, async (req, res) => {
    const authorization = req.headers.authorization
    const { data } = await refreshToken(authorization)
    return successRes({
        res,
        data
    })
})
export default router


