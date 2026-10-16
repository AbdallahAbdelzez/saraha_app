import chalk from "chalk"
import express from "express"
import { DBconection } from "./DB/DB.connection.js"
import { userModel } from "./DB/models/user.model.js"
import { successRes } from "./utls/success.res.js"
import cors from "cors";
import userRouter, { routes as userRoutes } from "./modules/User/user.controller.js"
import { sendEmail } from "./utls/email/sendEmail.js"
import { otpConfirmationTemplate } from "./utls/email/emailTemplate.js"





const bootstrape = async () => {
    const app = express()
    const port = + process.env.port

    app.use(cors({
        origin: '*'
    }))
    app.use(express.json())
    app.use("/uploads",express.static("./uploads"))
    await DBconection()

    app.get("/", async (req, res) => {
        const user = await userModel.find()
        successRes({ res, data: user })
    })


    app.use(userRoutes.base, userRouter)



    app.use((err, req, res, next) => {
        console.log(err)
        const statusCode = err.cause?.statusCode || 500
        res.status(statusCode).json({
            arrMsg: err.message,
            status: statusCode,
            errOptions: err.cause?.options
        })
    })
    app.listen(port, () => {
        console.log(chalk.green(`server running on port ${port}`))
    })
}


export default bootstrape