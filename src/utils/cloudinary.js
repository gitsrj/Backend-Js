import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

// we are first uploading the file through multer on localStorage and then from that to Cloudinary.
// then removing/clearing the file from localStorage as well.

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })

        //file has been uploaded successfully
        // console.log("File is uploaded on cloudinary", 
        //     response.url
        // );

        // Cloudinary response
        // console.log("Cloudnary Response : ",response)

        fs.unlinkSync(localFilePath) // if file gets successfully uploaded on cloudinary then it gets removed from the localStorage
        return response;
        
    } catch (error) {
        // we have the file uploaded on localStorage that's why this function has been called, so if there is any issue then we need to 
        // remove that malicious file from our storage.
        fs.unlinkSync() // remove the locally saved temporary file as the upload operation got failed.
        return null
    }
}

export {uploadOnCloudinary}

    
