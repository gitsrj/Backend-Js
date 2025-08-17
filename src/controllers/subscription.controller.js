import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // current logged in user has to be the subscriber
  const subscriberId = req.user?._id;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }

  // check whether subscription exists or not and toggle accordingly

  const existingSubscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  if (existingSubscription) {
    await Subscription.findByIdAndDelete(existingSubscription._id);
    return res
      .status(200)
      .json(
        new ApiResponse(200, { subscribed: false }, "Unsubscribed successfull")
      );
  } else {
    const newSubscription = await Subscription.create({
      subscriber: subscriberId,
      channel: channelId,
    });

    if (!newSubscription) {
      throw new ApiError(500, "Error subscribing to the channel");
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, { subscribed: true }, "Subscribed successfully")
      );
  }
});

// controller to return the subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Provide a valid channelId");
  }

  const subscribers = await Subscription.aggregate([
    {
      // find all the subscriptions for the given channel
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      // getting all the details of the subscribers from the User collection
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
      },
    },
    {
      // unwind (destructure) the subscriberDetails array
      $unwind: "$subscriberDetails",
    },
    {
      // project only the necessary details
      $project: {
        _id: "$subscriberDetails._id",
        username: "$subscriberDetails.username",
        fullName: "$subscriberDetails.fullName",
        avatar: "$subscriberDetails.avatar",
      },
    },
  ]);

  if(!subscribers){
    throw new ApiError(404, "No subscribers found for this channel")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "Subscriber list fetched successfully"))

});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async(req, res) => {
    const {subscriberId} = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid subscriberId")
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $project: {
                _id: "$channelDetails._id",
                username: "$channelDetails.username",
                fullName: "$channelDetails.fullName",
                avatar: "$channelDetails.avatar"
            }
        }
    ]);

    if(!subscribedChannels){
        throw new ApiError(404, "User has not subscribed to any channel")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully"))
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
