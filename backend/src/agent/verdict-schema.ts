import z from 'zod';

// This schema defines the structure to validate how the 
// Response of the agent should look like
export const verdictSchema=z.object({
    decision:z.enum(['auto-approved','flagged','rejected']),
    confidence:z.number().min(0).max(1),
    reasoning:z.string(),
    flaggedRules:z.array(z.string()).optional(),
});

export type Verdict=z.infer<typeof verdictSchema>;

