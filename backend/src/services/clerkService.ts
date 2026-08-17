import { clerkClient } from "@clerk/express";


export async function getUserEmail(userId:string){
    try {
        const user=await clerkClient.users.getUser(userId);

        return user.primaryEmailAddress?.emailAddress ?? null;

    } catch (error) {
        console.error(`Failed to fetch email for user ${userId}`,error);
        return null
    }
    
}

export async function getManagerEmails():Promise<string[]> {
    try {
        const {data:users}=await clerkClient.users.getUserList({limit:100});

        const managers=users.filter(
            (user)=> (user.publicMetadata as {role?:string})?.role === "manager"
        );

        return managers.map((m)=>m.primaryEmailAddress?.emailAddress).filter((email):email is string => !!email)
    } catch (error) {
        console.error("Failed to fetch manager emails",error)
        return []
        
    }
    
}