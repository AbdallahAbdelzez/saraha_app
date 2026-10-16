import { Router } from "express"
import { auth, authorization } from "../../middlleware/auth.middleware.js"
import { validation } from "../../middlleware/validation.middleware.js"
import { deCryption } from "../../utls/scurity/encryption.js"
import { successRes } from "../../utls/success.res.js"
import { confirmEmail, forgetPassSendOtp, googleLogin, loginServices, refreshToken, resetPassword, signupServices } from "./user.services.js"
import { RoleEnum } from "./user.types.js"
import { loginSchema, resetPassSchema, signUpSchema } from "./user.validation.js"
import multer from "multer"
import { uploadeFile } from "../../utls/multer.js"

const router = Router()

export const routes = {
    base: "/users",
    signup: "/signup", //POST
    login: "/login", //POST
    me: "/me",  //GET
    refreshToken: "/refersh-token", //POST
    googleSignup: "/signup/gmail", //POST
    confirmEmail: "/confirm-email", //PATCH
    forgetPass: "/forget-password", //PATCH
    resetPass: "/reset-password",//PATCH
    uploadeFile: "/uploade-file", //GET

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

router.post(routes.googleSignup, async (req, res) => {
    const { data, statusCode } = await googleLogin(req.body.idToken)
    successRes({ res, data, status: statusCode })
})

router.patch(routes.confirmEmail, async (req, res) => {
    const { email, otp } = req.body
    const { data } = await confirmEmail(email, otp)
    successRes({ res, data, statusCode: 200 })
})

router.patch(routes.forgetPass, async (req, res) => {
    const { email } = req.body

    const { data } = await forgetPassSendOtp(email)

    successRes({
        res,
        msg: "otp sent to email if exist"
    })
})
router.patch(routes.resetPass, validation(resetPassSchema), async (req, res) => {
    const { email, otp, password } = req.body

    const { data } = await resetPassword(email, otp, password)


    successRes({
        res
    })
})

router.get(routes.uploadeFile, auth, uploadeFile("users").single("image"), async (req, res) => {
    console.log(req.body)
    console.log(req.file)
    const user = req.user
    user.profileImage = req.file.path
    await user.save()


    successRes({
        res
    })
})
export default router




