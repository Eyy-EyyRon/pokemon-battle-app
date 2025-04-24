"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BattleMoveCard } from "@/components/battle-move-card"
import { Sword, RefreshCw } from "lucide-react"

interface BattleMove {
  name: string
  type: string
  power: number
  accuracy: number
}

interface BattleControlsProps {
  turnNumber: number
  currentTurn: "player" | "opponent"
  availableMoves: BattleMove[]
  onMoveSelect: (move: BattleMove) => void
  onSwitchPokemon?: () => void
  disabled?: boolean
  canSwitch?: boolean
}

export function BattleControls({
  turnNumber,
  currentTurn,
  availableMoves,
  onMoveSelect,
  onSwitchPokemon,
  disabled = false,
  canSwitch = false,
}: BattleControlsProps) {
  const [activeTab, setActiveTab] = useState("moves")

  // Ensure we have moves to display
  const movesToDisplay =
    availableMoves.length > 0
      ? availableMoves
      : [
          { name: "Tackle", type: "normal", power: 40, accuracy: 100 },
          { name: "Scratch", type: "normal", power: 40, accuracy: 100 },
          { name: "Pound", type: "normal", power: 40, accuracy: 100 },
          { name: "Quick Attack", type: "normal", power: 40, accuracy: 100 },
        ]

  return (
    <Card className="border-indigo-100 shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white px-2 py-1 rounded-md text-sm font-medium">Turn {turnNumber}</div>
            {currentTurn === "player" ? (
              <div className="bg-emerald-600 text-white px-2 py-1 rounded-md text-sm font-medium animate-pulse">
                Your Turn
              </div>
            ) : (
              <div className="bg-amber-600 text-white px-2 py-1 rounded-md text-sm font-medium">Opponent's Turn</div>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4 bg-indigo-50">
            <TabsTrigger value="moves" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <Sword className="h-4 w-4 mr-2" />
              Moves
            </TabsTrigger>
            <TabsTrigger value="switch" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <RefreshCw className="h-4 w-4 mr-2" />
              Switch
            </TabsTrigger>
          </TabsList>

          <TabsContent value="moves" className="mt-0">
            <div className="grid grid-cols-2 gap-3">
              {movesToDisplay.map((move, index) => (
                <BattleMoveCard
                  key={index}
                  move={move}
                  onClick={() => onMoveSelect(move)}
                  disabled={disabled || currentTurn !== "player"}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="switch" className="mt-0">
            <div className="p-4 text-center">
              <Button onClick={onSwitchPokemon} disabled={!canSwitch} className="bg-indigo-600 hover:bg-indigo-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Switch Pokémon
              </Button>
              <p className="mt-2 text-sm text-gray-500">
                {canSwitch ? "Switching Pokémon will use your turn" : "No other Pokémon available to switch to"}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
