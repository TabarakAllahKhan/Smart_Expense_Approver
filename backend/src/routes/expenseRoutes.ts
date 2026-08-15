import { Router } from "express";

import { submitExpense,getMyExpense } from "../controllers/expenseController";


const router=Router();

router.post("/",submitExpense);
router.get("/",getMyExpense);

export default router