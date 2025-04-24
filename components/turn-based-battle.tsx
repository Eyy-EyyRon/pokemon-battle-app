"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { useMultiplayer } from "@/context/multiplayer-context"
import { Swords, Shield, Zap, Flame, Droplet, Leaf, Wind } from "lucide-react"
import type { TeamMember, BattleState, BattleAction } from "@/lib/types"
import { getTypeColor } from "@/lib/utils"

interface TurnBasedBattleProps {
  playerTeam: TeamMember[]
  opponentTeam: TeamMember[]
  playerName: string
  opponentName: string
  battleState: BattleState
}

export default function TurnBasedBattle({
  playerTeam,
  opponentTeam,
  playerName,
  opponentName,
  battleState,
}: TurnBasedBattleProps) {
  const [activePokemon, setActivePokemon] = useState<TeamMember | null>(null)
  const [opponentPokemon, setOpponentPokemon] = useState<TeamMember | null>(null)
  const [playerHP, setPlayerHP] = useState(100)
  const [opponentHP, setOpponentHP] = useState(100)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [showAttackOptions, setShowAttackOptions] = useState(false)
  const [availablePokemon, setAvailablePokemon] = useState<TeamMember[]>([])
  const [defeatedPokemon, setDefeatedPokemon] = useState<TeamMember[]>([])
  const [opponentDefeatedPokemon, setOpponentDefeatedPokemon] = useState<TeamMember[]>([])
  const [battleResult, setBattleResult] = useState<"win" | "lose" | null>(null)
  const [attackAnimation, setAttackAnimation] = useState<"none" | "player" | "opponent">("none")
  const [currentAttackType, setCurrentAttackType] = useState<"normal" | "special" | null>(null)

  const battleLogRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const { performAction, isPlayerTurn } = useMultiplayer()

  // Initialize battle
  useEffect(() => {
    if (playerTeam.length > 0 && opponentTeam.length > 0) {
      setAvailablePokemon([...playerTeam])
      setActivePokemon(playerTeam[0])
      setOpponentPokemon(opponentTeam[0])

      const playerMaxHP = playerTeam[0].stats.find((s) => s.stat.name === "hp")?.base_stat || 100
      const opponentMaxHP = opponentTeam[0].stats.find((s) => s.stat.name === "hp")?.base_stat || 100

      setPlayerHP(playerMaxHP)
      setOpponentHP(opponentMaxHP)

      setBattleLog([`Battle between ${playerName} and ${opponentName} has begun!`])
    }
  }, [playerTeam, opponentTeam, playerName, opponentName])

  // Update battle state when it changes
  useEffect(() => {
    if (battleState) {
      // Update active Pokémon
      if (battleState.playerActivePokemon) {
        const pokemon = playerTeam.find((p) => p.id === battleState.playerActivePokemon)
        if (pokemon) setActivePokemon(pokemon)
      }

      if (battleState.opponentActivePokemon) {
        const pokemon = opponentTeam.find((p) => p.id === battleState.opponentActivePokemon)
        if (pokemon) setOpponentPokemon(pokemon)
      }

      // Update HP
      if (battleState.playerHP !== undefined) setPlayerHP(battleState.playerHP)
      if (battleState.opponentHP !== undefined) setOpponentHP(battleState.opponentHP)

      // Update battle log
      if (battleState.lastAction) {
        setBattleLog((prev) => [...prev, battleState.lastAction || ""])

        // Scroll to bottom of battle log
        if (battleLogRef.current) {
          setTimeout(() => {
            if (battleLogRef.current) {
              battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight
            }
          }, 100)
        }
      }

      // Update defeated Pokémon
      if (battleState.playerDefeatedPokemon) {
        const defeated = battleState.playerDefeatedPokemon
          .map((id) => playerTeam.find((p) => p.id === id))
          .filter(Boolean) as TeamMember[]
        setDefeatedPokemon(defeated)

        // Update available Pokémon
        const available = playerTeam.filter((p) => !battleState.playerDefeatedPokemon.includes(p.id))
        setAvailablePokemon(available)
      }

      if (battleState.opponentDefeatedPokemon) {
        const defeated = battleState.opponentDefeatedPokemon
          .map((id) => opponentTeam.find((p) => p.id === id))
          .filter(Boolean) as TeamMember[]
        setOpponentDefeatedPokemon(defeated)
      }

      // Check for battle end
      if (battleState.result) {
        setBattleResult(battleState.result === "player" ? "win" : "lose")
      }
    }
  }, [battleState, playerTeam, opponentTeam])

  const handleAttack = (attackType: "normal" | "special") => {
    if (!activePokemon || !opponentPokemon || isAnimating || !isPlayerTurn) return

    setIsAnimating(true)
    setShowAttackOptions(false)
    setAttackAnimation("player")
    setCurrentAttackType(attackType)

    const action: BattleAction = {
      type: "attack",
      attackType,
      pokemonId: activePokemon.id,
    }

    // Simulate attack animation
    setTimeout(() => {
      performAction(action)
      setAttackAnimation("none")
      setCurrentAttackType(null)
      setIsAnimating(false)
    }, 1500)
  }

  const handleSwitch = (pokemon: TeamMember) => {
    if (isAnimating || !isPlayerTurn) return

    setIsAnimating(true)

    const action: BattleAction = {
      type: "switch",
      pokemonId: pokemon.id,
    }

    performAction(action)

    // Simulate switch animation
    setTimeout(() => {
      setIsAnimating(false)
    }, 1000)
  }

  // Calculate HP percentages
  const playerMaxHP = activePokemon?.stats.find((s) => s.stat.name === "hp")?.base_stat || 100
  const opponentMaxHP = opponentPokemon?.stats.find((s) => s.stat.name === "hp")?.base_stat || 100
  const playerHPPercent = Math.max(0, Math.min(100, (playerHP / playerMaxHP) * 100))
  const opponentHPPercent = Math.max(0, Math.min(100, (opponentHP / opponentMaxHP) * 100))

  // Get HP color based on percentage
  const getHPColor = (percentage: number) => {
    if (percentage > 50) return "bg-green-500"
    if (percentage > 20) return "bg-yellow-500"
    return "bg-red-500"
  }

  // Get attack animation based on type
  const getAttackAnimation = (type: "normal" | "special" | null) => {
    if (!type) return null

    if (type === "normal") {
      return <Swords className="w-12 h-12 text-orange-500" />
    } else {
      // Get a special attack icon based on Pokémon type
      const pokemonType = activePokemon?.types[0]?.type.name || "normal"

      switch (pokemonType) {
        case "fire":
          return <Flame className="w-12 h-12 text-red-500" />
        case "water":
          return <Droplet className="w-12 h-12 text-blue-500" />
        case "grass":
          return <Leaf className="w-12 h-12 text-green-500" />
        case "electric":
          return <Zap className="w-12 h-12 text-yellow-500" />
        default:
          return <Wind className="w-12 h-12 text-purple-500" />
      }
    }
  }

  if (battleResult) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="mb-8"
        >
          {battleResult === "win" ? (
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <span className="text-6xl">🏆</span>
              </div>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-6xl">🥈</span>
              </div>
            </div>
          )}
        </motion.div>

        <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          {battleResult === "win" ? "Victory!" : "Defeat!"}
        </h2>
        <div className="text-xl mb-8">
          {battleResult === "win"
            ? `Congratulations! You defeated ${opponentName}!`
            : `${opponentName} has defeated you!`}
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${playerName}`} />
                <AvatarFallback>{playerName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{playerName}'s Team</h3>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {playerTeam.map((pokemon) => (
                <div
                  key={pokemon.id}
                  className={`relative ${defeatedPokemon.some((p) => p.id === pokemon.id) ? "opacity-50" : ""}`}
                >
                  <div className="relative bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full p-1">
                    <img src={pokemon.sprite || "/placeholder.svg"} alt={pokemon.name} className="w-16 h-16" />
                    {defeatedPokemon.some((p) => p.id === pokemon.id) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                        <span className="text-2xl">❌</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${opponentName}`} />
                <AvatarFallback>{opponentName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{opponentName}'s Team</h3>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {opponentTeam.map((pokemon) => (
                <div
                  key={pokemon.id}
                  className={`relative ${opponentDefeatedPokemon.some((p) => p.id === pokemon.id) ? "opacity-50" : ""}`}
                >
                  <div className="relative bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full p-1">
                    <img src={pokemon.sprite || "/placeholder.svg"} alt={pokemon.name} className="w-16 h-16" />
                    {opponentDefeatedPokemon.some((p) => p.id === pokemon.id) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                        <span className="text-2xl">❌</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md blur-sm opacity-70 group-hover:opacity-100 transition-opacity"></div>
          <Button
            onClick={() => window.location.reload()}
            className="relative bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none"
            size="lg"
          >
            Return to Lobby
          </Button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Battle: {playerName} vs {opponentName}
        </h2>
        <Badge
          variant={isPlayerTurn ? "default" : "outline"}
          className={isPlayerTurn ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none" : ""}
        >
          {isPlayerTurn ? "Your Turn" : `${opponentName}'s Turn`}
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Battle Arena */}
        <Card className="overflow-hidden border-indigo-200 dark:border-indigo-800/30">
          <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 pb-2">
            <CardTitle className="flex items-center">
              <Swords className="w-5 h-5 mr-2 text-indigo-500" /> Battle Arena
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative h-80 bg-gradient-to-b from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg p-4 mb-4 overflow-hidden">
              {/* Battle background elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-200/50 to-transparent dark:from-green-900/20"></div>
                <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-blue-200/30 to-transparent dark:from-blue-900/10"></div>
                <div className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full bg-yellow-200/30 blur-xl dark:bg-yellow-500/10"></div>
                <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-purple-200/20 blur-xl dark:bg-purple-500/10"></div>
              </div>

              {/* Opponent Pokémon */}
              <div className="absolute top-4 left-4 right-4 z-10">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{opponentPokemon?.name}</span>
                    <div className="flex gap-1">
                      {opponentPokemon?.types.map((type) => (
                        <Badge
                          key={type.type.name}
                          style={{ backgroundColor: getTypeColor(type.type.name) }}
                          className="text-white text-xs"
                        >
                          {type.type.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm">
                    {opponentHP}/{opponentMaxHP}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${getHPColor(opponentHPPercent)}`}
                    initial={{ width: `${opponentHPPercent}%` }}
                    animate={{ width: `${opponentHPPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <AnimatePresence>
                {opponentPokemon && (
                  <motion.div
                    className="absolute top-12 right-8 z-10"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    key={opponentPokemon.id}
                  >
                    <motion.div
                      animate={
                        attackAnimation === "player"
                          ? { x: [0, -10, 10, -10, 0], y: [0, -5, 5, -5, 0], rotate: [0, -5, 5, -5, 0] }
                          : {}
                      }
                      transition={{ duration: 0.5 }}
                    >
                      <motion.img
                        src={opponentPokemon.sprite}
                        alt={opponentPokemon.name}
                        className="w-28 h-28 drop-shadow-md transform scale-x-[-1]"
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Player Pokémon */}
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{activePokemon?.name}</span>
                    <div className="flex gap-1">
                      {activePokemon?.types.map((type) => (
                        <Badge
                          key={type.type.name}
                          style={{ backgroundColor: getTypeColor(type.type.name) }}
                          className="text-white text-xs"
                        >
                          {type.type.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm">
                    {playerHP}/{playerMaxHP}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${getHPColor(playerHPPercent)}`}
                    initial={{ width: `${playerHPPercent}%` }}
                    animate={{ width: `${playerHPPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <AnimatePresence>
                {activePokemon && (
                  <motion.div
                    className="absolute bottom-12 left-8 z-10"
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    key={activePokemon.id}
                  >
                    <motion.div
                      animate={
                        attackAnimation === "opponent"
                          ? { x: [0, 10, -10, 10, 0], y: [0, 5, -5, 5, 0], rotate: [0, 5, -5, 5, 0] }
                          : {}
                      }
                      transition={{ duration: 0.5 }}
                    >
                      <motion.img
                        src={activePokemon.spriteBack || activePokemon.sprite}
                        alt={activePokemon.name}
                        className="w-28 h-28 drop-shadow-md"
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Battle effects */}
              <AnimatePresence>
                {attackAnimation !== "none" && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center z-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="text-6xl"
                      animate={{
                        scale: [1, 1.5, 1],
                        rotate: [0, 15, -15, 0],
                        x: attackAnimation === "player" ? [0, 50] : [0, -50],
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      {getAttackAnimation(currentAttackType)}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Battle controls */}
            <div className="space-y-3">
              <AnimatePresence mode="wait">
                {isPlayerTurn ? (
                  <motion.div
                    key="player-controls"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-2 gap-2"
                  >
                    {showAttackOptions ? (
                      <>
                        <Button
                          onClick={() => handleAttack("normal")}
                          disabled={isAnimating || !isPlayerTurn}
                          className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 text-white border-none"
                        >
                          <Swords className="w-4 h-4 mr-2" />
                          <span>Physical Attack</span>
                          <span className="absolute right-2 top-1 text-xs opacity-70">
                            {activePokemon?.stats.find((s) => s.stat.name === "attack")?.base_stat}
                          </span>
                        </Button>
                        <Button
                          onClick={() => handleAttack("special")}
                          disabled={isAnimating || !isPlayerTurn}
                          className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 text-white border-none"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          <span>Special Attack</span>
                          <span className="absolute right-2 top-1 text-xs opacity-70">
                            {activePokemon?.stats.find((s) => s.stat.name === "special-attack")?.base_stat ||
                              activePokemon?.stats.find((s) => s.stat.name === "attack")?.base_stat}
                          </span>
                        </Button>
                        <Button onClick={() => setShowAttackOptions(false)} variant="outline" className="col-span-2">
                          Back
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => setShowAttackOptions(true)}
                          disabled={isAnimating || !isPlayerTurn}
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none"
                        >
                          <Swords className="w-4 h-4 mr-2" /> Attack
                        </Button>
                        <Button
                          variant="outline"
                          disabled={availablePokemon.length <= 1 || isAnimating || !isPlayerTurn}
                          onClick={() =>
                            document.getElementById("switch-pokemon")?.scrollIntoView({ behavior: "smooth" })
                          }
                        >
                          <Shield className="w-4 h-4 mr-2" /> Switch Pokémon
                        </Button>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="waiting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-4"
                  >
                    <p className="text-muted-foreground mb-2">Waiting for opponent's move...</p>
                    <div className="flex justify-center">
                      <div className="animate-pulse flex space-x-1">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animation-delay-200"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animation-delay-400"></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Battle Log */}
        <Card className="overflow-hidden border-indigo-200 dark:border-indigo-800/30">
          <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 pb-2">
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-indigo-500" /> Battle Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-3">Battle Log</h3>
            <div
              ref={battleLogRef}
              className="h-48 overflow-y-auto bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg p-3 space-y-2 text-sm"
            >
              {battleLog.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (battleLog.length - index - 1), duration: 0.3 }}
                  className="p-2 rounded bg-background"
                >
                  {log}
                </motion.div>
              ))}
            </div>

            <h3 className="text-lg font-semibold mt-6 mb-3" id="switch-pokemon">
              Switch Pokémon
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {availablePokemon.map((pokemon) => (
                <motion.div key={pokemon.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant={activePokemon?.id === pokemon.id ? "default" : "outline"}
                    className={`w-full h-auto py-2 px-3 flex flex-col items-center ${
                      activePokemon?.id === pokemon.id
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none"
                        : ""
                    }`}
                    onClick={() => handleSwitch(pokemon)}
                    disabled={activePokemon?.id === pokemon.id || isAnimating || !isPlayerTurn}
                  >
                    <img src={pokemon.sprite || "/placeholder.svg"} alt={pokemon.name} className="w-12 h-12" />
                    <span className="text-xs capitalize mt-1">{pokemon.name}</span>
                  </Button>
                </motion.div>
              ))}
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Defeated Pokémon</h4>
              <div className="flex flex-wrap gap-2">
                {defeatedPokemon.map((pokemon) => (
                  <div key={pokemon.id} className="opacity-50">
                    <div className="relative bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full p-1">
                      <img src={pokemon.sprite || "/placeholder.svg"} alt={pokemon.name} className="w-10 h-10" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs">✕</span>
                      </div>
                    </div>
                  </div>
                ))}
                {defeatedPokemon.length === 0 && (
                  <p className="text-xs text-muted-foreground">No defeated Pokémon yet</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${playerName}`} />
                  <AvatarFallback>{playerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{playerName}</span>
              </div>
              <span className="text-xs text-muted-foreground">VS</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{opponentName}</span>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${opponentName}`} />
                  <AvatarFallback>{opponentName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
