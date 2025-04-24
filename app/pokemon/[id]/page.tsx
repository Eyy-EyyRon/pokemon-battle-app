"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, PlusCircle, Heart } from "lucide-react"
import { addToTeam } from "@/lib/team-service"
import { useToast } from "@/hooks/use-toast"

interface PokemonDetails {
  id: number
  name: string
  height: number
  weight: number
  sprites: {
    front_default: string
    back_default: string
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
  stats: {
    base_stat: number
    stat: {
      name: string
    }
  }[]
  abilities: {
    ability: {
      name: string
    }
    is_hidden: boolean
  }[]
  species: {
    url: string
  }
}

interface Species {
  flavor_text_entries: {
    flavor_text: string
    language: {
      name: string
    }
  }[]
  genera: {
    genus: string
    language: {
      name: string
    }
  }[]
}

export default function PokemonDetail() {
  const params = useParams()
  const { id } = params
  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null)
  const [species, setSpecies] = useState<Species | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPokemonDetails = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
        const data = await response.json()
        setPokemon(data)

        // Fetch species data for description
        const speciesResponse = await fetch(data.species.url)
        const speciesData = await speciesResponse.json()
        setSpecies(speciesData)
      } catch (error) {
        console.error("Error fetching Pokemon details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPokemonDetails()
  }, [id])

  const handleAddToTeam = async () => {
    if (!pokemon) return

    // Find the HP stat
    const hpStat = pokemon.stats.find((stat) => stat.stat.name === "hp")
    const baseHp = hpStat ? hpStat.base_stat : 100 // Default to 100 if not found

    try {
      await addToTeam({
        id: pokemon.id,
        name: pokemon.name,
        sprite: pokemon.sprites.front_default,
        types: pokemon.types.map((t) => t.type.name),
        stats: {
          hp: baseHp,
          attack: pokemon.stats.find((stat) => stat.stat.name === "attack")?.base_stat || 0,
          defense: pokemon.stats.find((stat) => stat.stat.name === "defense")?.base_stat || 0,
          "special-attack": pokemon.stats.find((stat) => stat.stat.name === "special-attack")?.base_stat || 0,
          "special-defense": pokemon.stats.find((stat) => stat.stat.name === "special-defense")?.base_stat || 0,
          speed: pokemon.stats.find((stat) => stat.stat.name === "speed")?.base_stat || 0,
        },
        currentHp: baseHp, // Fixed: Set current HP to the base HP value
        ability:
          pokemon.abilities.length > 0
            ? {
                name: pokemon.abilities[0].ability.name,
                description: "A mysterious ability", // You might want to fetch this from an API
              }
            : undefined,
      })
      toast({
        title: "Added to team!",
        description: `${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} has been added to your team.`,
      })
    } catch (error: any) {
      toast({
        title: "Error adding to team",
        description: error.message,
        variant: "destructive",
      })
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

  const getDescription = () => {
    if (!species) return "Loading description..."

    const englishEntry = species.flavor_text_entries.find((entry) => entry.language.name === "en")

    return englishEntry ? englishEntry.flavor_text.replace(/\f/g, " ") : "No description available."
  }

  const getCategory = () => {
    if (!species) return ""

    const englishGenus = species.genera.find((genus) => genus.language.name === "en")

    return englishGenus ? englishGenus.genus : ""
  }

  const formatStatName = (name: string) => {
    switch (name) {
      case "hp":
        return "HP"
      case "attack":
        return "Attack"
      case "defense":
        return "Defense"
      case "special-attack":
        return "Sp. Atk"
      case "special-defense":
        return "Sp. Def"
      case "speed":
        return "Speed"
      default:
        return name
    }
  }

  if (isLoading || !pokemon) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Pokédex
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6 flex flex-col items-center">
                <Skeleton className="h-48 w-48 rounded-full" />
                <Skeleton className="h-8 w-40 mt-4" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Pokédex
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6 flex flex-col items-center">
              <div className="relative h-48 w-48 mb-4">
                <Image
                  src={pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default}
                  alt={pokemon.name}
                  fill
                  className="object-contain"
                />
              </div>

              <h1 className="text-2xl font-bold capitalize mb-1">{pokemon.name}</h1>
              <p className="text-muted-foreground mb-3">#{pokemon.id.toString().padStart(3, "0")}</p>

              <div className="flex gap-2 mb-4">
                {pokemon.types.map((type) => (
                  <span
                    key={type.type.name}
                    className={`${getTypeColor(type.type.name)} text-white px-3 py-1 rounded-full capitalize`}
                  >
                    {type.type.name}
                  </span>
                ))}
              </div>

              <div className="flex gap-2 w-full">
                <Button className="flex-1" onClick={handleAddToTeam}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add to Team
                </Button>
                <Button variant="outline" size="icon">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="about">
            <TabsList className="mb-4">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="stats">Base Stats</TabsTrigger>
              <TabsTrigger value="abilities">Abilities</TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p>{getDescription()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Category</h3>
                        <p>{getCategory()}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Height</h3>
                        <p>{(pokemon.height / 10).toFixed(1)} m</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Weight</h3>
                        <p>{(pokemon.weight / 10).toFixed(1)} kg</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {pokemon.stats.map((stat) => (
                      <div key={stat.stat.name}>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{formatStatName(stat.stat.name)}</span>
                          <span>{stat.base_stat}</span>
                        </div>
                        <Progress value={(stat.base_stat / 255) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="abilities">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {pokemon.abilities.map((ability, index) => (
                      <div key={index} className="p-3 rounded-lg bg-muted">
                        <h3 className="font-semibold capitalize mb-1">
                          {ability.ability.name.replace("-", " ")}
                          {ability.is_hidden && <span className="ml-2 text-xs text-muted-foreground">(Hidden)</span>}
                        </h3>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
