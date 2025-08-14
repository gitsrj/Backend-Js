import {verifyJWT} from "../middlewares/auth.middleware.js"
import { Router } from "express";
import {toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos} from "../controllers/like.controller.js"

const router = Router()

router.use(verifyJWT)

router.route("/videos").get(getLikedVideos)
router.route("/toggle/v/:videoId").post(toggleVideoLike)
router.route("/toggle/c/:commentId").post(toggleCommentLike)
router.route("/toggle/t/:tweetId").post(toggleTweetLike)

export default router