import {v2 as cloudinary} from "cloudinary";
import { createWorker } from "tesseract.js";


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

export async function uploadReceiptToCloudinary(fileBuffer:Buffer):Promise<string>{
    return new Promise((resolve,reject)=>{
        const stream=cloudinary.uploader.upload_stream(
            {folder:"expense-receipts",resource_type:"image"},
            (error,result)=>{
                if(error || !result) return reject(error);
                resolve(result.secure_url)
            }

        );
        stream.end(fileBuffer)
    })
}

// Extract the Text From OCR 
export async function extractReceiptText(fileBuffer:Buffer):Promise<string> {
    const worker=await createWorker("eng");

    try {
        const {data}=await worker.recognize(fileBuffer);
        return data.text;
    } finally {
        await worker.terminate();
    }
    
}

// Checks if the extracted text is usable and does not contain blur text or extra whitespaces
export function isReceiptTextUsable(text:string):boolean{
    const cleaned=text.trim();

    if(cleaned.length < 10) return false;

    const alphanumericRatio = (cleaned.match(/[a-zA-Z0-9]/g)?.length ?? 0) / cleaned.length;
    return alphanumericRatio > 0.3;
}