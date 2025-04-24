"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { checkJsonServerAvailability, toggleStorageMethod } from "@/lib/storage-service"

export default function StorageModeToggle() {
  const [storageMode, setStorageMode] = useState<"server" | "local">("local")
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()

  // Check json-server availability on component mount
  useEffect(() => {
    const checkServerAvailability = async () => {
      setIsChecking(true)
      const isServerAvailable = await checkJsonServerAvailability()
      setStorageMode(isServerAvailable ? "server" : "local")
      toggleStorageMethod(isServerAvailable)
      setIsChecking(false)
    }

    checkServerAvailability()
  }, [])

  const toggleStorage = async () => {
    setIsChecking(true)

    if (storageMode === "local") {
      // Trying to switch to server mode
      const isServerAvailable = await checkJsonServerAvailability()
      if (!isServerAvailable) {
        toast({
          title: "Server Unavailable",
          description: "Could not connect to json-server. Make sure it's running on port 3001.",
          variant: "destructive",
        })
        setIsChecking(false)
        return
      }

      setStorageMode("server")
      toggleStorageMethod(true)
      toast({
        title: "Using Server Storage",
        description: "Switched to json-server for data persistence.",
      })
    } else {
      // Switching to local mode
      setStorageMode("local")
      toggleStorageMethod(false)
      toast({
        title: "Using Local Storage",
        description: "Switched to localStorage for data persistence.",
      })
    }

    setIsChecking(false)
  }

  return (
    <Button variant="outline" size="sm" onClick={toggleStorage} disabled={isChecking} className="relative">
      {isChecking ? (
        <span className="flex items-center">
          <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-current rounded-full"></span>
          Checking...
        </span>
      ) : (
        <>
          {storageMode === "server" ? "Using Server" : "Using Local"}
          <span
            className={`absolute top-0 right-0 h-2 w-2 rounded-full ${storageMode === "server" ? "bg-green-500" : "bg-amber-500"}`}
          ></span>
        </>
      )}
    </Button>
  )
}
