

export const userPrefixKey = (userId) => `users:${userId}:otp`

export const confirmEmailKey = (userId) => `${userPrefixKey(userId)}:confirmEmail`

export const resendOtpKey = (userId) => `${userPrefixKey(userId)}:resend`


export const attempsKey = (userId) => `${userPrefixKey(userId)}:attempts`
export const attempsBlockKey = (userId) => `${userPrefixKey(userId)}:blok`
export const attempsBlockCountKey = (userId) => `${userPrefixKey(userId)}:blockCount`






export const userSessionJwtIdPrefixKey = (userId) => `users:${userId}:session`

export const userSessionJwtIdKey = (userId, jwtid) => `${userSessionJwtIdPrefixKey(userId)}:${jwtid}`