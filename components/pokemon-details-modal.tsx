"use client"

import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Shield, Zap, Swords } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

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
  favorite?: boolean
  ability?: {
    name: string
    description: string
  }
}

interface PokemonDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  pokemon: Pokemon
}

export function PokemonDetailsModal({ isOpen, onClose, pokemon }: PokemonDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("stats")

  if (!isOpen) return null

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

  const getMoveTypeColor = (move: string) => {
    // Simplified mapping of moves to types
    const moveTypes: Record<string, string> = {
      Tackle: "normal",
      Scratch: "normal",
      "Quick Attack": "normal",
      Ember: "fire",
      Flamethrower: "fire",
      "Water Gun": "water",
      Surf: "water",
      "Razor Leaf": "grass",
      "Vine Whip": "grass",
      Thunderbolt: "electric",
      "Thunder Shock": "electric",
      Psychic: "psychic",
      Confusion: "psychic",
      "Shadow Ball": "ghost",
      "Ice Beam": "ice",
      "Poison Sting": "poison",
      Earthquake: "ground",
      "Rock Throw": "rock",
      "Dragon Claw": "dragon",
      "Aerial Ace": "flying",
      "Bug Bite": "bug",
      "Karate Chop": "fighting",
      "Iron Tail": "steel",
      "Fairy Wind": "fairy",
      Bite: "dark",
    }

    return getTypeColor(moveTypes[move] || "normal")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-indigo-700 capitalize">{pokemon.name} Details</DialogTitle>
          <DialogDescription>
            View detailed information about {pokemon.name}'s stats, moves, and abilities.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex flex-col items-center mb-4">
            <div className="relative h-32 w-32 bg-indigo-50 rounded-full p-4">
              <Image src={pokemon.sprite || "/placeholder.svg"} alt={pokemon.name} fill className="object-contain" />
            </div>

            <div className="mt-2 flex flex-col items-center">
              <div className="flex gap-1 mt-1">
                {pokemon.types.map((type) => (
                  <span
                    key={type}
                    className={`${getTypeColor(type)} text-white text-xs px-2 py-1 rounded-full capitalize`}
                  >
                    {type}
                  </span>
                ))}
              </div>

              <div className="mt-2">
                <Badge variant="outline" className="flex items-center gap-1 bg-indigo-50 border-indigo-100">
                  <Shield className="h-3 w-3" />
                  <span>{pokemon.ability?.name || "Unknown Ability"}</span>
                </Badge>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 mb-4">
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 ${activeTab === "stats" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500"}`}
                onClick={() => setActiveTab("stats")}
              >
                <Zap className="h-4 w-4 inline mr-1" />
                Stats
              </button>
              <button
                className={`px-4 py-2 ${activeTab === "moves" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500"}`}
                onClick={() => setActiveTab("moves")}
              >
                <Swords className="h-4 w-4 inline mr-1" />
                Moves
              </button>
              <button
                className={`px-4 py-2 ${activeTab === "ability" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500"}`}
                onClick={() => setActiveTab("ability")}
              >
                <Shield className="h-4 w-4 inline mr-1" />
                Ability
              </button>
            </div>
          </div>

          <div>
            {activeTab === "stats" && (
              <div className="space-y-4">
                {pokemon.stats ? (
                  <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
                    {Object.entries(pokemon.stats).map(([statName, value]) => (
                      <div key={statName} className="mb-3 last:mb-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium capitalize">{statName.replace("-", " ")}</span>
                          <span className="text-sm font-bold">{value}</span>
                        </div>
                        <Progress
                          value={(value / 255) * 100}
                          className="h-2"
                          indicatorClassName={
                            statName === "hp"
                              ? "bg-green-500"
                              : statName === "attack"
                                ? "bg-red-500"
                                : statName === "defense"
                                  ? "bg-blue-500"
                                  : statName === "special-attack"
                                    ? "bg-purple-500"
                                    : statName === "special-defense"
                                      ? "bg-teal-500"
                                      : "bg-yellow-500"
                          }
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">No stats available for this Pokémon</div>
                )}
              </div>
            )}

            {activeTab === "moves" && (
              <div className="max-h-[300px] overflow-y-auto">
                {pokemon.moves && pokemon.moves.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {pokemon.moves.map((move, index) => (
                      <div key={index} className="p-2 rounded-lg border border-indigo-100 bg-white flex items-center">
                        <div className={`w-3 h-3 rounded-full ${getMoveTypeColor(move)} mr-2`}></div>
                        <span className="text-sm capitalize">{move.replace("-", " ")}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">No moves available for this Pokémon</div>
                )}
              </div>
            )}

            {activeTab === "ability" && (
              <div>
                {pokemon.ability ? (
                  <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
                    <h3 className="font-bold text-indigo-700 mb-2">{pokemon.ability.name}</h3>
                    <p className="text-sm text-gray-700">{pokemon.ability.description}</p>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">No ability information available</div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
