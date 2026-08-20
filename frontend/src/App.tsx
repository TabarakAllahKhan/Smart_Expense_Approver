import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { Header } from './components/layout/Header'
import { EmployeeDashboard } from './pages/EmployeeDashboard'
import { ManagerDashboard } from './pages/ManagerDashboard'
import { LandingPage } from './pages/LandingPage'
import { useRole } from './lib/useRole'

function App() {
  const role = useRole();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAF7" }}>
      <Header />
      <SignedIn>
        {role === "manager" ? <ManagerDashboard /> : <EmployeeDashboard />}
      </SignedIn>
      <SignedOut>
        <LandingPage />
      </SignedOut>
    </div>
  )
}

export default App