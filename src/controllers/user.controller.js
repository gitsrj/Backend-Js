import { asyncHandler } from "../utils/asyncHandler.js";  // because of this we don't need to put everything in async await or try catch (higher order function)
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


// whenever we get the user instance from the db, we get all its model, methods, everything.
// basically 'user' is the object so along with it we get all of its properties.
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken() // given to the user
        const refreshToken = user.generateRefreshToken() // stored in the db, so no need to login again nd again until expired.

        user.refreshToken = refreshToken // adding refToken in the user object 
        await user.save({ validateBeforeSave: false }) // saving in the db, but it may recheck for all the fields (majorly pswd) , so - false

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens")
    }
}



const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty and other
    // check if user already exists (can be checked by username, email)
    // check for images, check for avatar
    // upload them to cloudinary, (check avatar is uploaded or not)
    // create user object - create entry in db (when an entry is created in mongodb, it comes back as a response )
    // remove password and refesh token field from response
    // check for user creation (null user is created or an actual one)
    // return response


    const { fullName, email, username, password } = req.body
    // console.log("Req.body : ", req.body);


    // if(fullName === ""){
    //     throw new ApiError(400, "fullname is required")
    // }
    if (
        [fullName, email, username, password].some((field) =>  field?.trim() === "")
    ) {
        throw new ApiError(400, "All Fields are required")
    }

    
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // req.files is given by multer, then middleware "uploads" avatar, out of its multiple properties we take the first i.e. 0th index in its array
    const avatarLocalPath = req.files?.avatar[0]?.path  // '?' means checking if they exist or not.
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    // console.log("Req.files : ",req.files)

    let coverImageLocalPath;
    
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
    
    const user = await User.create({
        fullName,
        avatar: avatar.url, 
        coverImage: coverImage?.url || "",  // we haven't checked whether user has given us the coverImage or not that's why we are checking it here.
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(  // by default every field is selected so we write "-xyz" to deselect it.
        "-password -refreshToken"  // this will not be visible in postman (after creation)
    )

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the User")
    }

            // postman expects the status is received through res.status
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")  // created a obj of ApiResponse class
    )


} )

const loginUser = asyncHandler( async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie


    const {email, username, password} = req.body

    if(!username && !email) {
        throw new ApiError(400, "Username or email is required")
    }

    // An alternative 
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    // instance of the user from db
    const user = await User.findOne({
        $or: [{email}, {username}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    // method present in the user model
    const isPasswordValid = await user.isPasswordCorrect(password) // 'password' from req.body comparing with the pswd of the user (the instance in the db)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    // optional step - now getting the user who has token in its object
    const loggedInUser = await User.findOne(user._id).select(
        "-password -refreshToken"
    )

    // now we want to send cookies and for that we need to design some options(nothing but an obj)
    const options = {
        httpOnly : true,  // by default it is false, that means anyone can modify cookies (frontend)
        secure : true  // but now cookies can be modified by the server only.
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

} )

const logoutUser = asyncHandler( async (req, res) => {
    // verifyJWT middleware is called before logutUser, and in that we have req.user, so now we can get the user and delete it refToken
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true // it returns the updated doc
        }
    )

    const options = {
        httpOnly : true,  // by default it is false, that means anyone can modify cookies (frontend)
        secure : true  // but now cookies can be modified by the server only.
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id) // new token generated and set in cookies as well
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    // we have added user in req.user in auth middleware
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave }) // will not run any validation for saving it

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

const updateAccountDetails = asyncHandler ( async (req, res) =>{
    const { fullName, email } = req.body

    if(!fullName || !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,   // can be set by any of these two methods
                email: email  
            }
        },
        {new : true}  // updated info gets returned

    ).select("-password")  // it will return all the fields except the password

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details updated successfully"))

})

const updateUserAvatar = asyncHandler( async (req, res) => {
    // taking req.file and direct path because here in multer we are only concerned with a single entity,
    // in registerUser we accepted an array through the upload in the router thus we used req.files over there
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler( async (req, res) => {
    // taking req.file and direct path because here in multer we are only concerned with a single entity,
    // in registerUser we accepted an array through the upload in the router thus we used req.files over there
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url){
        throw new ApiError(400, "Error while uploading on Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated successfully"))
})


const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([  // values that are returned after aggregation are Arrays
        // first pipeline
        { 
            // match field -> how do i match
            $match: { 
                username: username?.toLowerCase()  // safety measure
            }
        },
        // second pipeline
        {
            $lookup: {
                from: "subscriptions",  // lookup from this model, (lowercase and plural),
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",  
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount: {
                    $size: "$subscribers" // gives the count of subscribers from the subscribers field
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"       
                },
                isSubscribed : {
                    $cond: {       // check with this id of the user in subscriber (field of subscribers obj) whether present or not
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {   // passes on the selected value instead of passing the complete object
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    // user ki watchHistory me se videos ka data liya and then uss me se owner mile so a sub lookup to get back to the user  
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)  // in aggregation it goes directly to mongodb else mongoose handles and parses the id which initially comes as the string.
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project:{
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    { // for sending the first element of the array
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}