// require('dotenv').config({path: './env'})
import dotenv from 'dotenv'
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})


connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("ERROR : ", error)
        throw error
    })

    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at ${process.env.PORT}` )
    })
})
.catch((err) => {
    console.log("MONGODB connection failed !!", err)
})




// db connection can go wrong so, use try catch and db is in another continent thus it takes time, so use async await.
/*
import express from 'express'
const app = express()

( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERROR: ", error)
            throw error
        })

        app.listen(process.env.PORT, ()=> {
            console.log(`App is listening on port ${process.env.PORT}`)
        })

    } catch (error) {
        console.error("ERROR: ", error)
        throw error
    }
})()

*/