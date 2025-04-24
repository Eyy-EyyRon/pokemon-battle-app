"use client"

import { Badge } from "@/components/ui/badge"
import {
  Zap,
  Shield,
  Droplets,
  Flame,
  Skull,
  AlertTriangle,
  Snowflake,
  RefreshCw,
  Cloud,
  Sun,
  Wind,
} from "lucide-react"

interface BattleLogEntryProps {
  turn: number
  attackerName: string
  defenderName: string
  move: string
  moveType: string
  damage: number
  effectiveness?: number
  isCritical?: boolean
  missed?: boolean
  statusEffect?: {
    type: string
    applied: boolean
  }
  statusDamage?: number
  weatherDamage?: number
  weatherEffect?: string
  switched?: boolean
  switchedFrom?: string
  switchedTo?: string
}

export function BattleLogEntry({
  turn,
  attackerName,
  defenderName,
  move,
  moveType,
  damage,
  effectiveness,
  isCritical,
  missed,
  statusEffect,
  statusDamage,
  weatherDamage,
  weatherEffect,
  switched,
  switchedFrom,
  switchedTo,
}: BattleLogEntryProps) {
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

  const getStatusEffectIcon = (type: string) => {
    switch (type) {
      case "poison":
        return <Skull className="h-3 w-3 text-purple-500" />
      case "burn":
        return <Flame className="h-3 w-3 text-red-500" />
      case "paralysis":
        return <Zap className="h-3 w-3 text-yellow-500" />
      case "freeze":
        return <Snowflake className="h-3 w-3 text-blue-400" />
      case "sleep":
        return <Droplets className="h-3 w-3 text-blue-600" />
      case "confusion":
        return <AlertTriangle className="h-3 w-3 text-pink-500" />
      default:
        return <Shield className="h-3 w-3 text-gray-500" />
    }
  }

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case "rain":
        return <Cloud className="h-3 w-3 text-blue-500" />
      case "sun":
        return <Sun className="h-3 w-3 text-yellow-500" />
      case "sandstorm":
        return <Wind className="h-3 w-3 text-yellow-700" />
      case "hail":
        return <Snowflake className="h-3 w-3 text-blue-300" />
      default:
        return null
    }
  }

  // Weather effect entry
  if (weatherEffect) {
    if (weatherEffect === "ended") {
      return (
        <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-sm animate-slide-in-bottom">
          <div className="flex items-center gap-1 text-gray-600">
            <span className="font-medium">Turn {turn}:</span> The weather returned to normal.
          </div>
        </div>
      )
    }

    if (weatherDamage) {
      return (
        <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-sm animate-slide-in-bottom">
          <div className="flex items-center gap-1 text-gray-600">
            <span className="font-medium">Turn {turn}:</span>
            {getWeatherIcon(weatherEffect)}
            <span className="capitalize">{defenderName}</span> took{" "}
            <span className="text-red-600 font-medium">{weatherDamage} damage</span> from the{" "}
            <span className="capitalize">{weatherEffect}</span>!
          </div>
        </div>
      )
    }

    return (
      <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-sm animate-slide-in-bottom">
        <div className="flex items-center gap-1 text-gray-600">
          <span className="font-medium">Turn {turn}:</span>
          {getWeatherIcon(weatherEffect)}
          <span className="capitalize">{attackerName}</span> caused the weather to become{" "}
          <span className="capitalize font-medium">{weatherEffect}</span>!
        </div>
      </div>
    )
  }

  // Status effect entry
  if (statusEffect) {
    if (statusDamage) {
      return (
        <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-sm animate-slide-in-bottom">
          <div className="flex items-center gap-1 text-gray-600">
            <span className="font-medium">Turn {turn}:</span>
            {getStatusEffectIcon(statusEffect.type)}
            <span className="capitalize">{defenderName}</span> took{" "}
            <span className="text-red-600 font-medium">{statusDamage} damage</span> from{" "}
            <span className="capitalize">{statusEffect.type}</span>!
          </div>
        </div>
      )
    }

    if (statusEffect.applied) {
      return (
        <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-sm animate-slide-in-bottom">
          <div className="flex items-center gap-1 text-gray-600">
            <span className="font-medium">Turn {turn}:</span>
            {getStatusEffectIcon(statusEffect.type)}
            <span className="capitalize">{attackerName}</span> used{" "}
            <Badge className={`${getMoveTypeColor(moveType)} text-white text-xs px-1.5 py-0.5 rounded-full capitalize`}>
              {move}
            </Badge>{" "}
            and <span className="capitalize">{defenderName}</span> became{" "}
            <span className="capitalize font-medium">{statusEffect.type}d</span>!
          </div>
        </div>
      )
    } else {
      return (
        <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-sm animate-slide-in-bottom">
          <div className="flex items-center gap-1 text-gray-600">
            <span className="font-medium">Turn {turn}:</span>
            {getStatusEffectIcon(statusEffect.type)}
            <span className="capitalize">{defenderName}</span> is no longer{" "}
            <span className="capitalize">{statusEffect.type}d</span>!
          </div>
        </div>
      )
    }
  }

  // Switch Pokémon entry
  if (switched) {
    return (
      <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-sm animate-slide-in-bottom">
        <div className="flex items-center gap-1 text-gray-600">
          <span className="font-medium">Turn {turn}:</span>
          <RefreshCw className="h-3 w-3 text-indigo-500" />
          <span className="capitalize">{attackerName}</span> switched from{" "}
          <span className="font-medium capitalize">{switchedFrom}</span> to{" "}
          <span className="font-medium capitalize">{switchedTo}</span>!
        </div>
      </div>
    )
  }

  // Miss entry
  if (missed) {
    return (
      <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-sm animate-slide-in-bottom">
        <div className="flex items-center gap-1 text-gray-600">
          <span className="font-medium">Turn {turn}:</span>
          <span className="capitalize">{attackerName}</span> used{" "}
          <Badge className={`${getMoveTypeColor(moveType)} text-white text-xs px-1.5 py-0.5 rounded-full capitalize`}>
            {move}
          </Badge>{" "}
          but it missed!
        </div>
      </div>
    )
  }

  // Regular attack entry
  return (
    <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-sm animate-slide-in-bottom">
      <div className="flex items-center gap-1 text-gray-600">
        <span className="font-medium">Turn {turn}:</span>
        <span className="capitalize">{attackerName}</span> used{" "}
        <Badge className={`${getMoveTypeColor(moveType)} text-white text-xs px-1.5 py-0.5 rounded-full capitalize`}>
          {move}
        </Badge>
        {damage > 0 ? (
          <>
            {" "}
            and dealt <span className="text-red-600 font-medium">{damage} damage</span>
            {effectiveness && effectiveness > 1 && " (super effective)"}
            {effectiveness && effectiveness < 1 && effectiveness > 0 && " (not very effective)"}
            {effectiveness === 0 && " (no effect)"}
            {isCritical && " (critical hit)"}!
          </>
        ) : (
          "."
        )}
      </div>
    </div>
  )
}
