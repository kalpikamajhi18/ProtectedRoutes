import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/webDB';
        const conn = await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 2500 });
        console.log("mongoDb is connected");
        return true;
    }
    catch (err) {
        console.warn(`mongodb is not connected (${err.message})`);
        return false;
    }

};

export default connectDB;

