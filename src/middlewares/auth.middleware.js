import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // with the help of cookie we got token
        // token verified then we got user 
        // and now we can do anything with the user
        
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") // header can be sent by postman with a "Bearer <token>"
    
        if(!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )
    
        if(!user){
            
            throw new ApiError(401, "Invalid Access Token")
        }
    
        // this gives us the access of the user for further purposes like logging it out
        req.user = user;  // req me user field create kar usme user assign kiya
    
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }

})