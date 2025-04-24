"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getBattleHistory } from "@/lib/battle-service"
import { Skeleton } from "@/components/ui/skeleton"

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
}

interface BattleHistoryProps {
  limit?: number
  compact?: boolean
}

export function BattleHistory({ limit, compact = false }: BattleHistoryProps) {
  const [battles, setBattles] = useState<BattleRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadBattleHistory = async () => {
      setIsLoading(true)
      try {
        let history = await getBattleHistory()

        // Apply limit if specified
        if (limit && history.length > limit) {
          history = history.slice(0, limit)
        }

        // Fetch sprites for each Pokemon in the battle history
        const historyWithSprites = await Promise.all(
          history.map(async (battle: BattleRecord) => {
            try {
              // Add a timeout to the fetch requests
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 2000)

              const winnerResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${battle.winnerId}`, {
                signal: controller.signal,
              })
              clearTimeout(timeoutId)

              if (!winnerResponse.ok) {
                throw new Error(`Failed to fetch winner data for ID ${battle.winnerId}`)
              }

              const winnerData = await winnerResponse.json()

              const controller2 = new AbortController()
              const timeoutId2 = setTimeout(() => controller2.abort(), 2000)

              const loserResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${battle.loserId}`, {
                signal: controller2.signal,
              })
              clearTimeout(timeoutId2)

              if (!loserResponse.ok) {
                throw new Error(`Failed to fetch loser data for ID ${battle.loserId}`)
              }

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
      } catch (error) {
        console.error("Error loading battle history:", error)
        setBattles([])
      } finally {
        setIsLoading(false)
      }
    }

    loadBattleHistory()
  }, [limit])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: compact ? undefined : "2-digit",
      minute: compact ? undefined : "2-digit",
    }).format(date)
  }

  if (isLoading) {
    return (
      <Card className="border-red-100">
        <CardContent className="p-4">
          {Array(limit || 3)
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
        </CardContent>
      </Card>
    )
  }

  if (battles.length === 0) {
    return (
      <Card className="border-red-100">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No battles recorded yet.</p>
          <div className="flex justify-center mt-4">
            <Link href="/battle/create">
              <Button className="bg-red-600 hover:bg-red-700">Start a Battle</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-red-100">
      <CardContent className="p-4">
        <div className="space-y-1">
          {battles.map((battle) => (
            <div key={battle.id} className="py-3 border-b border-red-100 last:border-0">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">{formatDate(battle.date)}</span>
                {!compact && (
                  <span className="text-xs font-medium bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    {battle.battleType}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {battle.winnerSprite && (
                    <div className="relative h-10 w-10 bg-red-50 rounded-full p-1">
                      <Image
                        src={battle.winnerSprite || "/placeholder.svg"}
                        alt={battle.winnerName}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium capitalize text-sm">{battle.winnerName}</h3>
                    <span className="text-xs text-green-600 font-medium">Winner</span>
                  </div>
                </div>

                {!compact && <div className="text-xs font-bold">VS</div>}

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <h3 className="font-medium capitalize text-sm">{battle.loserName}</h3>
                    <span className="text-xs text-muted-foreground">Defeated</span>
                  </div>
                  {battle.loserSprite && (
                    <div className="relative h-10 w-10 bg-gray-100 rounded-full p-1">
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

              {!compact && <div className="mt-2 text-xs text-muted-foreground">Battle lasted {battle.turns} turns</div>}
            </div>
          ))}
        </div>

        {limit && battles.length >= limit && (
          <div className="mt-4 text-center">
            <Link href="/battles">
              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                View All Battles
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
