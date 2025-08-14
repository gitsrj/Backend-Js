import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if(!videoId || !isValidObjectId(videoId)){
    throw new ApiError(400, "Provide a valid videoId")
  }

  const skip = (parseInt(page) - 1) * (parseInt(limit))

  const videoComments = await Comment.find({video: videoId})
    .sort({createdAt : -1})
    .skip(skip)
    .limit(parseInt(limit))
    .populate("owner", "username avatar")

    if(!videoComments || videoComments.length === 0){
        throw new ApiError(404, "No Comments found for this video")
    }

    return res
        .status(200)
        .json( new ApiResponse(200, videoComments, "Comments retrieved successfully"))
});

const addComment = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    const {content} = req.body

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "Provide a valid videoId")
    }

    if(!content || content.trim().length === 0){
        throw new ApiError(400, "Comment content cannot be empty")
    }

    const comment = await Comment.create({
        content: content,
        video: videoId,
        owner: req.user._id
    })

    if(!comment){
        throw new ApiError(500, "Error adding comment")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"))
})

const updateComment = asyncHandler(async(req, res) => {
    const {commentId} = req.params
    const {content} = req.body

    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(400, "Provide a valid commentId")
    }

    if(!content || content.trim().length === 0){
        throw new ApiError(400, "Content cannot be empty")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to update this comment")
    }

    comment.content = content
    const updatedComment = await comment.save()

    if(!updateComment){
        throw new ApiError(500, "Failed to update the comment")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async(req, res) => {
    const {commentId} = req.params

    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(400, "Provide a valid commentId")
    }

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this comment")
    }

    const deletedComment = await comment.delete()

    return res
        .status(200)
        .json(new ApiResponse(200, deletedComment, "Comment deleted successfully"))
})

export {getVideoComments, addComment, updateComment, deleteComment}