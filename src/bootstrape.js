import chalk from "chalk"
import express from "express"
import { DBconection } from "./DB/DB.connection.js"
import { userModel } from "./DB/models/user.model.js"
import { successRes } from "./utls/success.res.js"

import userRouter, { routes as userRoutes } from "./modules/User/user.controller.js"




const bootstrape = async () => {
    const app = express()
    const port = + process.env.port
    app.use(express.json())
    await DBconection()

    app.get("/", async (req, res) => {
        const user = await userModel.find()
        successRes({ res, data: user })
    })

    app.use(userRoutes.base, userRouter)


    
    // await userModel.create({
    //     fullname: "abdallah muhammed",
    //     email: "abdallah@gmail.come",
    //     password: "123456",
    //     userName: "Abdallah_muhammed"
    // })



    // console.log(port)
    app.use((err, req, res, next) => {
        const statusCode = err.cause?.statusCode || 500
        res.status(statusCode).json({
            arrMsg: err.message,
            status: statusCode
        })
    })
    app.listen(port, () => {
        console.log(chalk.green(`server running on port ${port}`))
    })
}


export default bootstrape