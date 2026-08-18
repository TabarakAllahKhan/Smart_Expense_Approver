import { Request,Response } from "express";
import { getAuth } from "@clerk/express";
import { uploadReceiptToCloudinary,extractReceiptText,isReceiptTextUsable } from "../services/uploadService";



export async function uplaodReceipt(req:Request,res:Response){
    try {
        const {isAuthenticated}=getAuth(req);

        if(!isAuthenticated){
            return res.status(401).json({error:"User not Authenticated"});
        }

        if(!req.file){
            return res.status(400).json({error:"No file uploaded"});
        }

        const receiptUrl=await uploadReceiptToCloudinary(req.file.buffer);

        let receiptText:string | undefined;

        try {
            const rawText=await extractReceiptText(req.file.buffer);
            receiptText=isReceiptTextUsable(rawText) ? rawText.trim() : undefined;
        } catch (ocrErr) {
            console.error("OCR extraction failed",ocrErr);
            receiptText=undefined;
        }
        res.status(200).json({receiptUrl,receiptText});
    } catch (error) {
        console.error("Error uploading receipt",error);
        res.status(500).json({error:"Failed to upload receipt"});
        
    }
}