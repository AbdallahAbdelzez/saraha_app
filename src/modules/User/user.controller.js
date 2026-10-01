import { Router } from "express"
import { loginServices, refreshToken, signupServices } from "./User.services.js"
import { successRes } from "../../utls/success.res.js"
import { auth } from "../../middlleware/auth.middleware.js"

const router = Router()

export const routes = {
    base: "/users",
    signup: "/signup", //POST
    login: "/login", //POST
    me: "/me",  //GET
    refreshToken: "/refersh-token"//POST
}

router.post(routes.signup, async (req, res) => {
    const { data } = await signupServices(req.body)
    return successRes({
        res,
        status: 201,
        msg: "Created"
    })
})

router.post(routes.login, async (req, res) => {
    const { identifier, password } = req.body
    const { data } = await loginServices(identifier, password)

    return successRes({
        res,
        data: data
    })
})

router.get(routes.me, auth, async (req, res) => {

    
    const user = req.user
    console.log(user)
    successRes({ res, data: user })
})

router.post(routes.refreshToken, async (req, res) => {
    const authorization = req.headers.authorization
    const {data} = await refreshToken(authorization)
    return successRes({
        res,
        data
    })
})
export default router


