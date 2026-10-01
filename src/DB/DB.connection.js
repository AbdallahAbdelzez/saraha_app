import chalk from "chalk"
import mongoose from "mongoose"




export const DBconection = async ()=>{
    try{
        await mongoose.connect(process.env.DB_URL,{
            serverSelectionTimeoutMS:500
        })
        console.log(chalk.green("DB conected successuflly"))
    }catch (error){
        console.log(chalk.red("DB connection failed",error))
    }
}