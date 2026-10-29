import { model, Schema, Types } from "mongoose";




const messageSchema = new Schema({
    content: {
        type: String,
        required: function () {
            this.images?.lenght ? false : true
        }
    },
    images: {
        type: [String]
    },
    to: {
        type: Types.ObjectId,
        required: true,
        ref: "User"
    }
},
    {
        strict: true,
        strictQuery: true,
        optimisticConcurrency: true,
        toJSON: {
            virtuals: true,
            getters: true,
            transform(doc, ret) {
                delete ret.password
                delete ret._id
            }
        },
        toObject: {
            virtuals: true,
            getters: true
        }
    }
)


export const messageModel = model("Massage", messageSchema)
