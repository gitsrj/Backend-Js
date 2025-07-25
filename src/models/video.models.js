import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";  // for writing aggregation queries


const videoSchema = new Schema(
    {
        videoFile:{
            type: String,  // clouinary url
            required: true,
        },
        thumbnail: {
            type: String,  // clouinary url
            required: true, 
        },
        title: {
            type: String,  
            required: true, 
        },
        descripton: {
            type: String,  
            required: true, 
        },
        duration: {
            type: Number,  // given by cloudinary
            required: true, 
        },
        views:{
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    }, 
    {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)