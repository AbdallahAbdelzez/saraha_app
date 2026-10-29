import { messageModel } from "../../DB/models/message.model.js"
import { userModel } from "../../DB/models/user.model.js"
import { errorRes } from "../../utls/error.res.js"




export const sendMessage = async (content, ImageTrackList, to) => {
    const user = await userModel.findById(to)
    if (!user) {
        errorRes({
            msg: "user not found",
            statusCode: 404
        })
    }

    const message = await messageModel.create({
        content,
        images,
        to
    })

    return {
        data: {
            message
        }
    }
} 