"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PlusCircle, Search, ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { addToTeam } from "@/lib/team-service"
import { useToast } from "@/hooks/use-toast"
import { getRandomAbilityForPokemon } from "@/lib/ability-system"
import { getTeam } from "@/lib/team-service"

interface Pokemon {
  name: string
  url: string
}

interface PokemonDetails {
  id: number
  name: string
  sprites: {
    front_default: string
    other: {
      "official-artwork": {
        front_default: string
      }
    }
  }
  types: {
    type: {
      name: string
    }
  }[]
}

export function PokemonList() {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([])
  const [pokemonDetails, setPokemonDetails] = useState<PokemonDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [offset, setOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [addingPokemon, setAddingPokemon] = useState<number | null>(null)
  const [teamIds, setTeamIds] = useState<number[]>([])
  const limit = 12
  const { toast } = useToast()

  useEffect(() => {
    // Load current team to check for duplicates
    const loadTeam = async () => {
      try {
        // Use the getTeam function from team-service instead of direct fetch
        const team = await getTeam()
        setTeamIds(team.map((p: any) => p.id))
      } catch (error) {
        console.error("Error loading team:", error)
        setTeamIds([])
      }
    }

    loadTeam()
  }, [])

  useEffect(() => {
    const fetchPokemon = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`)
        const data = await response.json()
        setPokemonList(data.results)
        setTotalCount(data.count)

        // Fetch details for each Pokemon
        const details = await Promise.all(
          data.results.map(async (pokemon: Pokemon) => {
            const res = await fetch(pokemon.url)
            return await res.json()
          }),
        )
        setPokemonDetails(details)
      } catch (error) {
        console.error("Error fetching Pokemon:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPokemon()
  }, [offset])

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setOffset(0)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchTerm.toLowerCase()}`)
      if (response.ok) {
        const data = await response.json()
        setPokemonDetails([data])
        setPokemonList([{ name: data.name, url: `https://pokeapi.co/api/v2/pokemon/${data.id}` }])
        setTotalCount(1)
      } else {
        toast({
          title: "Pokémon not found",
          description: "Try searching for a different Pokémon name or ID",
          variant: "destructive",
        })
        // Reset to first page if search fails
        setOffset(0)
      }
    } catch (error) {
      console.error("Error searching Pokemon:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetSearch = () => {
    setSearchTerm("")
    setOffset(0)
  }

  const handleAddToTeam = async (pokemon: PokemonDetails) => {
    // Check if Pokémon is already in team
    if (teamIds.includes(pokemon.id)) {
      toast({
        title: "Already in team",
        description: `${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} is already in your team.`,
        variant: "default",
      })
      return
    }

    setAddingPokemon(pokemon.id)
    try {
      // Generate a random ability for the Pokémon
      const ability = getRandomAbilityForPokemon(pokemon.types.map((t) => t.type.name))

      await addToTeam({
        id: pokemon.id,
        name: pokemon.name,
        sprite: pokemon.sprites.front_default,
        types: pokemon.types.map((t) => t.type.name),
        stats: {
          hp: 0,
          attack: 0,
          defense: 0,
          "special-attack": 0,
          "special-defense": 0,
          speed: 0,
        },
        moves: [],
        ability: {
          name: ability.name,
          description: ability.description,
        },
      })

      // Fetch full details to get moves and stats
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`)
      const fullData = await response.json()

      // Extract stats
      const stats = fullData.stats.reduce((acc: any, stat: any) => {
        acc[stat.stat.name] = stat.base_stat
        return acc
      }, {})

      // Extract 4 random moves
      const allMoves = fullData.moves.map((move: any) => move.move.name)
      const randomMoves = allMoves.sort(() => 0.5 - Math.random()).slice(0, 4)

      // Update the Pokemon with full details
      await addToTeam(
        {
          id: pokemon.id,
          name: pokemon.name,
          sprite: pokemon.sprites.front_default,
          types: pokemon.types.map((t) => t.type.name),
          stats,
          moves: randomMoves,
          ability: {
            name: ability.name,
            description: ability.description,
          },
        },
        true,
      )

      // Update local team IDs
      setTeamIds([...teamIds, pokemon.id])

      toast({
        title: "Added to team!",
        description: `${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} has been added to your team.`,
      })
    } catch (error: any) {
      toast({
        title: "Error adding to team",
        description: error.message || "Failed to add Pokémon to team",
        variant: "destructive",
      })
    } finally {
      setAddingPokemon(null)
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
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <div className="relative flex-1">
          <Input
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pr-10 border-indigo-200 focus:border-indigo-300"
          />
          <Button
            onClick={handleSearch}
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full text-indigo-600"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        {searchTerm && (
          <Button
            onClick={resetSearch}
            variant="outline"
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(limit)
            .fill(0)
            .map((_, index) => (
              <Card key={index} className="overflow-hidden border-indigo-100">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Skeleton className="h-4 w-24 mt-4" />
                    <div className="flex gap-2 mt-2">
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-center">
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {pokemonDetails.map((pokemon) => (
              <Card
                key={pokemon.id}
                className="overflow-hidden border-indigo-100 hover:border-indigo-300 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center">
                    <Link href={`/pokemon/${pokemon.id}`}>
                      <div className="relative h-24 w-24 mb-2 hover:scale-110 transition-transform">
                        <Image
                          src={pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default}
                          alt={pokemon.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    </Link>
                    <h3 className="font-semibold capitalize">{pokemon.name}</h3>
                    <p className="text-xs text-muted-foreground">#{pokemon.id.toString().padStart(3, "0")}</p>
                    <div className="flex gap-2 mt-2">
                      {pokemon.types.map((type) => (
                        <span
                          key={type.type.name}
                          className={`${getTypeColor(type.type.name)} text-white text-xs px-2 py-1 rounded-full capitalize`}
                        >
                          {type.type.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full ${
                      teamIds.includes(pokemon.id)
                        ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    }`}
                    onClick={() => handleAddToTeam(pokemon)}
                    disabled={addingPokemon === pokemon.id}
                  >
                    {addingPokemon === pokemon.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : teamIds.includes(pokemon.id) ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        In Team
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add to Team
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Showing {offset + 1}-{Math.min(offset + pokemonDetails.length, totalCount)} of {totalCount}
            </span>
            <Button
              variant="outline"
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= totalCount}
              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
