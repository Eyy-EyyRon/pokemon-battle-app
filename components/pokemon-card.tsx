"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlusCircle } from "lucide-react"
import type { Pokemon } from "@/lib/types"
import { getTypeColor } from "@/lib/utils"

interface PokemonCardProps {
  pokemon: Pokemon
  onSelect: (pokemon: Pokemon) => void
  onAddToTeam: (pokemon: Pokemon) => void
}

export default function PokemonCard({ pokemon, onSelect, onAddToTeam }: PokemonCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-indigo-100 dark:border-indigo-800/30 pokemon-card-hover">
      <CardContent className="p-4 text-center">
        <div className="cursor-pointer" onClick={() => onSelect(pokemon)}>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-md"></div>
            <motion.img
              src={pokemon.sprites.front_default || "/placeholder.svg"}
              alt={pokemon.name}
              className="w-32 h-32 mx-auto relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
          <h3 className="text-lg font-semibold capitalize mt-2">{pokemon.name}</h3>
          <p className="text-xs text-muted-foreground mb-2">#{pokemon.id}</p>
          <div className="flex justify-center gap-2 mt-2">
            {pokemon.types.map((type) => (
              <Badge
                key={type.type.name}
                style={{ backgroundColor: getTypeColor(type.type.name) }}
                className="text-white"
              >
                {type.type.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-center bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onAddToTeam(pokemon)
            }}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none"
          >
            <PlusCircle className="w-4 h-4 mr-2" /> Add to Team
          </Button>
        </motion.div>
      </CardFooter>
    </Card>
  )
}
