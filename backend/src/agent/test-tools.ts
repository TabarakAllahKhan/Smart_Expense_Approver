import {checkSpendingLimit,checkReceiptRequired} from './tools';

const limitResult=checkSpendingLimit('Meals', 10);
const receiptResult=checkReceiptRequired(20,false);

console.log(limitResult)
console.log(receiptResult)