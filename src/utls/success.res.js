export const successRes = ({ res, status = 200, msg = "DONE", data = {} }) => {
    return res.status(status).json({
        msg,
        data,
        status,
        timstamp: new Date().toISOString()
    })
}