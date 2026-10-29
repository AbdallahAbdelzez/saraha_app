import { Router } from "express";
import { uploadeFile } from "../../utls/multer.js";
import { sendMessage } from "./message.services.js";
import { successRes } from "../../utls/success.res.js";
const router = Router()

export const routes = {
    base: "/messages",
    send: "/send", //post

}

router.post(routes.send, uploadeFile('message').array('images', 5), async (req, res) => {
    const { content, to } = req.body
    const images = req.files.map(ele => ele.path)
    const { data } = await sendMessage(content, images, to)
    return successRes({
        res,
        data
        
    })
})




export default router