export const errorRes = ({ msg = "Error", statusCode = 500,options }) => {
    throw new Error(msg, {
        cause: {
            statusCode: statusCode,
            options
        }
    })
}