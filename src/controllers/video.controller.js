import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  let {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  // Build filter
  const filter = { isPublished: true };
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { descripton: { $regex: query, $options: "i" } },
    ];
  }
  if (userId && mongoose.isValidObjectId(userId)) {
    filter.owner = userId;
  }

  // Build sort
  const sort = {};
  sort[sortBy] = sortType === "asc" ? 1 : -1;

  // Pagination
  const skip = (page - 1) * limit;

  // Fetch videos and total count
  const [videos, total] = await Promise.all([
    Video.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({ path: "owner", select: "username fullName avatar" }),
    Video.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      videos,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
    })
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // get video, upload to cloudinary, create video
  const videoLocalPath = req.file?.path;
  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is missing");
  }
  const video = await uploadOnCloudinary(videoLocalPath);
  if (!video.url) {
    throw new ApiError(400, "Error while uploading on cloudinary");
  }
  const newVideo = await Video.create({
    title,
    description,
    video: video.url,
    owner: req.user._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, newVideo, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not Found");
  }
  if (!video.isPublished) {
    throw new ApiError(403, "Video is not published");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  //Update video details like title, description, thumbnail

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // update video details
  const { title, description, thumbnail } = req.body;
  // check what has the user provided
  if (!title && !description && !thumbnail) {
    throw new ApiError(400, "No details provided to update");
  }

  video.title = title || video.title;
  video.description = description || video.description;
  video.thumbnail = thumbnail || video.thumbnail;

  await video.save();
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    await Video.findByIdAndDelete(videoId)
      .then(() => {
        return res.status(200).json(new ApiResponse(200, null, "Video deleted successfully"));
      })
      .catch((err) => {
        throw new ApiError(500, "Error deleting video: " + err.message);
      });

})

const togglePublishStatus = asyncHandler(async(req, res) => {
    const { videoID } = req.params;

    if(!isValidObjectId(videoID)) {
        throw new ApiError(400, "Invalid video ID");
    }  

    const video = await Video.findById(videoID);
    if(!video) {
        throw new ApiError(404, "Video not found");
    }
    video.isPublished = !video.isPublished;
    await video.save();
    return res.status(200).json(new ApiResponse(200, video, "Video publish status toggled successfully"));
})


export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus };
