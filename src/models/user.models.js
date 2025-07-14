import mongoose, {Schema} from "mongoose";
import jwt from 'jsonwebtoken'  // jwt is a bearer token (like a key)
import bcrypt from 'bcrypt'

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true, // for searching frequently in this field
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar: {
        type: String,  // Cloudinary url
        required: true, 
    },
    coverImage: {
        type: String,  // cloudinary url
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Video",
    }],
    password: {
        type: String,
        required: [true, 'Password is required'],  // custom error message, can be given in any 'required' field.
    },
    refreshToken: {
        type: String,
    },

}, {timestamps: true})


userSchema.pre("save", async function (next){  // not used arrow function because arro function does not have 'this' reference (here userSchema's reference is needed)
    if( !this.isModified("password") ) return next()  // modify password only if password is changed while saving and not anything else.

    this.password = await bcrypt.hash(this.password, 10)
    next()
}) 

// user defined (middleware) methods injecting in the Schema.
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

// both are jwt tokens, the difference lies in their usage
userSchema.methods.generateAccessToken = function(){

    return jwt.sign(  // creates a jwt token
        // payload having their payload keys and the values are from database.
        { 
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){

    return jwt.sign(  // creates a jwt token
        // payload having their payload keys and the values are from database.
        { 
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)