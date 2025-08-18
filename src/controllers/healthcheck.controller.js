import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler } from "../utils/asyncHandler.js"

const healthCheck = asyncHandler(async(req, res) => {
    // This controller simply returns a 200 OK status to indicate
    // that the server is up and responding to requests.
    return res
        .status(200)
        .json(new ApiResponse(200, {status : "OK", timestamp : Date.now()}, "Server is healthy and running"))
})

export {healthCheck}