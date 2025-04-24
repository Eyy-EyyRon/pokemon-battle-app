"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { validateInviteCode } from "@/lib/battle-service"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function JoinBattlePage() {
  const [inviteCode, setInviteCode] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleJoinBattle = () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Enter invite code",
        description: "Please enter a valid invite code to join a battle.",
        variant: "destructive",
      })
      return
    }

    setIsValidating(true)

    // Validate the invite code
    const isValid = validateInviteCode(inviteCode.toUpperCase())

    if (isValid) {
      // Redirect to the battle room
      router.push(`/battle/room/${inviteCode.toUpperCase()}`)
    } else {
      toast({
        title: "Invalid code",
        description: "The invite code is invalid or has expired.",
        variant: "destructive",
      })
      setIsValidating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Pokédex
          </Button>
        </Link>
      </div>

      <Card className="border-red-100 max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-red-600">Join a Battle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center">
              <p className="mb-4">Enter the invite code shared by your friend to join their battle.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium mb-1">
                  Invite Code
                </label>
                <Input
                  id="inviteCode"
                  placeholder="Enter 6-digit code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="text-center text-lg font-mono uppercase"
                  maxLength={6}
                />
              </div>

              <Button
                onClick={handleJoinBattle}
                disabled={!inviteCode.trim() || isValidating}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {isValidating ? "Validating..." : "Join Battle"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-red-100 pt-4">
          <Link href="/battle/create">
            <Button variant="link" className="text-red-600">
              Create your own battle instead
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
