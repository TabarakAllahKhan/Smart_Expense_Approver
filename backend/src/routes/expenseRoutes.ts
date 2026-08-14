import { Router } from "express";

import { submitExpense } from "../controllers/expenseController";

const router=Router();

router.post("/",submitExpense);

export default router