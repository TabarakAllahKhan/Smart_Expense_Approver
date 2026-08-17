import { Header } from "./components/layout/Header"
import { useEffect } from "react"
import { useAuth } from "@clerk/clerk-react"
import { apiClient } from "./lib/apiClient"
function App() {
  const {getToken,isSignedIn}=useAuth()
  
  useEffect(()=>{
    async function testFetch(){
      if(!isSignedIn) return
      const token=await getToken()
      const expenses=await apiClient('/expenses',{token})
      console.log("fetched expenses",expenses)
    }
    testFetch()
  },[isSignedIn])
  return (
   
     <div className="min-h-screen bg-gray-50">
      <Header />
    </div>
  )
}

export default App