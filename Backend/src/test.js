import cloudinary from "./config/cloudinary.js";

const testUpload = async () => {
    try {
        const result = await cloudinary.uploader.upload(
            "./hero.png",
            {
                folder: "test"
            }
        );

        console.log("UPLOAD SUCCESS");
        console.log(result.secure_url);

    } catch (error) {

        console.log("UPLOAD FAILED");
        console.log(error);

    }
};
testUpload();