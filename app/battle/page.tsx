"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Swords, Trophy } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getTeam } from "@/lib/team-service"
import { saveBattleResult } from "@/lib/battle-service"
import { useToast } from "@/hooks/use-toast"

interface Pokemon {
  id: number
  name: string
  sprite: string
  types: string[]
  stats?: {
    hp: number
    attack: number
    defense: number
    "special-attack": number
    "special-defense": number
    speed: number
  }
}

interface BattleResult {
  rounds: {
    stat: string
    pokemon1Value: number
    pokemon2Value: number
    winner: string
  }[]
  winner: Pokemon
  loser: Pokemon
  date: string
}

export default function BattlePage() {
  const [team, setTeam] = useState<Pokemon[]>([])
  const [selectedPokemon1, setSelectedPokemon1] = useState<Pokemon | null>(null)
  const [selectedPokemon2, setSelectedPokemon2] = useState<Pokemon | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBattling, setIsBattling] = useState(false)
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadTeam = async () => {
      setIsLoading(true)
      try {
        const teamData = await getTeam()

        // For each Pokemon in the team, fetch their stats
        const teamWithStats = await Promise.all(
          teamData.map(async (pokemon: Pokemon) => {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`)
            const data = await response.json()

            // Extract the stats we need
            const stats = data.stats.reduce((acc: any, stat: any) => {
              acc[stat.stat.name] = stat.base_stat
              return acc
            }, {})

            return {
              ...pokemon,
              stats,
            }
          }),
        )

        setTeam(teamWithStats)
      } catch (error) {
        console.error("Error loading team:", error)
        toast({
          title: "Error",
          description: "Failed to load your team. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadTeam()
  }, [toast])

  const handleSelectPokemon1 = (pokemon: Pokemon) => {
    setSelectedPokemon1(pokemon)
    // If the same Pokemon is selected for both slots, deselect the second slot
    if (selectedPokemon2 && selectedPokemon2.id === pokemon.id) {
      setSelectedPokemon2(null)
    }
  }

  const handleSelectPokemon2 = (pokemon: Pokemon) => {
    setSelectedPokemon2(pokemon)
    // If the same Pokemon is selected for both slots, deselect the first slot
    if (selectedPokemon1 && selectedPokemon1.id === pokemon.id) {
      setSelectedPokemon1(null)
    }
  }

  const startBattle = async () => {
    if (!selectedPokemon1 || !selectedPokemon2 || !selectedPokemon1.stats || !selectedPokemon2.stats) {
      toast({
        title: "Cannot start battle",
        description: "Please select two different Pokémon to battle.",
        variant: "destructive",
      })
      return
    }

    setIsBattling(true)

    // Simulate battle with a delay for dramatic effect
    setTimeout(async () => {
      // Compare HP, Attack, and Speed to determine the winner
      const rounds = [
        {
          stat: "hp",
          pokemon1Value: selectedPokemon1.stats!.hp,
          pokemon2Value: selectedPokemon2.stats!.hp,
          winner:
            selectedPokemon1.stats!.hp > selectedPokemon2.stats!.hp ? selectedPokemon1.name : selectedPokemon2.name,
        },
        {
          stat: "attack",
          pokemon1Value: selectedPokemon1.stats!.attack,
          pokemon2Value: selectedPokemon2.stats!.attack,
          winner:
            selectedPokemon1.stats!.attack > selectedPokemon2.stats!.attack
              ? selectedPokemon1.name
              : selectedPokemon2.name,
        },
        {
          stat: "speed",
          pokemon1Value: selectedPokemon1.stats!.speed,
          pokemon2Value: selectedPokemon2.stats!.speed,
          winner:
            selectedPokemon1.stats!.speed > selectedPokemon2.stats!.speed
              ? selectedPokemon1.name
              : selectedPokemon2.name,
        },
      ]

      // Count wins for each Pokemon
      const pokemon1Wins = rounds.filter((round) => round.winner === selectedPokemon1.name).length
      const pokemon2Wins = rounds.filter((round) => round.winner === selectedPokemon2.name).length

      // Determine the overall winner
      const winner = pokemon1Wins > pokemon2Wins ? selectedPokemon1 : selectedPokemon2
      const loser = winner.id === selectedPokemon1.id ? selectedPokemon2 : selectedPokemon1

      const result: BattleResult = {
        rounds,
        winner,
        loser,
        date: new Date().toISOString(),
      }

      setBattleResult(result)

      // Save battle result to json-server
      try {
        await saveBattleResult({
          winnerId: winner.id,
          winnerName: winner.name,
          loserId: loser.id,
          loserName: loser.name,
          date: result.date,
        })
      } catch (error) {
        console.error("Error saving battle result:", error)
      }

      setIsBattling(false)
    }, 2000)
  }

  const resetBattle = () => {
    setBattleResult(null)
    setSelectedPokemon1(null)
    setSelectedPokemon2(null)
  }

  const getTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      normal: "bg-gray-400",
      fire: "bg-red-500",
      water: "bg-blue-500",
      electric: "bg-yellow-400",
      grass: "bg-green-500",
      ice: "bg-blue-200",
      fighting: "bg-red-700",
      poison: "bg-purple-500",
      ground: "bg-yellow-700",
      flying: "bg-indigo-300",
      psychic: "bg-pink-500",
      bug: "bg-green-400",
      rock: "bg-yellow-600",
      ghost: "bg-purple-700",
      dragon: "bg-indigo-700",
      dark: "bg-gray-700",
      steel: "bg-gray-500",
      fairy: "bg-pink-300",
    }
    return typeColors[type] || "bg-gray-400"
  }

  const formatStatName = (name: string) => {
    switch (name) {
      case "hp":
        return "HP"
      case "attack":
        return "Attack"
      case "speed":
        return "Speed"
      default:
        return name
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Pokédex
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Battle Arena</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p>Loading your team...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (team.length < 2) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Pokédex
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Battle Arena</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p>You need at least 2 Pokémon in your team to battle.</p>
            <Link href="/">
              <Button className="mt-4">Add Pokémon to Team</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Pokédex
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">Battle Arena</CardTitle>
        </CardHeader>
        <CardContent>
          {battleResult ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-10">
                <div className="text-center">
                  <div className="relative h-32 w-32 mx-auto">
                    <Image
                      src={battleResult.winner.sprite || "/placeholder.svg"}
                      alt={battleResult.winner.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="font-bold capitalize mt-2">{battleResult.winner.name}</h3>
                  <div className="flex justify-center gap-1 mt-1">
                    {battleResult.winner.types.map((type) => (
                      <span
                        key={type}
                        className={`${getTypeColor(type)} text-white text-xs px-1.5 py-0.5 rounded-full capitalize`}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-yellow-500 mr-1" />
                    <span className="font-semibold text-green-600">Winner!</span>
                  </div>
                </div>

                <div className="text-xl font-bold my-4">VS</div>

                <div className="text-center">
                  <div className="relative h-32 w-32 mx-auto opacity-75">
                    <Image
                      src={battleResult.loser.sprite || "/placeholder.svg"}
                      alt={battleResult.loser.name}
                      fill
                      className="object-contain grayscale"
                    />
                  </div>
                  <h3 className="font-bold capitalize mt-2">{battleResult.loser.name}</h3>
                  <div className="flex justify-center gap-1 mt-1">
                    {battleResult.loser.types.map((type) => (
                      <span
                        key={type}
                        className={`${getTypeColor(type)} text-white text-xs px-1.5 py-0.5 rounded-full capitalize`}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-muted-foreground">Defeated</div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-bold text-center mb-4">Battle Results</h3>
                <div className="space-y-4">
                  {battleResult.rounds.map((round, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2 items-center">
                      <div className={`text-right ${round.winner === battleResult.winner.name ? "font-bold" : ""}`}>
                        {round.pokemon1Value}
                      </div>
                      <div className="text-center">
                        <span className="px-2 py-1 bg-muted rounded-full text-xs font-medium">
                          {formatStatName(round.stat)}
                        </span>
                      </div>
                      <div className={`text-left ${round.winner === battleResult.loser.name ? "font-bold" : ""}`}>
                        {round.pokemon2Value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-bold mb-3 text-center">Select First Pokémon</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {team.map((pokemon) => (
                      <div
                        key={`p1-${pokemon.id}`}
                        className={`p-2 border rounded-lg cursor-pointer transition-all ${
                          selectedPokemon1?.id === pokemon.id ? "border-primary bg-primary/10" : "hover:bg-muted"
                        } ${selectedPokemon2?.id === pokemon.id ? "opacity-50" : ""}`}
                        onClick={() => handleSelectPokemon1(pokemon)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative h-10 w-10 flex-shrink-0">
                            <Image
                              src={pokemon.sprite || "/placeholder.svg"}
                              alt={pokemon.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium capitalize text-sm">{pokemon.name}</h4>
                            <div className="flex gap-1">
                              {pokemon.types.map((type) => (
                                <span
                                  key={type}
                                  className={`${getTypeColor(type)} text-white text-xs px-1 py-0.5 rounded-full capitalize`}
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-3 text-center">Select Second Pokémon</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {team.map((pokemon) => (
                      <div
                        key={`p2-${pokemon.id}`}
                        className={`p-2 border rounded-lg cursor-pointer transition-all ${
                          selectedPokemon2?.id === pokemon.id ? "border-primary bg-primary/10" : "hover:bg-muted"
                        } ${selectedPokemon1?.id === pokemon.id ? "opacity-50" : ""}`}
                        onClick={() => handleSelectPokemon2(pokemon)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative h-10 w-10 flex-shrink-0">
                            <Image
                              src={pokemon.sprite || "/placeholder.svg"}
                              alt={pokemon.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium capitalize text-sm">{pokemon.name}</h4>
                            <div className="flex gap-1">
                              {pokemon.types.map((type) => (
                                <span
                                  key={type}
                                  className={`${getTypeColor(type)} text-white text-xs px-1 py-0.5 rounded-full capitalize`}
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                {selectedPokemon1 && selectedPokemon2 ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-6 mb-4">
                      <div className="text-center">
                        <div className="relative h-24 w-24">
                          <Image
                            src={selectedPokemon1.sprite || "/placeholder.svg"}
                            alt={selectedPokemon1.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <h3 className="font-bold capitalize">{selectedPokemon1.name}</h3>
                      </div>

                      <div className="text-xl font-bold">VS</div>

                      <div className="text-center">
                        <div className="relative h-24 w-24">
                          <Image
                            src={selectedPokemon2.sprite || "/placeholder.svg"}
                            alt={selectedPokemon2.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <h3 className="font-bold capitalize">{selectedPokemon2.name}</h3>
                      </div>
                    </div>

                    <Button onClick={startBattle} disabled={isBattling} className="px-8">
                      {isBattling ? (
                        "Battling..."
                      ) : (
                        <>
                          <Swords className="h-4 w-4 mr-2" />
                          Start Battle
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Select two different Pokémon to battle</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
        {battleResult && (
          <CardFooter className="flex justify-center">
            <Button onClick={resetBattle} variant="outline">
              New Battle
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
