import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();


const MONGODB_URI=process.env.MONGODB_URI;

export const connectToDatabase=async()=>{
    const uri=MONGODB_URI;
    if(!uri){
        throw new Error("MONGODB_URI is not defined in environment variables");
    }
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
}