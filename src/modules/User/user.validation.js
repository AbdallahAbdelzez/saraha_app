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
        bio: z.string().optional(),
        confirmPassword: z.string()
    }).refine((arg) => arg.password == arg.confirmPassword, {
        error: "password missMatch",
        path: ["password", "confirmPassword"]
    })
}


export const loginSchema = {
    body: z.strictObject({
        identifier: z.string(),
        password: z.string().min(8),
    })
}


export const resetPassSchema = {
    body: z.strictObject({
        password: z.string().min(8),
        confirmPassword: z.string().min(8),
        otp: z.string().min(6).max(6)
    }).refine((arg) => arg.password == arg.confirmPassword, {
        error: "password missMatch",
        path: ["password", "confirmPassword"]
    })
} 