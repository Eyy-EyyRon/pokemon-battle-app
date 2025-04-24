"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Pokemon } from "@/lib/types"
import { getTypeColor } from "@/lib/utils"

interface PokemonDetailProps {
  pokemon: Pokemon
  onAddToTeam: (pokemon: Pokemon) => void
}

export default function PokemonDetail({ pokemon, onAddToTeam }: PokemonDetailProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="overflow-hidden">
        <CardContent className="p-6 text-center">
          <img
            src={pokemon.sprites.front_default || "/placeholder.svg"}
            alt={pokemon.name}
            className="w-48 h-48 mx-auto"
          />
          <h2 className="text-2xl font-bold capitalize mt-4">{pokemon.name}</h2>
          <p className="text-muted-foreground">#{pokemon.id}</p>

          <div className="flex justify-center gap-2 mt-4">
            {pokemon.types.map((type) => (
              <Badge
                key={type.type.name}
                style={{ backgroundColor: getTypeColor(type.type.name) }}
                className="text-white px-3 py-1 text-sm"
              >
                {type.type.name}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <p className="text-sm text-muted-foreground">Height</p>
              <p className="font-medium">{pokemon.height / 10} m</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Weight</p>
              <p className="font-medium">{pokemon.weight / 10} kg</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0 flex justify-center">
          <Button onClick={() => onAddToTeam(pokemon)}>Add to Team</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Stats</h3>
          <div className="space-y-4">
            {pokemon.stats.map((stat) => (
              <div key={stat.stat.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium capitalize">{stat.stat.name.replace("-", " ")}</span>
                  <span className="text-sm font-medium">{stat.base_stat}</span>
                </div>
                <Progress value={stat.base_stat} max={255} className="h-2" />
              </div>
            ))}
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-4">Abilities</h3>
          <div className="flex flex-wrap gap-2">
            {pokemon.abilities.map((ability) => (
              <Badge key={ability.ability.name} variant="outline" className="capitalize">
                {ability.ability.name.replace("-", " ")}
                {ability.is_hidden && " (Hidden)"}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
