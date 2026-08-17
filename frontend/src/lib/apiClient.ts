const BASE_API_URL="http://localhost:3001/api";

type ApiClientOptions={
    method?:"GET" |  "POST" | "PATCH" | "DELETE";
    body?:unknown;
    token:string | null;
}

export async function apiClient(path:string,options:ApiClientOptions){
    const {method="GET",body,token}=options;

    const headers:Record<string,string>={
        "Content-Type":"application/json",
    }
    if(token){
        headers['Authorization']=`Bearer ${token}`;
    }

    const response=await fetch(`${BASE_API_URL}${path}`,{
        method,
        headers,
        body:body ? JSON.stringify(body):undefined
    });

    if(!response.ok){
        const errorData=await response.json().catch(()=>({}));
        throw new Error(errorData.error || `Request failed with response status ${response.status}`)
    }

    return response.json()
}