import "dotenv/config"
import express from "express"
import { connectToDatabase } from "./db/connect.js"
import expenseRoutes from "./routes/expenseRoutes.js";
import { clerkMiddleware } from "@clerk/express";
import cors from "cors" 



const app=express();

app.use(
    cors({
        origin:"http://localhost:5173",
        credentials:true,
    })
)

app.use(express.json())

app.use(clerkMiddleware())

app.use("/api/expenses",expenseRoutes)

const PORT=process.env.PORT || 3001

async function start() {
    await connectToDatabase();
    app.listen(PORT,()=>{
        console.log(`SERVER RUNNING ON http://localhost:${PORT}`);
    })
}

start();
