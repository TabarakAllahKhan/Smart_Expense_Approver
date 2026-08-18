import { Router } from "express";

import multer from "multer"

import {uplaodReceipt} from "../controllers/uploadController"


const upload=multer({
    storage:multer.memoryStorage(),
    limits:{fileSize:5*1024*1024}, // 5mb
    fileFilter:(_req,file,cb)=>{
        const allowed=["image/jpeg","image/png","image/webp","application/pdf"];
        if(allowed.includes(file.mimetype)){
            cb(null,true);
        }else{
            cb(new Error("Unsupported file type"));
        }
    },
})

const router=Router();

router.post("/",upload.single("receipt"),uplaodReceipt)


export default router