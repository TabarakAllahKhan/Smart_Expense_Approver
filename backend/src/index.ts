import "dotenv/config"
import express from "express"
import { connectToDatabase } from "./db/connect.js"
import expenseRoutes from "./routes/expenseRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { clerkMiddleware } from "@clerk/express";
import cors from "cors" 



const app=express();

const allowedOrigins=[
    "http://localhost:5173",
    "https://smart-expense-approver.vercel.app"
]
app.use(
    cors({
        origin:allowedOrigins,
        credentials:true,
    })
)

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use(clerkMiddleware())

app.use("/api/expenses",expenseRoutes)
app.use("/api/upload",uploadRoutes)
const PORT=process.env.PORT || 3001

async function start() {
    await connectToDatabase();
    app.listen(PORT,()=>{
        console.log(`SERVER RUNNING ON http://localhost:${PORT}`);
    })
}

start();
