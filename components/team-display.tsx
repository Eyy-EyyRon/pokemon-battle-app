"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Swords, Heart, GripVertical, Star, StarOff, Info } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getTeam, removeFromTeam, toggleFavorite, reorderTeam } from "@/lib/team-service"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { PokemonDetailsModal } from "@/components/pokemon-details-modal"

interface TeamPokemon {
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

export function TeamDisplay() {
  const [team, setTeam] = useState<TeamPokemon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPokemon, setSelectedPokemon] = useState<TeamPokemon | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadTeam = async () => {
      setIsLoading(true)
      try {
        const teamData = await getTeam()
        setTeam(teamData)
      } catch (error) {
        console.error("Error loading team:", error)
        setTeam([])
      } finally {
        setIsLoading(false)
      }
    }

    loadTeam()

    // Set up an interval to refresh the team data
    // Reduce the frequency to avoid too many requests
    const interval = setInterval(loadTeam, 10000) // Changed from 5000 to 10000
    return () => clearInterval(interval)
  }, [])

  const handleRemoveFromTeam = async (id: number) => {
    try {
      await removeFromTeam(id)
      setTeam(team.filter((pokemon) => pokemon.id !== id))
      toast({
        title: "Removed from team",
        description: "Pokémon has been removed from your team.",
      })
    } catch (error) {
      console.error("Error removing from team:", error)
      toast({
        title: "Error",
        description: "Failed to remove Pokémon from team.",
        variant: "destructive",
      })
    }
  }

  const handleToggleFavorite = async (id: number) => {
    try {
      await toggleFavorite(id)
      setTeam(team.map((pokemon) => (pokemon.id === id ? { ...pokemon, favorite: !pokemon.favorite } : pokemon)))

      const pokemon = team.find((p) => p.id === id)
      toast({
        title: pokemon?.favorite ? "Removed from favorites" : "Added to favorites",
        description: `${pokemon?.name} has been ${pokemon?.favorite ? "removed from" : "added to"} your favorites.`,
      })
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast({
        title: "Error",
        description: "Failed to update favorite status.",
        variant: "destructive",
      })
    }
  }

  const handleDragEnd = async (result: any) => {
    // Dropped outside the list
    if (!result.destination) {
      return
    }

    const startIndex = result.source.index
    const endIndex = result.destination.index

    // Reorder the team locally
    const reorderedTeam = Array.from(team)
    const [removed] = reorderedTeam.splice(startIndex, 1)
    reorderedTeam.splice(endIndex, 0, removed)

    setTeam(reorderedTeam)

    // Update the server
    try {
      await reorderTeam(startIndex, endIndex)
    } catch (error) {
      console.error("Error reordering team:", error)
      toast({
        title: "Error",
        description: "Failed to save team order.",
        variant: "destructive",
      })

      // Revert to original order if server update fails
      setTeam(team)
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

  const showPokemonDetails = (pokemon: TeamPokemon) => {
    setSelectedPokemon(pokemon)
    setIsDetailsModalOpen(true)
  }

  if (isLoading) {
    return (
      <Card className="border-indigo-100 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-indigo-700 flex items-center">
            <div className="w-6 h-6 bg-indigo-700 rounded-full mr-2 flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            Your Team
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700"></div>
          </div>
          <p className="text-center text-muted-foreground">Loading team...</p>
        </CardContent>
      </Card>
    )
  }

  if (team.length === 0) {
    return (
      <Card className="border-indigo-100 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-indigo-700 flex items-center">
            <div className="w-6 h-6 bg-indigo-700 rounded-full mr-2 flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            Your Team
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 bg-indigo-50/50 rounded-lg border border-indigo-100">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Image
                src="/pokeball-empty.svg"
                alt="Empty team"
                width={32}
                height={32}
                onError={(e) => {
                  // Fallback to inline SVG if the image fails to load
                  e.currentTarget.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23f2f2f2' stroke='%23cccccc' strokeWidth='5'/%3E%3Cpath d='M50 20 A30 30 0 0 1 80 50 L20 50 A30 30 0 0 1 50 20' fill='%23ff5555'/%3E%3Ccircle cx='50' cy='50' r='10' fill='white' stroke='%23cccccc' strokeWidth='3'/%3E%3C/svg%3E"
                }}
              />
            </div>
            <p className="text-center text-muted-foreground mb-2">Your team is empty.</p>
            <p className="text-center text-xs text-muted-foreground mb-4">Add Pokémon from the list below!</p>
            <p className="text-center text-xs text-muted-foreground">(Maximum 6 Pokémon allowed)</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-indigo-100 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-indigo-700 flex items-center">
          <div className="w-6 h-6 bg-indigo-700 rounded-full mr-2 flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
          Your Team
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="team-list">
            {(provided) => (
              <div className="space-y-3" {...provided.droppableProps} ref={provided.innerRef}>
                {team.map((pokemon, index) => (
                  <Draggable key={pokemon.id.toString()} draggableId={pokemon.id.toString()} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 transition-colors border border-indigo-100 shadow-sm"
                      >
                        <div {...provided.dragHandleProps} className="cursor-grab text-gray-400 hover:text-indigo-600">
                          <GripVertical className="h-5 w-5" />
                        </div>

                        <Link href={`/pokemon/${pokemon.id}`} className="flex-shrink-0">
                          <div className="relative h-12 w-12 bg-indigo-50 rounded-full">
                            <Image
                              src={pokemon.sprite || "/placeholder.svg"}
                              alt={pokemon.name}
                              fill
                              className="object-contain"
                            />
                            {pokemon.favorite && (
                              <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                                <Star className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium capitalize truncate">{pokemon.name}</h3>
                            <div className="flex gap-1">
                              {pokemon.types.map((type) => (
                                <span
                                  key={type}
                                  className={`${getTypeColor(type)} text-white text-xs px-1.5 py-0.5 rounded-full capitalize shadow-sm`}
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>

                          {pokemon.stats && (
                            <div className="mt-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-medium">HP:</span>
                                <span>{pokemon.stats.hp}</span>
                              </div>
                              <Progress
                                value={(pokemon.stats.hp / 255) * 100}
                                className="h-1.5 mt-0.5"
                                indicatorClassName="bg-green-500"
                              />
                            </div>
                          )}

                          {pokemon.ability && (
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs bg-indigo-50 border-indigo-100">
                                {pokemon.ability.name}
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
                            onClick={() => showPokemonDetails(pokemon)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-500 hover:text-amber-700 hover:bg-amber-100"
                            onClick={() => handleToggleFavorite(pokemon.id)}
                          >
                            {pokemon.favorite ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                            onClick={() => handleRemoveFromTeam(pokemon.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="mt-4 pt-4 border-t border-indigo-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{team.length}/6 Pokémon in team</p>
            <Badge className="bg-indigo-600">{team.filter((p) => p.favorite).length} Favorites</Badge>
          </div>

          {team.length >= 2 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Link href="/battle/create">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <Swords className="h-4 w-4 mr-2" />
                  Battle
                </Button>
              </Link>
              <Link href="/team/analyze">
                <Button variant="outline" className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                  <Heart className="h-4 w-4 mr-2" />
                  Team Analysis
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>

      {selectedPokemon && (
        <PokemonDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          pokemon={selectedPokemon}
        />
      )}
    </Card>
  )
}
