import { asyncHandler } from "../utils/asyncHandler.js";  // because of this we don't need to put everything in async await or try catch (higher order function)


const registerUser = asyncHandler( async (req, res) => {
    res.status(200).json({
        message: "ok"
    })
} )


export {
    registerUser
}