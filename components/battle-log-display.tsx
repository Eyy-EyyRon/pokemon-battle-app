import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface LogEntry {
  turn: number
  attackerId: number
  attackerName: string
  defenderId: number
  defenderName: string
  move: string
  moveType: string
  damage: number
  defenderHpAfter: number
  effectiveness?: number
  isCritical?: boolean
  missed?: boolean
  statusEffect?: {
    type: "poison" | "burn" | "paralysis" | "freeze" | "sleep" | "confusion"
    applied: boolean
  }
  statusDamage?: number
  weatherDamage?: number
  weatherEffect?: string
  switchInfo?: {
    fromPokemon: string
    toPokemon: string
  }
}

interface BattleLogDisplayProps {
  battleLog: LogEntry[]
}

export function BattleLogDisplay({ battleLog }: BattleLogDisplayProps) {
  const getMoveTypeColor = (type: string) => {
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

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      poison: "bg-purple-500",
      burn: "bg-red-500",
      paralysis: "bg-yellow-400",
      freeze: "bg-blue-300",
      sleep: "bg-gray-400",
      confusion: "bg-pink-400",
    }
    return statusColors[status] || "bg-gray-400"
  }

  const getWeatherColor = (weather: string) => {
    const weatherColors: Record<string, string> = {
      rain: "bg-blue-400",
      sun: "bg-yellow-500",
      sandstorm: "bg-yellow-700",
      hail: "bg-blue-200",
    }
    return weatherColors[weather] || "bg-gray-400"
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3">
        {battleLog.length === 0 ? (
          <p className="text-center text-gray-500 italic">The battle has just begun!</p>
        ) : (
          battleLog.map((entry, index) => (
            <div key={index} className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  Turn {entry.turn}
                </Badge>

                {entry.move && (
                  <Badge className={`${getMoveTypeColor(entry.moveType)} text-white`}>{entry.moveType}</Badge>
                )}
              </div>

              {/* Switch info */}
              {entry.switchInfo && (
                <p className="text-sm">
                  <span className="font-medium">{entry.attackerName === "You" ? "You" : "Opponent"}</span> switched from{" "}
                  <span className="font-medium capitalize">{entry.switchInfo.fromPokemon}</span> to{" "}
                  <span className="font-medium capitalize">{entry.switchInfo.toPokemon}</span>
                </p>
              )}

              {/* Weather effect */}
              {entry.weatherEffect && entry.weatherEffect !== "ended" && (
                <p className="text-sm">
                  <span className="font-medium capitalize">{entry.attackerName}</span> caused{" "}
                  <Badge className={`${getWeatherColor(entry.weatherEffect)} text-white`}>{entry.weatherEffect}</Badge>{" "}
                  weather!
                </p>
              )}

              {entry.weatherEffect === "ended" && <p className="text-sm">The weather has returned to normal.</p>}

              {/* Weather damage */}
              {entry.weatherDamage && entry.weatherDamage > 0 && (
                <p className="text-sm">
                  <span className="font-medium capitalize">{entry.defenderName}</span> was hurt by the{" "}
                  <Badge className={`${getWeatherColor(entry.weatherEffect || "")} text-white`}>
                    {entry.weatherEffect}
                  </Badge>{" "}
                  for <span className="font-medium text-red-600">{entry.weatherDamage}</span> damage!
                </p>
              )}

              {/* Status effect application */}
              {entry.statusEffect && entry.statusEffect.applied && (
                <p className="text-sm">
                  <span className="font-medium capitalize">{entry.defenderName}</span> was afflicted with{" "}
                  <Badge className={`${getStatusColor(entry.statusEffect.type)} text-white`}>
                    {entry.statusEffect.type}
                  </Badge>
                </p>
              )}

              {/* Status damage */}
              {entry.statusDamage && entry.statusDamage > 0 && (
                <p className="text-sm">
                  <span className="font-medium capitalize">{entry.defenderName}</span> was hurt by{" "}
                  <Badge className={`${getStatusColor(entry.statusEffect?.type || "")} text-white`}>
                    {entry.statusEffect?.type}
                  </Badge>{" "}
                  for <span className="font-medium text-red-600">{entry.statusDamage}</span> damage!
                </p>
              )}

              {/* Move execution */}
              {entry.move && !entry.missed && entry.damage > 0 && (
                <p className="text-sm">
                  <span className="font-medium capitalize">{entry.attackerName}</span> used{" "}
                  <span className="font-medium">{entry.move}</span> on{" "}
                  <span className="font-medium capitalize">{entry.defenderName}</span> for{" "}
                  <span className="font-medium text-red-600">{entry.damage}</span> damage!
                  {entry.effectiveness && entry.effectiveness > 1 && (
                    <span className="text-green-600 ml-1">It's super effective!</span>
                  )}
                  {entry.effectiveness && entry.effectiveness < 1 && entry.effectiveness > 0 && (
                    <span className="text-gray-500 ml-1">It's not very effective...</span>
                  )}
                  {entry.effectiveness === 0 && <span className="text-gray-500 ml-1">It has no effect...</span>}
                  {entry.isCritical && <span className="text-amber-600 ml-1">Critical hit!</span>}
                </p>
              )}

              {/* Move missed */}
              {entry.move && entry.missed && (
                <p className="text-sm">
                  <span className="font-medium capitalize">{entry.attackerName}</span> used{" "}
                  <span className="font-medium">{entry.move}</span> but it missed!
                </p>
              )}

              {/* HP remaining */}
              {entry.defenderHpAfter >= 0 && entry.damage > 0 && (
                <div className="mt-1 text-xs text-gray-500">
                  <span className="capitalize">{entry.defenderName}</span> HP: {entry.defenderHpAfter}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  )
}
