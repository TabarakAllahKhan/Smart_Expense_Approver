import {checkSpendingLimit,checkReceiptRequired,checkDuplicateSubmission, viewPurchaseHistory,} from './tools';

const limitResult=checkSpendingLimit('Meals', 10);
const receiptResult=checkReceiptRequired(20,false);
const duplicatedResult=checkDuplicateSubmission('user_123',105,'2026-08-12');
const purchaseHistoryResult=viewPurchaseHistory('user_123');
console.log(limitResult)
console.log(receiptResult)
console.log(duplicatedResult)
console.log(purchaseHistoryResult)