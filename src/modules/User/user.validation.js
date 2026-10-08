import z from "zod"
import { GenderEnum } from "./user.types.js"


export const signUpSchema = {
    body: z.strictObject({
        fullname: z.string(),
        email: z.email(),
        phone: z.string(),
        password: z.string().min(8),
        age: z.number().min(18).optional(),
        gender: z.enum(GenderEnum),
        userName: z.string(),
        bio: z.string().optional()
    })
}


export const loginSchema = {
    body: z.strictObject({
        identifier: z.string(),
        password: z.string().min(8),
    })
}