import { Router } from "express";

import { submitExpense,getMyExpense,getFlaggedExpenses,overrideExpense } from "../controllers/expenseController";


const router=Router();

router.post("/",submitExpense);
router.get("/",getMyExpense);
router.get("/flagged",getFlaggedExpenses)
router.patch("/:id/override",overrideExpense);

export default router