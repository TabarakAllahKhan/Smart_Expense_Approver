import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
      <h1 className="text-xl font-semibold text-gray-900">Smart Expense Approver</h1>
      <SignedOut>
        <SignInButton mode="modal" />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  )
}