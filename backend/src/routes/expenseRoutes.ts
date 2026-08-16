import { Router } from "express";

import { submitExpense,getMyExpense,getFlaggedExpenses,overrideExpense,updateExpense,deleteExpense } from "../controllers/expenseController";


const router=Router();

router.post("/",submitExpense);
router.get("/",getMyExpense);
router.get("/flagged",getFlaggedExpenses)
router.patch("/:id/override",overrideExpense);
router.patch("/:id",updateExpense);
router.delete("/:id",deleteExpense);

export default router