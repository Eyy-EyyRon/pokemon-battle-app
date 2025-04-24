"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getBattleHistory } from "@/lib/battle-service"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface BattleRecord {
  id: number
  winnerId: number
  winnerName: string
  loserId: number
  loserName: string
  date: string
  winnerSprite?: string
  loserSprite?: string
  battleType?: string
  turns?: number
  battleLog?: any[]
}

export default function BattleHistoryPage() {
  const [battles, setBattles] = useState<BattleRecord[]>([])
  const [filteredBattles, setFilteredBattles] = useState<BattleRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBattle, setSelectedBattle] = useState<BattleRecord | null>(null)

  useEffect(() => {
    const loadBattleHistory = async () => {
      setIsLoading(true)
      try {
        const history = await getBattleHistory()

        // Fetch sprites for each Pokemon in the battle history
        const historyWithSprites = await Promise.all(
          history.map(async (battle: BattleRecord) => {
            try {
              const winnerResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${battle.winnerId}`)
              const winnerData = await winnerResponse.json()

              const loserResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${battle.loserId}`)
              const loserData = await loserResponse.json()

              return {
                ...battle,
                winnerSprite: winnerData.sprites.front_default,
                loserSprite: loserData.sprites.front_default,
                battleType: battle.battleType || "Quick Battle",
                turns: battle.turns || Math.floor(Math.random() * 10) + 1,
              }
            } catch (error) {
              console.error("Error fetching Pokemon sprites:", error)
              return {
                ...battle,
                battleType: battle.battleType || "Quick Battle",
                turns: battle.turns || Math.floor(Math.random() * 10) + 1,
              }
            }
          }),
        )

        setBattles(historyWithSprites)
        setFilteredBattles(historyWithSprites)
      } catch (error) {
        console.error("Error loading battle history:", error)
        setBattles([])
        setFilteredBattles([])
      } finally {
        setIsLoading(false)
      }
    }

    loadBattleHistory()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const filterBattles = (type: string) => {
    if (type === "all") {
      setFilteredBattles(battles)
    } else {
      setFilteredBattles(battles.filter((battle) => battle.battleType === type))
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="border-red-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-red-600">Battle History</CardTitle>
              <Tabs defaultValue="all" onValueChange={filterBattles}>
                <TabsList>
                  <TabsTrigger value="all" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="Quick Battle"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
                  >
                    Quick
                  </TabsTrigger>
                  <TabsTrigger
                    value="Multiplayer"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
                  >
                    Multiplayer
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="py-3 border-b border-red-100 last:border-0">
                        <div className="flex justify-between items-center mb-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                          <Skeleton className="h-4 w-4" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-10 rounded-full" />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : filteredBattles.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No battles recorded yet.</p>
                  <Link href="/battle/create">
                    <Button className="bg-red-600 hover:bg-red-700">Start a Battle</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBattles.map((battle) => (
                    <div
                      key={battle.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedBattle?.id === battle.id ? "border-red-500 bg-red-50" : "border-red-100 hover:bg-red-50"
                      }`}
                      onClick={() => setSelectedBattle(battle)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-muted-foreground">{formatDate(battle.date)}</span>
                        <span className="text-xs font-medium bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          {battle.battleType}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {battle.winnerSprite && (
                            <div className="relative h-12 w-12 bg-red-50 rounded-full p-1">
                              <Image
                                src={battle.winnerSprite || "/placeholder.svg"}
                                alt={battle.winnerName}
                                fill
                                className="object-contain"
                              />
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium capitalize">{battle.winnerName}</h3>
                            <span className="text-xs text-green-600 font-medium">Winner</span>
                          </div>
                        </div>

                        <div className="text-sm font-bold">VS</div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <h3 className="font-medium capitalize">{battle.loserName}</h3>
                            <span className="text-xs text-muted-foreground">Defeated</span>
                          </div>
                          {battle.loserSprite && (
                            <div className="relative h-12 w-12 bg-gray-100 rounded-full p-1">
                              <Image
                                src={battle.loserSprite || "/placeholder.svg"}
                                alt={battle.loserName}
                                fill
                                className="object-contain grayscale opacity-75"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">Battle lasted {battle.turns} turns</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-red-100">
            <CardHeader>
              <CardTitle className="text-red-600">Battle Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedBattle ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="text-center">
                      <div className="relative h-24 w-24 mx-auto">
                        <Image
                          src={selectedBattle.winnerSprite || "/placeholder.svg"}
                          alt={selectedBattle.winnerName}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <h3 className="font-bold capitalize mt-2">{selectedBattle.winnerName}</h3>
                      <span className="inline-block mt-1 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">
                        Winner
                      </span>
                    </div>

                    <div className="text-xl font-bold">VS</div>

                    <div className="text-center">
                      <div className="relative h-24 w-24 mx-auto">
                        <Image
                          src={selectedBattle.loserSprite || "/placeholder.svg"}
                          alt={selectedBattle.loserName}
                          fill
                          className="object-contain grayscale opacity-75"
                        />
                      </div>
                      <h3 className="font-bold capitalize mt-2">{selectedBattle.loserName}</h3>
                      <span className="inline-block mt-1 bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full font-medium">
                        Defeated
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-red-100 pt-4">
                    <h3 className="font-bold mb-2">Battle Summary</h3>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Date</p>
                          <p>{formatDate(selectedBattle.date)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Battle Type</p>
                          <p>{selectedBattle.battleType}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Total Turns</p>
                          <p>{selectedBattle.turns}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Battle ID</p>
                          <p>#{selectedBattle.id}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedBattle.battleLog && selectedBattle.battleLog.length > 0 && (
                    <div className="border-t border-red-100 pt-4">
                      <h3 className="font-bold mb-2">Battle Log</h3>
                      <div className="bg-red-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                        {selectedBattle.battleLog.map((entry, index) => (
                          <div key={index} className="text-sm mb-2">
                            <span className="font-medium">Turn {entry.turn}:</span>{" "}
                            <span className="capitalize">{entry.attackerName}</span> used{" "}
                            <span className="font-medium">{entry.move}</span> and dealt{" "}
                            <span className="text-red-600 font-medium">{entry.damage} damage</span> to{" "}
                            <span className="capitalize">{entry.defenderName}</span>!
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Select a battle to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
