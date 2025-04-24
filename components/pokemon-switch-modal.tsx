"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { calculateHpPercentage } from "@/lib/battle-utils"
import Image from "next/image"
import { Flame, Zap, Skull, Droplets, AlertTriangle, Snowflake } from "lucide-react"

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
    duration: number
  } | null
  ability?: {
    name: string
    description: string
  }
}

interface PokemonSwitchModalProps {
  isOpen: boolean
  onClose: () => void
  team: Pokemon[]
  activePokemonId: number
  onSelectPokemon: (pokemon: Pokemon) => void
}

export function PokemonSwitchModal({
  isOpen,
  onClose,
  team,
  activePokemonId,
  onSelectPokemon,
}: PokemonSwitchModalProps) {
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
  const getStatusEffectIcon = (status: { type: string; duration: number } | null) => {
    if (!status) return null

    switch (status.type) {
      case "poison":
        return <Skull className="h-4 w-4 text-purple-500" />
      case "burn":
        return <Flame className="h-4 w-4 text-red-500" />
      case "paralysis":
        return <Zap className="h-4 w-4 text-yellow-500" />
      case "freeze":
        return <Snowflake className="h-4 w-4 text-blue-400" />
      case "sleep":
        return <Droplets className="h-4 w-4 text-blue-600" />
      case "confusion":
        return <AlertTriangle className="h-4 w-4 text-pink-500" />
      default:
        return null
    }
  }

  // Filter out fainted Pokémon for clarity
  const availablePokemon = team.filter((pokemon) => pokemon.id !== activePokemonId && (pokemon.currentHp || 0) > 0)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-indigo-700">Switch Pokémon</DialogTitle>
          <DialogDescription className="text-center text-sm text-gray-500">
            Select a Pokémon from your team to switch to the battle.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
          {team.map((pokemon) => {
            const isActive = pokemon.id === activePokemonId
            const isFainted = (pokemon.currentHp || 0) <= 0

            return (
              <div
                key={pokemon.id}
                className={`p-3 rounded-lg border transition-all ${
                  isActive
                    ? "border-indigo-300 bg-indigo-50"
                    : isFainted
                      ? "border-gray-200 bg-gray-50 opacity-60"
                      : "border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0">
                    <Image
                      src={pokemon.sprite || "/placeholder.svg"}
                      alt={pokemon.name}
                      fill
                      className={`object-contain ${isFainted ? "grayscale" : ""}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold capitalize">{pokemon.name}</h3>
                      <div className="flex gap-1">
                        {pokemon.types.map((type) => (
                          <span
                            key={type}
                            className={`${getTypeColor(type)} text-white text-xs px-1.5 py-0.5 rounded-full capitalize`}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span>
                          HP: {pokemon.currentHp} / {pokemon.stats?.hp}
                        </span>
                        {pokemon.status && (
                          <Badge variant="outline" className="bg-white/50 border-0 flex items-center gap-1 h-5">
                            {getStatusEffectIcon(pokemon.status)}
                            <span className="capitalize text-xs">{pokemon.status.type}d</span>
                          </Badge>
                        )}
                      </div>
                      <Progress
                        value={calculateHpPercentage(pokemon)}
                        className="h-2"
                        indicatorClassName={`${
                          calculateHpPercentage(pokemon) > 50
                            ? "bg-green-500"
                            : calculateHpPercentage(pokemon) > 20
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      />
                    </div>

                    {pokemon.ability && (
                      <div className="mt-1 text-xs text-gray-600">
                        <span className="font-medium">{pokemon.ability.name}</span>: {pokemon.ability.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  {isActive ? (
                    <Badge className="bg-indigo-600">Active</Badge>
                  ) : isFainted ? (
                    <Badge variant="outline" className="border-red-200 text-red-600">
                      Fainted
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        onSelectPokemon(pokemon)
                        onClose()
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      Select
                    </Button>
                  )}
                </div>
              </div>
            )
          })}

          {availablePokemon.length === 0 && !team.some((p) => p.id === activePokemonId && (p.currentHp || 0) > 0) && (
            <div className="p-4 text-center">
              <p className="text-red-600">All your Pokémon have fainted!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
