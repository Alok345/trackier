"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, firestore } from "@/lib/firestore"

export function LoginForm({ className, ...props }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // 🔑 Auto redirect check
  useEffect(() => {
    const userType = localStorage.getItem("userType")
    const name = localStorage.getItem("name")
    const email = localStorage.getItem("email")

    if (userType && name && email) {
      router.replace("/dashboard") // already logged in
    } else {
      router.replace("/login") // force login if missing
    }
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // 1️⃣ Firebase Auth login
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 2️⃣ Get user document from Firestore
      const userDocRef = doc(firestore, "users", user.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()

        // 3️⃣ Save info to localStorage
        localStorage.setItem("userUid", user.uid)
        localStorage.setItem("name", userData.name)
        localStorage.setItem("email", userData.email)
        localStorage.setItem("userType", userData.userType)

        // 4️⃣ Redirect to dashboard
        router.push("/dashboard")
      } else {
        setError("User data not found in Firestore")
      }
    } catch (err) {
      console.error(err)
      setError("Invalid credentials or login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
