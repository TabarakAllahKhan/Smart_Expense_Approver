import "dotenv/config";
import Groq from "groq-sdk";

import {toolSchemas} from "./tool-schemas";

let apiKey=process.env.GROQ_API_KEY;

const groq=new Groq({apiKey});

async function main(){
    const expense={
        amount: 75,
        category: "Meals",
        description: "Team lunch at a local restaurant",
        hasReceipt: false
    }

    const response=await groq.chat.completions.create({
        model:"llama-3.3-70b-versatile",
        messages:[
            {
                role:"system",
                content:"You are an expense approval assistant. Use the available tools to check company policy before deciding whether to approve, flag, or reject an expense.",

            },
            {
                role:"user",
                content:`An Employee has submitted this expense:${JSON.stringify(expense)}. Evaluate it.`
            },
        ],
        tools:toolSchemas,
        tool_choice:"auto"
    })

    const message=response.choices[0].message;
    console.log(JSON.stringify(message,null,2));
}

main();