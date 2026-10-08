import { errorRes } from "../utls/error.res.js"



export const validation = (schema) => {
    return (req, res, next) => {

        const validationErrors = []
        Object.keys(schema).map(ele => {
            const validationRes = schema[ele].safeParse(req[ele])
            if (!validationRes.success) {

                validationErrors.push({
                    [ele]: validationRes.error.issues
                })
            }
        })
        if (validationErrors.length) {
            errorRes({
                msg: "validation error",
                statusCode: 400,
                options: validationErrors
            })
        }
        next()
    }

}