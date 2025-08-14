import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleVideoLike = asyncHandler(async (req, res)=> {
    const {videoId} = req.params
    // toggle like on video
    if (!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const existingLike = await Like.findOne({ video : videoId, likedBy: req.user._id})

    if(existingLike){
        await Like.deleteOne({_id: existingLike._id})
        return new ApiResponse(200, null, "Like removed successfully").send(res)
    }

    const newLike = await Like.create({
        video: videoId,
        likedBy: req.user._id
    })

    return new ApiResponse(201, newLike, "Like for video added successfully").send(res)
})

const toggleCommentLike = asyncHandler(async(req, res) => {
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Provide Valid Comment ID")
    }

    const existingCommentLike = await Like.findOne({ comment: commentId, likedBy: req.user._id})

    if(existingCommentLike){
        await Like.deleteOne({_id: existingCommentLike._id})
        return new ApiResponse(200, null, "Like removed successfully").send(res)
    }

    const newCommentLike = await Like.create({
        comment: commentId,
        likedBy: req.user._id
    })

    return new ApiResponse(201, newCommentLike, "Like for comment added successfully").send(res)
})

const toggleTweetLike = asyncHandler(async(req, res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId))
    {
        throw new ApiError(400, "Provide a valid TweetId")
    }

    const existingTweetLike = await Like.findOne({tweet: tweetId, likedBy: req.user._id})

    if(existingTweetLike){
        await Like.deleteOne({_id: existingTweetLike._id})
        return new ApiResponse(200, null, "Like removed from Tweet").send(res)
    }

    const tweetLike = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    })

    return new ApiResponse(201, tweetLike, "Like added on Tweet").send(res)
})

const getLikedVideos = asyncHandler(async(req, res) => {
    const likedVideos = await Like.find({ likedBy: req.user._id, video: {$exists: true, $ne: null} })
        .populate("video")

    if(!likedVideos || likedVideos.length === 0){
        throw new ApiError(404, "Videos not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, likedVideos, "Like videos retrieved successfully")
        )
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}