"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import type { TeamMember, BattleResult } from "@/lib/types"
import { loadBattles, saveBattle } from "@/lib/storage-service"

interface BattleSimulatorProps {
  team: TeamMember[]
  username: string
}

export default function BattleSimulator({ team, username }: BattleSimulatorProps) {
  const [selectedPokemon1, setSelectedPokemon1] = useState<TeamMember | null>(null)
  const [selectedPokemon2, setSelectedPokemon2] = useState<TeamMember | null>(null)
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null)
  const [battleHistory, setBattleHistory] = useState<BattleResult[]>([])
  const [isBattling, setIsBattling] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Load battle history using storage service
    const loadBattleHistory = async () => {
      try {
        const data = await loadBattles()
        setBattleHistory(data)
      } catch (error) {
        console.error("Failed to load battle history:", error)
        toast({
          title: "History Loading Error",
          description: "Failed to load battle history.",
          variant: "destructive",
        })
      }
    }

    loadBattleHistory()
  }, [toast])

  const simulateBattle = async () => {
    if (!selectedPokemon1 || !selectedPokemon2) {
      toast({
        title: "Selection Required",
        description: "Please select two Pokémon to battle!",
        variant: "destructive",
      })
      return
    }

    setIsBattling(true)
    setBattleResult(null)

    // Get stats
    const pokemon1HP = selectedPokemon1.stats.find((s) => s.stat.name === "hp")?.base_stat || 0
    const pokemon1Attack = selectedPokemon1.stats.find((s) => s.stat.name === "attack")?.base_stat || 0
    const pokemon1Speed = selectedPokemon1.stats.find((s) => s.stat.name === "speed")?.base_stat || 0

    const pokemon2HP = selectedPokemon2.stats.find((s) => s.stat.name === "hp")?.base_stat || 0
    const pokemon2Attack = selectedPokemon2.stats.find((s) => s.stat.name === "attack")?.base_stat || 0
    const pokemon2Speed = selectedPokemon2.stats.find((s) => s.stat.name === "speed")?.base_stat || 0

    // Compare stats
    let pokemon1Wins = 0
    let pokemon2Wins = 0

    // HP comparison
    if (pokemon1HP > pokemon2HP) {
      pokemon1Wins++
    } else if (pokemon2HP > pokemon1HP) {
      pokemon2Wins++
    }

    // Attack comparison
    if (pokemon1Attack > pokemon2Attack) {
      pokemon1Wins++
    } else if (pokemon2Attack > pokemon1Attack) {
      pokemon2Wins++
    }

    // Speed comparison
    if (pokemon1Speed > pokemon2Speed) {
      pokemon1Wins++
    } else if (pokemon2Speed > pokemon1Speed) {
      pokemon2Wins++
    }

    // Determine winner
    let winner: TeamMember
    if (pokemon1Wins > pokemon2Wins) {
      winner = selectedPokemon1
    } else if (pokemon2Wins > pokemon1Wins) {
      winner = selectedPokemon2
    } else {
      // In case of a tie, the Pokémon with higher total stats wins
      const pokemon1Total = pokemon1HP + pokemon1Attack + pokemon1Speed
      const pokemon2Total = pokemon2HP + pokemon2Attack + pokemon2Speed

      winner = pokemon1Total > pokemon2Total ? selectedPokemon1 : selectedPokemon2
    }

    // Create battle result
    const result: BattleResult = {
      id: Date.now(),
      date: new Date().toISOString(),
      pokemon1: {
        id: selectedPokemon1.id,
        name: selectedPokemon1.name,
        sprite: selectedPokemon1.sprite,
      },
      pokemon2: {
        id: selectedPokemon2.id,
        name: selectedPokemon2.name,
        sprite: selectedPokemon2.sprite,
      },
      winner: {
        id: winner.id,
        name: winner.name,
        sprite: winner.sprite,
      },
      stats: {
        pokemon1: {
          hp: pokemon1HP,
          attack: pokemon1Attack,
          speed: pokemon1Speed,
        },
        pokemon2: {
          hp: pokemon2HP,
          attack: pokemon2Attack,
          speed: pokemon2Speed,
        },
      },
    }

    // Simulate battle animation
    setTimeout(() => {
      setBattleResult(result)
      setIsBattling(false)

      // Add to battle history
      const updatedHistory = [result, ...battleHistory]
      setBattleHistory(updatedHistory)

      // Save using storage service
      saveBattleResult(result)
    }, 1500)
  }

  const saveBattleResult = async (result: BattleResult) => {
    try {
      await saveBattle(result)
    } catch (error) {
      console.error("Failed to save battle result:", error)
      toast({
        title: "Save Error",
        description: "Failed to save battle result.",
        variant: "destructive",
      })
    }
  }

  if (team.length < 2) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium mb-4">You need at least 2 Pokémon in your team to battle</h3>
        <p className="text-muted-foreground">Go to the Browse tab to add Pokémon to your team!</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Select First Pokémon</h3>
          <div className="grid grid-cols-2 gap-3">
            {team.map((pokemon) => (
              <Card
                key={`p1-${pokemon.id}`}
                className={`cursor-pointer transition-all ${
                  selectedPokemon1?.id === pokemon.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedPokemon1(pokemon)}
              >
                <CardContent className="p-3 flex flex-col items-center">
                  <img src={pokemon.sprite || "/placeholder.svg"} alt={pokemon.name} className="w-20 h-20" />
                  <h4 className="font-medium capitalize">{pokemon.name}</h4>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Select Second Pokémon</h3>
          <div className="grid grid-cols-2 gap-3">
            {team.map((pokemon) => (
              <Card
                key={`p2-${pokemon.id}`}
                className={`cursor-pointer transition-all ${
                  selectedPokemon2?.id === pokemon.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedPokemon2(pokemon)}
              >
                <CardContent className="p-3 flex flex-col items-center">
                  <img src={pokemon.sprite || "/placeholder.svg"} alt={pokemon.name} className="w-20 h-20" />
                  <h4 className="font-medium capitalize">{pokemon.name}</h4>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button size="lg" onClick={simulateBattle} disabled={!selectedPokemon1 || !selectedPokemon2 || isBattling}>
          {isBattling ? "Battling..." : "Start Battle!"}
        </Button>
      </div>

      {isBattling && (
        <div className="text-center py-8">
          <div className="animate-bounce text-4xl mb-4">⚡</div>
          <p className="text-xl font-medium">Battle in progress...</p>
        </div>
      )}

      {battleResult && (
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-2xl font-bold text-center mb-6">Battle Results</h3>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <img
                  src={battleResult.pokemon1.sprite || "/placeholder.svg"}
                  alt={battleResult.pokemon1.name}
                  className={`w-32 h-32 mx-auto ${
                    battleResult.winner.id === battleResult.pokemon1.id ? "" : "opacity-60"
                  }`}
                />
                <h4 className="text-lg font-medium capitalize">{battleResult.pokemon1.name}</h4>

                <div className="mt-4 space-y-2 text-sm">
                  <div>
                    <span className="font-medium">HP:</span> {battleResult.stats.pokemon1.hp}
                  </div>
                  <div>
                    <span className="font-medium">Attack:</span> {battleResult.stats.pokemon1.attack}
                  </div>
                  <div>
                    <span className="font-medium">Speed:</span> {battleResult.stats.pokemon1.speed}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="text-4xl mb-4">VS</div>
                <div className="bg-muted p-4 rounded-lg text-center">
                  <h3 className="text-xl font-bold mb-2">Winner</h3>
                  <div className="flex items-center gap-2 justify-center">
                    <img
                      src={battleResult.winner.sprite || "/placeholder.svg"}
                      alt={battleResult.winner.name}
                      className="w-12 h-12"
                    />
                    <span className="font-medium capitalize">{battleResult.winner.name}</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <img
                  src={battleResult.pokemon2.sprite || "/placeholder.svg"}
                  alt={battleResult.pokemon2.name}
                  className={`w-32 h-32 mx-auto ${
                    battleResult.winner.id === battleResult.pokemon2.id ? "" : "opacity-60"
                  }`}
                />
                <h4 className="text-lg font-medium capitalize">{battleResult.pokemon2.name}</h4>

                <div className="mt-4 space-y-2 text-sm">
                  <div>
                    <span className="font-medium">HP:</span> {battleResult.stats.pokemon2.hp}
                  </div>
                  <div>
                    <span className="font-medium">Attack:</span> {battleResult.stats.pokemon2.attack}
                  </div>
                  <div>
                    <span className="font-medium">Speed:</span> {battleResult.stats.pokemon2.speed}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-2">Stat Comparison</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>HP</span>
                    <span>
                      {battleResult.stats.pokemon1.hp} vs {battleResult.stats.pokemon2.hp}
                    </span>
                  </div>
                  <div className="flex h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="bg-green-500"
                      style={{
                        width: `${(battleResult.stats.pokemon1.hp / (battleResult.stats.pokemon1.hp + battleResult.stats.pokemon2.hp)) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-blue-500"
                      style={{
                        width: `${(battleResult.stats.pokemon2.hp / (battleResult.stats.pokemon1.hp + battleResult.stats.pokemon2.hp)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Attack</span>
                    <span>
                      {battleResult.stats.pokemon1.attack} vs {battleResult.stats.pokemon2.attack}
                    </span>
                  </div>
                  <div className="flex h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="bg-green-500"
                      style={{
                        width: `${(battleResult.stats.pokemon1.attack / (battleResult.stats.pokemon1.attack + battleResult.stats.pokemon2.attack)) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-blue-500"
                      style={{
                        width: `${(battleResult.stats.pokemon2.attack / (battleResult.stats.pokemon1.attack + battleResult.stats.pokemon2.attack)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Speed</span>
                    <span>
                      {battleResult.stats.pokemon1.speed} vs {battleResult.stats.pokemon2.speed}
                    </span>
                  </div>
                  <div className="flex h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="bg-green-500"
                      style={{
                        width: `${(battleResult.stats.pokemon1.speed / (battleResult.stats.pokemon1.speed + battleResult.stats.pokemon2.speed)) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-blue-500"
                      style={{
                        width: `${(battleResult.stats.pokemon2.speed / (battleResult.stats.pokemon1.speed + battleResult.stats.pokemon2.speed)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {battleHistory.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Battle History</h3>
          <div className="space-y-3">
            {battleHistory.map((battle) => (
              <Card key={battle.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={battle.pokemon1.sprite || "/placeholder.svg"}
                        alt={battle.pokemon1.name}
                        className="w-12 h-12"
                      />
                      <span className="font-medium capitalize">{battle.pokemon1.name}</span>
                      <span className="text-muted-foreground">vs</span>
                      <img
                        src={battle.pokemon2.sprite || "/placeholder.svg"}
                        alt={battle.pokemon2.name}
                        className="w-12 h-12"
                      />
                      <span className="font-medium capitalize">{battle.pokemon2.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Winner:</span>
                      <Badge className="capitalize">{battle.winner.name}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(battle.date).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
