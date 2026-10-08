import crypto from "node:crypto"
import { errorRes } from "../error.res.js"



const secretKey = Buffer.from(process.env.ENCRYPTION_SECRET_KEY)

export const encryption = (data) => {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv("aes-256-cbc", secretKey, iv)
    let cipherText = cipher.update(data, "utf8", "hex")
    cipherText += cipher.final("hex")
    
    return `${iv.toString("hex")}:${cipherText}`
}


export const deCryption = (encryptionedValue)=>{
    const [iv,cipherText] = encryptionedValue.split(":")
    if(!iv||!cipherText){
        errorRes({
            msg:"in_valid encryted value"
        })
    }
    const binaryIv = Buffer.from(iv,"hex")
    const decipher = crypto.createDecipheriv("aes-256-cbc",secretKey,binaryIv)
    let plainText = decipher.update(cipherText,"hex","utf8")
    plainText += decipher.final("utf8")
    return plainText
}