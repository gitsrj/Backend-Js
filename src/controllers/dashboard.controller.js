import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }

  const [totalVideos, totalSubscribers, videoStats, totalLikes] =
    await Promise.all([
      // using Promise.all to run all database queres in parallel, if anyone rejects then it throws error directly
      // total number of videos
      Video.countDocuments({ owner: userId }),

      // total number of subscribers
      Subscription.countDocuments({ channel: userId }),

      // using aggregation to get total views
      Video.aggregate([
        {
          $match: {
            owner: new mongoose.Types.ObjectId(userId), // finding all the documents in Video where owner is user.
          },
        },
        {
          $group: {
            _id: null,
            totalViews: { $sum: "$views" }, // summing up all the views of the obtained documents
          },
        },
      ]),

      // using aggregation to get total likes on all videos
      Video.aggregate([
        {
          $match: {
            owner: new mongoose.Types.ObjectId(userId), // first finding all the videos of the owner
          },
        },
        {
          $lookup: {
            // then with obtained videos looking into their corresponding Likes where the video is our obtained videos (videoId)
            from: "likes",
            localField: "_id",
            foreignField: "video",
            as: "likes",
          },
        },
        {
          $project: {
            likesCount: { $size: "$likes" }, // number of likes for a video
          },
        },
        {
          $group: {
            _id: null,
            totalLikes: { $sum: "$likesCount" }, // total number of likes for all the videos
          },
        },
      ]),
    ]);

  // constructing the final stats object
  const stats = {
    totalVideos,
    totalSubscribers,
    // aggregation returns an array so safely accessing the first element
    totalViews: videoStats[0]?.totalViews || 0,
    totalLikes: totalLikes[0]?.totalLikes || 0,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
});

// getting all the videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "User Id is invalid");
  }

  const videos = await Video.find({ owner: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  if(!videos || videos.length === 0){
    return res
        .status(200)
        .json(new ApiResponse(200, [], "You have not uploaded any videos yet"))
  };

  return res    
    .status(200)
    .json(new ApiResponse(200, videos, "Videos for your channel fetched successfully"))

});

export { getChannelStats, getChannelVideos };
