import multer from "multer"; // multer docs on github

const storage = multer.diskStorage({
  destination: function (req, file, cb) {  // cb -> callback
    cb(null, "./public/temp")   // folder in which files will get stored temporarily
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

export const upload = multer({ 
    storage,
})