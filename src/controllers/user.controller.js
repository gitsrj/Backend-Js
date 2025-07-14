import { asyncHandler } from "../utils/asyncHandler.js";  // because of this we don't need to put everything in async await or try catch (higher order function)
import ApiError from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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
    console.log("email: ", email);


    // if(fullName === ""){
    //     throw new ApiError(400, "fullname is required")
    // }
    if (
        [fullName, email, username, password].some((field) =>  field?.trim() === "")
    ) {
        throw new ApiError(400, "All Fields are required")
    }

    
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // req.files is given by multer, then middleware "uploads" avatar, out of its multiple properties we take the first i.e. 0th index in its array
    const avatarLocalPath = req.files?.avatar[0]?.path  // '?' means checking if they exist or not.
    const coverImageLocalPath = req.files?.coverImage[0]?.path

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
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the User")
    }

            // postman expects the status is received through res.status
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")  // created a obj of ApiResponse class
    )


} )


export {
    registerUser
}