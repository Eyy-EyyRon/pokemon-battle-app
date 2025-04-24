"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Copy, Check, Share2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getTeam } from "@/lib/team-service"
import { generateInviteCode } from "@/lib/battle-service"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  moves?: string[]
}

export default function CreateBattlePage() {
  const [team, setTeam] = useState<Pokemon[]>([])
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadTeam = async () => {
      setIsLoading(true)
      try {
        const teamData = await getTeam()
        setTeam(teamData)
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

  const handleSelectPokemon = (pokemon: Pokemon) => {
    setSelectedPokemon(pokemon)
  }

  const createBattle = () => {
    if (!selectedPokemon) {
      toast({
        title: "Select a Pokémon",
        description: "Please select a Pokémon for battle.",
        variant: "destructive",
      })
      return
    }

    const code = generateInviteCode()
    setInviteCode(code)
  }

  const copyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    }
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

  if (isLoading) {
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

        <Card className="border-red-100">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Battle Arena</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p>Loading your team...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (team.length < 1) {
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

        <Card className="border-red-100">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Battle Arena</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p>You need at least 1 Pokémon in your team to battle.</p>
            <Link href="/">
              <Button className="mt-4 bg-red-600 hover:bg-red-700">Add Pokémon to Team</Button>
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
          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Pokédex
          </Button>
        </Link>
      </div>

      <Card className="border-red-100">
        <CardHeader>
          <CardTitle className="text-center text-red-600">Create a Battle</CardTitle>
        </CardHeader>
        <CardContent>
          {inviteCode ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-6 text-center">
                <h3 className="text-lg font-bold mb-2">Your Battle Invite Code</h3>
                <div className="flex items-center justify-center">
                  <div className="bg-red-50 text-red-600 text-2xl font-mono font-bold tracking-wider py-3 px-6 rounded-lg">
                    {inviteCode}
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Share this code with a friend to start a battle!</p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={copyInviteCode}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copied!" : "Copy Code"}
                </Button>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>

              <div className="mt-8 w-full max-w-md">
                <div className="border border-red-100 rounded-lg p-4">
                  <h3 className="font-bold mb-2">Your Selected Pokémon</h3>
                  {selectedPokemon && (
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 bg-red-50 rounded-full p-1">
                        <Image
                          src={selectedPokemon.sprite || "/placeholder.svg"}
                          alt={selectedPokemon.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium capitalize">{selectedPokemon.name}</h4>
                        <div className="flex gap-1 mt-1">
                          {selectedPokemon.types.map((type) => (
                            <span
                              key={type}
                              className={`${getTypeColor(type)} text-white text-xs px-1.5 py-0.5 rounded-full capitalize`}
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground mb-2">Waiting for opponent to join...</p>
                <Link href={`/battle/room/${inviteCode}`}>
                  <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                    Enter Battle Room
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="multiplayer">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger
                  value="multiplayer"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
                >
                  Multiplayer Battle
                </TabsTrigger>
                <TabsTrigger value="quick" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                  Quick Battle
                </TabsTrigger>
              </TabsList>

              <TabsContent value="multiplayer">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold mb-3 text-center">Select Your Pokémon</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {team.map((pokemon) => (
                        <div
                          key={pokemon.id}
                          className={`p-2 border rounded-lg cursor-pointer transition-all ${
                            selectedPokemon?.id === pokemon.id
                              ? "border-red-500 bg-red-50"
                              : "border-red-100 hover:bg-red-50"
                          }`}
                          onClick={() => handleSelectPokemon(pokemon)}
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

                  <div className="flex justify-center">
                    <Button
                      onClick={createBattle}
                      disabled={!selectedPokemon}
                      className="bg-red-600 hover:bg-red-700 px-8"
                    >
                      Create Battle
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="quick">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold mb-3 text-center">Select Your Pokémon</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {team.map((pokemon) => (
                        <div
                          key={pokemon.id}
                          className={`p-2 border rounded-lg cursor-pointer transition-all ${
                            selectedPokemon?.id === pokemon.id
                              ? "border-red-500 bg-red-50"
                              : "border-red-100 hover:bg-red-50"
                          }`}
                          onClick={() => handleSelectPokemon(pokemon)}
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

                  <div className="flex justify-center">
                    <Link href={selectedPokemon ? `/battle/quick/${selectedPokemon.id}` : "#"}>
                      <Button disabled={!selectedPokemon} className="bg-red-600 hover:bg-red-700 px-8">
                        Start Quick Battle
                      </Button>
                    </Link>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
