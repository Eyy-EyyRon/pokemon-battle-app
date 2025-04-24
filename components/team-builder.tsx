"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Shield, Swords, Zap } from "lucide-react"
import type { TeamMember } from "@/lib/types"
import { getTypeColor } from "@/lib/utils"

interface TeamBuilderProps {
  team: TeamMember[]
  onRemoveFromTeam: (pokemonId: number) => void
}

export default function TeamBuilder({ team, onRemoveFromTeam }: TeamBuilderProps) {
  if (team.length === 0) {
    return (
      <div className="text-center py-12">
        <motion.div
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Shield className="w-12 h-12 text-indigo-500/50" />
        </motion.div>
        <motion.h3
          className="text-xl font-medium mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Your team is empty
        </motion.h3>
        <motion.p
          className="text-muted-foreground mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Browse Pokémon and add them to your team!
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Button
            variant="outline"
            onClick={() => (window.location.hash = "#browse")}
            className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10"
          >
            Browse Pokémon
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            My Team ({team.length}/6)
          </h2>
          <p className="text-muted-foreground mt-1">Your battle-ready Pokémon squad</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
            <Shield className="w-4 h-4 mr-1" /> Team Builder
          </Badge>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {team.map((pokemon, index) => (
          <motion.div
            key={pokemon.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden hover:shadow-md transition-shadow border-indigo-100 dark:border-indigo-800/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-md"></div>
                    <motion.img
                      src={pokemon.sprite || "/placeholder.svg"}
                      alt={pokemon.name}
                      className="w-20 h-20 relative"
                      whileHover={{ scale: 1.2, rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold capitalize">{pokemon.name}</h3>
                    <div className="flex gap-2 mt-1">
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
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="destructive" size="icon" onClick={() => onRemoveFromTeam(pokemon.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                  <div className="text-center p-2 rounded-md bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
                    <div className="flex items-center justify-center gap-1 text-indigo-500 mb-1">
                      <Shield className="w-3 h-3" />
                      <p className="font-medium">HP</p>
                    </div>
                    <p>{pokemon.stats.find((s) => s.stat.name === "hp")?.base_stat}</p>
                  </div>
                  <div className="text-center p-2 rounded-md bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
                    <div className="flex items-center justify-center gap-1 text-indigo-500 mb-1">
                      <Swords className="w-3 h-3" />
                      <p className="font-medium">ATK</p>
                    </div>
                    <p>{pokemon.stats.find((s) => s.stat.name === "attack")?.base_stat}</p>
                  </div>
                  <div className="text-center p-2 rounded-md bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
                    <div className="flex items-center justify-center gap-1 text-indigo-500 mb-1">
                      <Zap className="w-3 h-3" />
                      <p className="font-medium">SPD</p>
                    </div>
                    <p>{pokemon.stats.find((s) => s.stat.name === "speed")?.base_stat}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: 6 - team.length }).map((_, index) => (
          <motion.div
            key={`empty-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: (team.length + index) * 0.1 }}
          >
            <Card className="border-dashed border-indigo-200/50 dark:border-indigo-800/30 h-[172px]">
              <CardContent className="p-4 h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 flex items-center justify-center mb-2">
                  <Shield className="w-8 h-8 text-indigo-500/30" />
                </div>
                <p className="text-muted-foreground">Empty slot</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
