# PlayTube - A Backend for a Video Streaming Platform 

PlayTube is a robust and feature-rich backend service for a complete video-sharing platform, inspired by YouTube. This project demonstrates a deep understanding of modern backend development practices, including secure authentication, complex data modeling, and high-performance data retrieval.

It's built with a scalable architecture using Node.js and Express.js, with MongoDB for flexible data storage. This project serves as a comprehensive example of a production-ready backend system.

- [Model Links](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj?origin=share)

---

## ✨ Key Features

-   **JWT Authentication**: Secure user registration and login with an access/refresh token strategy.
-   **Comprehensive User Profiles**: Full CRUD operations for user profiles, including avatar and cover image uploads.
-   **Video Management**: Endpoints for uploading, updating, deleting, and retrieving video content.
-   **Subscription System**: Functionality for users to subscribe to and unsubscribe from channels.
-   **Social Interactions**:
    -   **Like System**: Ability to like/unlike videos, comments, and tweets.
    -   **Commenting**: Full-featured commenting system on videos.
-   **Playlist Management**: Users can create, update, and manage their own video playlists.
-   **Dashboard**: A dedicated dashboard for creators to view their channel statistics, including total subscribers, video views, likes, and a list of their uploaded videos.
-   **API Health Check**: A simple health check endpoint to monitor the server's status.

---

## 🛠️ Tech Stack & Tools

-   **Backend**: Node.js, Express.js
-   **Database**: MongoDB
-   **Database Modeling**: Mongoose
-   **Authentication**: JSON Web Tokens (JWT), bcrypt
-   **File Handling**: Cloudinary (for cloud-based media storage), Multer
-   **API Utilities**: `asyncHandler` for error handling, `ApiError` & `ApiResponse` for standardized responses.

---

## 📁 Project Structure

The project follows a modular, feature-based architecture to keep the codebase clean and scalable.

```
src/
├── controllers/    # Request/Response logic
├── db/             # Database connection setup
├── middlewares/    # Express middlewares (auth, multer)
├── models/         # Mongoose data models
├── routes/         # API routes
├── utils/          # Utility functions (ApiError, ApiResponse, etc.)
├── app.js          # Express app configuration
├── constants.js    # Project constants
└── index.js        # Server entry point
```

---

## 🔑 Environment Variables

To run this project, you will need to create a `.env` file in the root directory and add the following environment variables:

```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=*

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

## 🚀 Getting Started

Follow these steps to get the project up and running on your local machine.

1.  **Clone the repository**
    ```sh
    git clone [https://github.com/gitsrj/PlayTube.git](https://github.com/gitsrj/PlayTube.git)
    cd PlayTube
    ```

2.  **Install dependencies**
    ```sh
    npm install
    ```

3.  **Set up environment variables**
    -   Create a `.env` file in the root directory.
    -   Copy the content from the `.env.example` file (or the section above) and provide your values.

4.  **Run the server**
    ```sh
    npm run dev
    ```

---

## 🤝 Contact

Sahil Jaiswal
-   **LinkedIn**: [Sahil Jaiswal](https://www.linkedin.com/in/sahil-jaiswal-tech)
-   **GitHub**: [gitsrj](https://github.com/gitsrj)
