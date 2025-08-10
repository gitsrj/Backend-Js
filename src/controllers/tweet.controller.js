import mongoose, {isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.models.js";
import {User} from "../models/user.models.js"

const createTweet = asyncHandler(async(req, res) => {
    // Create a new tweet
    const { content } = req.body;
    if (!content) {
        throw new ApiError(400, "Content is required");
    }
    const tweet = new Tweet({
        content: content,
        owner: req.user._id
    });
    await tweet.save();
    return res
        .status(201)
        .json(new ApiResponse(201, tweet, "Tweet created successfully"));
})

const getUserTweets = asyncHandler(async(req, res) => {
    // Get all tweets by a user
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Provide a valid UserId");
    }

    // Find all tweets by this user, and instead of just showing the user’s ID, include their username too.
    const tweets = await Tweet.find({ owner: userId }).populate("owner", "username");

    if (!tweets || tweets.length === 0) {
        throw new ApiError(404, "No tweets found for this user");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "User tweets retrieved successfully"));

})

const updateTweet = asyncHandler(async(req, res) => {
    // Update a tweet
    const { tweetId } = req.params;
    const { content } = req.body;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Provide a valid TweetId");
    }
    if (!content) {
        throw new ApiError(400, "Content is required");
    }
    const tweet = await Tweet.findByIdAndUpdate(tweetId, { content }, { new: true }); // returns the new updated document
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
})

const deleteTweet = asyncHandler(async(req, res) => {
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Provide a valid TweetId")
    }

    await Tweet.findByIdAndDelete(tweetId)
        .then(() => {
            return res.status(200).json(new ApiResponse(200, null, "Tweet deleted successfully"))
        })
        .catch((err) => {
            throw new ApiError(500, "Error deleting video" + err.message)
        })
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
