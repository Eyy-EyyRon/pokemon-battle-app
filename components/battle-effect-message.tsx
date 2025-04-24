"use client"

import { useEffect, useState } from "react"

interface BattleEffectMessageProps {
  message: string
  type: "normal" | "effective" | "not-effective" | "critical" | "miss" | "immune"
  onComplete?: () => void
}

export function BattleEffectMessage({ message, type, onComplete }: BattleEffectMessageProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      if (onComplete) onComplete()
    }, 1500)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!visible) return null

  const getTypeStyles = () => {
    switch (type) {
      case "effective":
        return "bg-green-600 text-white"
      case "not-effective":
        return "bg-orange-500 text-white"
      case "critical":
        return "bg-red-600 text-white"
      case "miss":
        return "bg-gray-600 text-white"
      case "immune":
        return "bg-purple-600 text-white"
      default:
        return "bg-gray-800 text-white"
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
      <div className={`${getTypeStyles()} px-4 py-2 rounded-lg text-lg font-bold animate-fade-in-out shadow-lg`}>
        {message}
      </div>
    </div>
  )
}
