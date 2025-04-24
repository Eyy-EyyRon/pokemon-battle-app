"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getMoveType, getMoveTypeColor } from "@/lib/battle-utils"

interface BattleMove {
  name: string
  type: string
  power: number
  accuracy: number
}

interface BattleMoveCardProps {
  move: BattleMove
  onClick: () => void
  disabled?: boolean
}

export function BattleMoveCard({ move, onClick, disabled = false }: BattleMoveCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const moveType = move.type || getMoveType(move.name)
  const typeColor = getMoveTypeColor(moveType)

  return (
    <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <Button
        onClick={onClick}
        disabled={disabled}
        className={`h-auto p-0 overflow-hidden w-full ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:brightness-110"
        }`}
      >
        <div className="w-full flex flex-col">
          <div className={`${typeColor} text-white font-medium py-1 px-3 text-sm`}>{move.name}</div>
          <div className="bg-white text-gray-800 p-2 text-xs flex justify-between items-center">
            <span>Power: {move.power}</span>
            <span>Acc: {move.accuracy}%</span>
          </div>
        </div>
      </Button>

      {showTooltip && (
        <div className="absolute z-50 bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 pointer-events-none">
          Type: {moveType}
        </div>
      )}
    </div>
  )
}
