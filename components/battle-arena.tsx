"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import { BattleEffectMessage } from "@/components/battle-effect-message"
import { calculateHpPercentage } from "@/lib/battle-utils"
import { Badge } from "@/components/ui/badge"
import { Flame, Zap, Skull, Droplets, AlertTriangle, Snowflake, Cloud, Sun, Wind, Shield } from "lucide-react"

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
  currentHp?: number
  status?: {
    type: "poison" | "burn" | "paralysis" | "freeze" | "sleep" | "confusion"
  } | null
  ability?: {
    name: string
    description: string
  }
}

interface BattleArenaProps {
  playerPokemon: Pokemon
  opponentPokemon: Pokemon
  currentTurn: "player" | "opponent"
  battleAnimation: "idle" | "attack" | "damage" | "faint"
  winner: "player" | "opponent" | null
  effectMessage: {
    message: string
    type: "normal" | "effective" | "not-effective" | "critical" | "miss" | "immune"
  } | null
  battleType?: "quick" | "multiplayer"
  weather?: "rain" | "sun" | "sandstorm" | "hail" | null
}

export function BattleArena({
  playerPokemon,
  opponentPokemon,
  currentTurn,
  battleAnimation,
  winner,
  effectMessage,
  battleType = "quick",
  weather = null,
}: BattleArenaProps) {
  const [backgroundImage, setBackgroundImage] = useState("/battle-backgrounds/grass.jpg")
  const [arenaTheme, setArenaTheme] = useState<"forest" | "volcano" | "ocean" | "mountain" | "cave" | "electric">(
    "forest",
  )

  useEffect(() => {
    // Determine arena theme based on Pokémon types
    const allTypes = [...playerPokemon.types, ...opponentPokemon.types]
    const typeCounts: Record<string, number> = {}

    allTypes.forEach((type) => {
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })

    let dominantType = "grass" // default
    let maxCount = 0

    for (const [type, count] of Object.entries(typeCounts)) {
      if (count > maxCount) {
        maxCount = count
        dominantType = type
      }
    }

    // Map type to arena theme
    let theme: "forest" | "volcano" | "ocean" | "mountain" | "cave" | "electric" = "forest"

    if (["fire", "fighting"].includes(dominantType)) {
      theme = "volcano"
      setBackgroundImage("/battle-backgrounds/fire.jpg")
    } else if (["water", "ice"].includes(dominantType)) {
      theme = "ocean"
      setBackgroundImage("/battle-backgrounds/water.jpg")
    } else if (["rock", "ground"].includes(dominantType)) {
      theme = "mountain"
      setBackgroundImage("/battle-backgrounds/rock.jpg")
    } else if (["ghost", "dark", "poison"].includes(dominantType)) {
      theme = "cave"
      setBackgroundImage("/battle-backgrounds/ghost.jpg")
    } else if (["electric", "steel"].includes(dominantType)) {
      theme = "electric"
      setBackgroundImage("/battle-backgrounds/electric.jpg")
    } else {
      // Default to forest for grass, bug, normal, etc.
      theme = "forest"
      setBackgroundImage("/battle-backgrounds/grass.jpg")
    }

    setArenaTheme(theme)
  }, [playerPokemon.types, opponentPokemon.types])

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

  // Get status effect icon
  const getStatusEffectIcon = (status: { type: string; duration?: number } | null) => {
    if (!status) return null

    switch (status.type) {
      case "poison":
        return <Skull className="h-5 w-5 text-purple-500" />
      case "burn":
        return <Flame className="h-5 w-5 text-red-500" />
      case "paralysis":
        return <Zap className="h-5 w-5 text-yellow-500" />
      case "freeze":
        return <Snowflake className="h-5 w-5 text-blue-400" />
      case "sleep":
        return <Droplets className="h-5 w-5 text-blue-600" />
      case "confusion":
        return <AlertTriangle className="h-5 w-5 text-pink-500" />
      default:
        return null
    }
  }

  // Get weather icon and overlay
  const getWeatherOverlay = () => {
    if (!weather) return null

    switch (weather) {
      case "rain":
        return (
          <div className="absolute inset-0 bg-blue-500/10 pointer-events-none">
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                <Cloud className="h-4 w-4" /> Rain
              </Badge>
            </div>
            <div className="rain"></div>
          </div>
        )
      case "sun":
        return (
          <div className="absolute inset-0 bg-yellow-500/10 pointer-events-none">
            <div className="absolute top-2 right-2">
              <Badge
                variant="outline"
                className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1"
              >
                <Sun className="h-4 w-4" /> Sunny
              </Badge>
            </div>
            <div className="sun-rays"></div>
          </div>
        )
      case "sandstorm":
        return (
          <div className="absolute inset-0 bg-yellow-700/20 pointer-events-none">
            <div className="absolute top-2 right-2">
              <Badge
                variant="outline"
                className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1"
              >
                <Wind className="h-4 w-4" /> Sandstorm
              </Badge>
            </div>
            <div className="sandstorm"></div>
          </div>
        )
      case "hail":
        return (
          <div className="absolute inset-0 bg-blue-200/20 pointer-events-none">
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                <Snowflake className="h-4 w-4" /> Hail
              </Badge>
            </div>
            <div className="hail"></div>
          </div>
        )
      default:
        return null
    }
  }

  // Get theme-specific styles
  const getThemeStyles = () => {
    const themes = {
      forest: {
        platformBg: "bg-green-700/30",
        platformBorder: "border-green-600/30",
        textColor: "text-emerald-50",
        vsColor: "text-emerald-100",
        badgeBg: "bg-emerald-600",
      },
      volcano: {
        platformBg: "bg-red-700/30",
        platformBorder: "border-red-600/30",
        textColor: "text-red-50",
        vsColor: "text-red-100",
        badgeBg: "bg-red-600",
      },
      ocean: {
        platformBg: "bg-blue-700/30",
        platformBorder: "border-blue-600/30",
        textColor: "text-blue-50",
        vsColor: "text-blue-100",
        badgeBg: "bg-blue-600",
      },
      mountain: {
        platformBg: "bg-amber-700/30",
        platformBorder: "border-amber-600/30",
        textColor: "text-amber-50",
        vsColor: "text-amber-100",
        badgeBg: "bg-amber-600",
      },
      cave: {
        platformBg: "bg-purple-700/30",
        platformBorder: "border-purple-600/30",
        textColor: "text-purple-50",
        vsColor: "text-purple-100",
        badgeBg: "bg-purple-600",
      },
      electric: {
        platformBg: "bg-yellow-700/30",
        platformBorder: "border-yellow-600/30",
        textColor: "text-yellow-50",
        vsColor: "text-yellow-100",
        badgeBg: "bg-yellow-600",
      },
    }

    return themes[arenaTheme]
  }

  const themeStyles = getThemeStyles()

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>

      {/* Weather effects */}
      {getWeatherOverlay()}

      <div className="relative z-10 p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Opponent's Platform */}
          <div className="w-full md:w-1/2 order-2 md:order-1">
            <div
              className={`backdrop-blur-sm ${themeStyles.platformBg} rounded-xl p-4 relative shadow-lg border ${themeStyles.platformBorder}`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`${themeStyles.badgeBg} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold`}
                  >
                    {opponentPokemon.id % 100}
                  </div>
                  <h3 className={`font-bold capitalize ${themeStyles.textColor} drop-shadow-md`}>
                    {opponentPokemon.name}
                  </h3>

                  {/* Status effect badge */}
                  {opponentPokemon.status && (
                    <Badge variant="outline" className="bg-white/50 border-0 flex items-center gap-1">
                      {getStatusEffectIcon(opponentPokemon.status)}
                      <span className="capitalize">{opponentPokemon.status.type}d</span>
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  {opponentPokemon.types.map((type) => (
                    <span
                      key={type}
                      className={`${getTypeColor(type)} text-white text-xs px-1.5 py-0.5 rounded-full capitalize shadow-md`}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ability badge */}
              {opponentPokemon.ability && (
                <div className="mb-2">
                  <Badge variant="outline" className="bg-white/30 border-0 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span className="text-xs">{opponentPokemon.ability.name}</span>
                  </Badge>
                </div>
              )}

              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1 text-white font-medium">
                  <span>HP</span>
                  <span>
                    {opponentPokemon.currentHp} / {opponentPokemon.stats?.hp}
                  </span>
                </div>
                <Progress
                  value={calculateHpPercentage(opponentPokemon)}
                  className={`h-2 bg-gray-200/50 ${
                    calculateHpPercentage(opponentPokemon) > 50
                      ? "bg-green-500"
                      : calculateHpPercentage(opponentPokemon) > 20
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                />
              </div>

              <div className="relative h-32 w-32 mx-auto mt-4">
                <div className="absolute -bottom-4 w-24 h-6 bg-black/20 blur-md rounded-full left-1/2 transform -translate-x-1/2"></div>
                <Image
                  src={opponentPokemon.sprite || "/placeholder.svg"}
                  alt={opponentPokemon.name}
                  fill
                  className={`object-contain drop-shadow-lg scale-125 ${
                    battleAnimation === "damage" && currentTurn === "player" ? "animate-shake" : ""
                  } ${battleAnimation === "faint" && winner === "player" ? "animate-fade-out" : ""}`}
                />

                {/* Status effect visual */}
                {opponentPokemon.status && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {opponentPokemon.status.type === "poison" && (
                      <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-pulse"></div>
                    )}
                    {opponentPokemon.status.type === "burn" && (
                      <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse"></div>
                    )}
                    {opponentPokemon.status.type === "paralysis" && (
                      <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-pulse"></div>
                    )}
                    {opponentPokemon.status.type === "freeze" && (
                      <div className="absolute inset-0 bg-blue-400/30 rounded-full"></div>
                    )}
                    {opponentPokemon.status.type === "sleep" && (
                      <div className="absolute top-0 right-0">
                        <div className="text-2xl animate-bounce">💤</div>
                      </div>
                    )}
                    {opponentPokemon.status.type === "confusion" && (
                      <div className="absolute top-0 right-0">
                        <div className="text-2xl animate-spin">💫</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Turn indicator */}
              {currentTurn === "opponent" && (
                <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
                  <div className="animate-pulse bg-amber-600 text-white p-1 rounded-r-lg shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* Effect message overlay */}
              {effectMessage && currentTurn === "player" && (
                <BattleEffectMessage message={effectMessage.message} type={effectMessage.type} onComplete={() => {}} />
              )}
            </div>
          </div>

          <div className={`text-xl font-bold my-4 order-1 md:order-2 ${themeStyles.vsColor} drop-shadow-lg`}>VS</div>

          {/* Player's Platform */}
          <div className="w-full md:w-1/2 order-3">
            <div
              className={`backdrop-blur-sm ${themeStyles.platformBg} rounded-xl p-4 relative shadow-lg border ${themeStyles.platformBorder}`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`${themeStyles.badgeBg} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold`}
                  >
                    {playerPokemon.id % 100}
                  </div>
                  <h3 className={`font-bold capitalize ${themeStyles.textColor} drop-shadow-md`}>
                    {playerPokemon.name}
                  </h3>

                  {/* Status effect badge */}
                  {playerPokemon.status && (
                    <Badge variant="outline" className="bg-white/50 border-0 flex items-center gap-1">
                      {getStatusEffectIcon(playerPokemon.status)}
                      <span className="capitalize">{playerPokemon.status.type}d</span>
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  {playerPokemon.types.map((type) => (
                    <span
                      key={type}
                      className={`${getTypeColor(type)} text-white text-xs px-1.5 py-0.5 rounded-full capitalize shadow-md`}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ability badge */}
              {playerPokemon.ability && (
                <div className="mb-2">
                  <Badge variant="outline" className="bg-white/30 border-0 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span className="text-xs">{playerPokemon.ability.name}</span>
                  </Badge>
                </div>
              )}

              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1 text-white font-medium">
                  <span>HP</span>
                  <span>
                    {playerPokemon.currentHp} / {playerPokemon.stats?.hp}
                  </span>
                </div>
                <Progress
                  value={calculateHpPercentage(playerPokemon)}
                  className={`h-2 bg-gray-200/50 ${
                    calculateHpPercentage(playerPokemon) > 50
                      ? "bg-green-500"
                      : calculateHpPercentage(playerPokemon) > 20
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                />
              </div>

              <div className="relative h-32 w-32 mx-auto mt-4">
                <div className="absolute -bottom-4 w-24 h-6 bg-black/20 blur-md rounded-full left-1/2 transform -translate-x-1/2"></div>
                <Image
                  src={playerPokemon.sprite || "/placeholder.svg"}
                  alt={playerPokemon.name}
                  fill
                  className={`object-contain drop-shadow-lg scale-125 ${
                    battleAnimation === "attack" && currentTurn === "player" ? "animate-bounce" : ""
                  } ${battleAnimation === "damage" && currentTurn === "opponent" ? "animate-shake" : ""} ${
                    battleAnimation === "faint" && winner === "opponent" ? "animate-fade-out" : ""
                  }`}
                />

                {/* Status effect visual */}
                {playerPokemon.status && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {playerPokemon.status.type === "poison" && (
                      <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-pulse"></div>
                    )}
                    {playerPokemon.status.type === "burn" && (
                      <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse"></div>
                    )}
                    {playerPokemon.status.type === "paralysis" && (
                      <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-pulse"></div>
                    )}
                    {playerPokemon.status.type === "freeze" && (
                      <div className="absolute inset-0 bg-blue-400/30 rounded-full"></div>
                    )}
                    {playerPokemon.status.type === "sleep" && (
                      <div className="absolute top-0 right-0">
                        <div className="text-2xl animate-bounce">💤</div>
                      </div>
                    )}
                    {playerPokemon.status.type === "confusion" && (
                      <div className="absolute top-0 right-0">
                        <div className="text-2xl animate-spin">💫</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Turn indicator */}
              {currentTurn === "player" && (
                <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                  <div className="animate-pulse bg-emerald-600 text-white p-1 rounded-l-lg shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* Effect message overlay */}
              {effectMessage && currentTurn === "opponent" && (
                <BattleEffectMessage message={effectMessage.message} type={effectMessage.type} onComplete={() => {}} />
              )}
            </div>
          </div>
        </div>

        {/* Battle type badge */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
          <div className={`${themeStyles.badgeBg} text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg`}>
            {battleType === "multiplayer" ? "Multiplayer Battle" : "Quick Battle"}
          </div>
        </div>
      </div>
    </div>
  )
}
