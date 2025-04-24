"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Swords, Shield, Zap, Brain, ArrowLeft } from "lucide-react"
import type { TeamMember } from "@/lib/types"
import { getTypeColor } from "@/lib/utils"
import { generateAITeam, getAIDecision } from "@/lib/ai-service"
import { calculateDamage, getEffectivenessMessage } from "@/lib/battle-utils"
import { AttackAnimation, EffectivenessIndicator, PokemonHitAnimation, CriticalHitIndicator } from "./battle-animations"

interface AIBattleProps {
  playerTeam: TeamMember[]
  playerName: string
  difficulty: "easy" | "medium" | "hard"
  onExitBattle: () => void
}

export default function AIBattle({ playerTeam, playerName, difficulty, onExitBattle }: AIBattleProps) {
  const [activePokemon, setActivePokemon] = useState<TeamMember | null>(null)
  const [aiPokemon, setAiPokemon] = useState<TeamMember | null>(null)
  const [aiTeam, setAiTeam] = useState<TeamMember[]>([])
  const [playerHP, setPlayerHP] = useState(100)
  const [aiHP, setAiHP] = useState(100)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [showAttackOptions, setShowAttackOptions] = useState(false)
  const [availablePokemon, setAvailablePokemon] = useState<TeamMember[]>([])
  const [defeatedPokemon, setDefeatedPokemon] = useState<TeamMember[]>([])
  const [aiDefeatedPokemon, setAiDefeatedPokemon] = useState<TeamMember[]>([])
  const [battleResult, setBattleResult] = useState<"win" | "lose" | null>(null)
  const [attackAnimation, setAttackAnimation] = useState<"none" | "player" | "ai">("none")
  const [currentAttackType, setCurrentAttackType] = useState<"normal" | "special" | null>(null)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [aiThinking, setAiThinking] = useState(false)
  const [battleStarted, setBattleStarted] = useState(false)
  const [effectiveness, setEffectiveness] = useState<number>(1)
  const [isCriticalHit, setIsCriticalHit] = useState<boolean>(false)
  const [showEffectivenessIndicator, setShowEffectivenessIndicator] = useState<boolean>(false)
  const [showCriticalHitIndicator, setShowCriticalHitIndicator] = useState<boolean>(false)
  const [hitPokemon, setHitPokemon] = useState<"none" | "player" | "ai">("none")

  const battleLogRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Initialize battle
  useEffect(() => {
    const initBattle = async () => {
      if (playerTeam && playerTeam.length > 0) {
        // Generate AI team based on difficulty
        const aiGeneratedTeam = await generateAITeam(difficulty, playerTeam)
        setAiTeam(aiGeneratedTeam)

        setAvailablePokemon([...playerTeam])
        setActivePokemon(playerTeam[0])
        setAiPokemon(aiGeneratedTeam[0])

        const playerMaxHP = playerTeam[0].stats.find((s) => s.stat.name === "hp")?.base_stat || 100
        const aiMaxHP = aiGeneratedTeam[0].stats.find((s) => s.stat.name === "hp")?.base_stat || 100

        setPlayerHP(playerMaxHP)
        setAiHP(aiMaxHP)

        setBattleLog([
          `Battle against AI (${difficulty} difficulty) has begun!`,
          `AI Trainer sends out ${aiGeneratedTeam[0].name}!`,
          `${playerName} sends out ${playerTeam[0].name}!`,
        ])

        setBattleStarted(true)
      } else {
        // Handle the case where playerTeam is undefined or empty
        console.error("Player team is undefined or empty")
        toast({
          title: "Error",
          description: "Unable to start battle. Player team is missing.",
          variant: "destructive",
        })
        onExitBattle()
      }
    }

    initBattle()
  }, [playerTeam, playerName, difficulty, onExitBattle, toast])

  // AI turn logic
  useEffect(() => {
    if (!isPlayerTurn && battleStarted && !isAnimating && !battleResult) {
      const aiTakeTurn = async () => {
        if (!aiPokemon || !activePokemon) return

        setAiThinking(true)

        // Add a delay to simulate AI thinking
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Get AI decision
        const decision = await getAIDecision(
          aiPokemon,
          activePokemon,
          aiHP,
          playerHP,
          aiTeam,
          aiDefeatedPokemon,
          difficulty,
        )

        setAiThinking(false)
        setIsAnimating(true)

        if (decision.action === "attack") {
          // AI attacks
          setAttackAnimation("ai")
          setCurrentAttackType(decision.attackType || "normal")

          // Get the attacker's primary type
          const attackerType = aiPokemon.types[0]?.type.name || "normal"

          // Calculate damage with type effectiveness
          const {
            damage,
            effectiveness: typeEffectiveness,
            isCritical,
          } = calculateDamage(aiPokemon, activePokemon, decision.attackType || "normal", attackerType)

          // Set effectiveness and critical hit state
          setEffectiveness(typeEffectiveness)
          setIsCriticalHit(isCritical)

          // Show effectiveness indicator if not neutral
          if (typeEffectiveness !== 1) {
            setShowEffectivenessIndicator(true)
            setTimeout(() => setShowEffectivenessIndicator(false), 1500)
          }

          // Show critical hit indicator if critical
          if (isCritical) {
            setShowCriticalHitIndicator(true)
            setTimeout(() => setShowCriticalHitIndicator(false), 1500)
          }

          // Set the hit pokemon for animation
          setHitPokemon("player")

          // Simulate attack animation
          setTimeout(() => {
            // Update HP
            const newPlayerHP = Math.max(0, playerHP - damage)
            setPlayerHP(newPlayerHP)

            // Add to battle log
            setBattleLog((prev) => [
              ...prev,
              `AI's ${aiPokemon.name} used ${decision.attackType === "normal" ? "a physical" : "a special"} attack and dealt ${damage} damage!`,
            ])

            // Add effectiveness message to battle log if not neutral
            if (typeEffectiveness !== 1) {
              setBattleLog((prev) => [...prev, getEffectivenessMessage(typeEffectiveness)])
            }

            // Add critical hit message to battle log if critical
            if (isCritical) {
              setBattleLog((prev) => [...prev, "A critical hit!"])
            }

            // Check if player's Pokémon fainted
            if (newPlayerHP <= 0) {
              setDefeatedPokemon((prev) => [...prev, activePokemon])

              // Check if all player's Pokémon are defeated
              if (defeatedPokemon.length + 1 >= playerTeam.length) {
                setBattleResult("lose")
                setBattleLog((prev) => [...prev, `All of your Pokémon have fainted! You lose!`])
              } else {
                // Find next available player Pokémon
                const nextPokemon = playerTeam.find((p) => !defeatedPokemon.includes(p) && p.id !== activePokemon.id)

                if (nextPokemon) {
                  setActivePokemon(nextPokemon)
                  setPlayerHP(nextPokemon.stats.find((s) => s.stat.name === "hp")?.base_stat || 100)
                  setBattleLog((prev) => [
                    ...prev,
                    `${activePokemon.name} fainted!`,
                    `${playerName} sends out ${nextPokemon.name}!`,
                  ])
                }
              }
            }

            setAttackAnimation("none")
            setCurrentAttackType(null)
            setHitPokemon("none")
            setIsAnimating(false)
            setIsPlayerTurn(true)
          }, 1500)
        } else if (decision.action === "switch" && decision.pokemonId) {
          // AI switches Pokémon
          const newPokemon = aiTeam.find((p) => p.id === Number(decision.pokemonId))

          if (newPokemon) {
            setTimeout(() => {
              setAiPokemon(newPokemon)
              setAiHP(newPokemon.stats.find((s) => s.stat.name === "hp")?.base_stat || 100)

              setBattleLog((prev) => [...prev, `AI withdrew ${aiPokemon.name}!`, `AI sends out ${newPokemon.name}!`])

              setIsAnimating(false)
              setIsPlayerTurn(true)
            }, 1000)
          }
        }
      }

      aiTakeTurn()
    }
  }, [
    isPlayerTurn,
    battleStarted,
    isAnimating,
    battleResult,
    aiPokemon,
    activePokemon,
    aiHP,
    playerHP,
    aiTeam,
    aiDefeatedPokemon,
    difficulty,
    defeatedPokemon,
    playerTeam,
    playerName,
  ])

  // Scroll to bottom of battle log when it updates
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight
    }
  }, [battleLog])

  const handleAttack = (attackType: "normal" | "special") => {
    if (!activePokemon || !aiPokemon || isAnimating || !isPlayerTurn) return

    setIsAnimating(true)
    setShowAttackOptions(false)
    setAttackAnimation("player")
    setCurrentAttackType(attackType)

    // Get the attacker's primary type
    const attackerType = activePokemon.types[0]?.type.name || "normal"

    // Calculate damage with type effectiveness
    const {
      damage,
      effectiveness: typeEffectiveness,
      isCritical,
    } = calculateDamage(activePokemon, aiPokemon, attackType, attackerType)

    // Set effectiveness and critical hit state
    setEffectiveness(typeEffectiveness)
    setIsCriticalHit(isCritical)

    // Show effectiveness indicator if not neutral
    if (typeEffectiveness !== 1) {
      setShowEffectivenessIndicator(true)
      setTimeout(() => setShowEffectivenessIndicator(false), 1500)
    }

    // Show critical hit indicator if critical
    if (isCritical) {
      setShowCriticalHitIndicator(true)
      setTimeout(() => setShowCriticalHitIndicator(false), 1500)
    }

    // Set the hit pokemon for animation
    setHitPokemon("ai")

    // Simulate attack animation
    setTimeout(() => {
      // Update HP
      const newAiHP = Math.max(0, aiHP - damage)
      setAiHP(newAiHP)

      // Add to battle log
      setBattleLog((prev) => [
        ...prev,
        `${activePokemon.name} used ${attackType === "normal" ? "a physical" : "a special"} attack and dealt ${damage} damage!`,
      ])

      // Add effectiveness message to battle log if not neutral
      if (typeEffectiveness !== 1) {
        setBattleLog((prev) => [...prev, getEffectivenessMessage(typeEffectiveness)])
      }

      // Add critical hit message to battle log if critical
      if (isCritical) {
        setBattleLog((prev) => [...prev, "A critical hit!"])
      }

      // Check if AI's Pokémon fainted
      if (newAiHP <= 0) {
        setAiDefeatedPokemon((prev) => [...prev, aiPokemon])

        // Check if all AI's Pokémon are defeated
        if (aiDefeatedPokemon.length + 1 >= aiTeam.length) {
          setBattleResult("win")
          setBattleLog((prev) => [...prev, `All of AI's Pokémon have fainted! You win!`])
        } else {
          // Find next available AI Pokémon
          const nextPokemon = aiTeam.find((p) => !aiDefeatedPokemon.includes(p) && p.id !== aiPokemon.id)

          if (nextPokemon) {
            setAiPokemon(nextPokemon)
            setAiHP(nextPokemon.stats.find((s) => s.stat.name === "hp")?.base_stat || 100)
            setBattleLog((prev) => [...prev, `AI's ${aiPokemon.name} fainted!`, `AI sends out ${nextPokemon.name}!`])
          }
        }
      }

      setAttackAnimation("none")
      setCurrentAttackType(null)
      setHitPokemon("none")
      setIsAnimating(false)

      // Switch to AI's turn if battle isn't over
      if (newAiHP > 0 && aiDefeatedPokemon.length + (newAiHP <= 0 ? 1 : 0) < aiTeam.length) {
        setIsPlayerTurn(false)
      }
    }, 1500)
  }

  const handleSwitch = (pokemon: TeamMember) => {
    if (isAnimating || !isPlayerTurn || pokemon.id === activePokemon?.id) return

    setIsAnimating(true)

    // Simulate switch animation
    setTimeout(() => {
      setActivePokemon(pokemon)
      setPlayerHP(pokemon.stats.find((s) => s.stat.name === "hp")?.base_stat || 100)

      setBattleLog((prev) => [
        ...prev,
        `${playerName} withdrew ${activePokemon?.name}!`,
        `${playerName} sends out ${pokemon.name}!`,
      ])

      setIsAnimating(false)
      setIsPlayerTurn(false)
    }, 1000)
  }

  // Calculate HP percentages
  const playerMaxHP = activePokemon?.stats.find((s) => s.stat.name === "hp")?.base_stat || 100
  const aiMaxHP = aiPokemon?.stats.find((s) => s.stat.name === "hp")?.base_stat || 100
  const playerHPPercent = Math.max(0, Math.min(100, (playerHP / playerMaxHP) * 100))
  const aiHPPercent = Math.max(0, Math.min(100, (aiHP / aiMaxHP) * 100))

  // Get HP color based on percentage
  const getHPColor = (percentage: number) => {
    if (percentage > 50) return "bg-green-500"
    if (percentage > 20) return "bg-yellow-500"
    return "bg-red-500"
  }

  // Get attack animation details
  const getAttackAnimationDetails = (type: "normal" | "special" | null) => {
    if (!type || !activePokemon) return { icon: "wind", color: "purple" }

    const pokemonType =
      attackAnimation === "player"
        ? activePokemon.types[0]?.type.name || "normal"
        : aiPokemon?.types[0]?.type.name || "normal"

    const getAttackAnimationDetails = (type: "normal" | "special" | null, pokemonType: string, effectiveness: number) => {
      if (!type) return { icon: "wind", color: "purple" }
      // Add logic to determine icon and color based on type, pokemonType, and effectiveness
      return { icon: "some-icon", color: "some-color" }
    }

    const { icon, color } = getAttackAnimationDetails(type, pokemonType, effectiveness)

    return { icon, color }
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
                <span className="text-6xl">🤖</span>
              </div>
            </div>
          )}
        </motion.div>

        <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          {battleResult === "win" ? "Victory!" : "Defeat!"}
        </h2>
        <div className="text-xl mb-8">
          {battleResult === "win"
            ? `Congratulations! You defeated the AI (${difficulty} difficulty)!`
            : `The AI (${difficulty} difficulty) has defeated you!`}
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
                <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=AI-${difficulty}`} />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">AI's Team</h3>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {aiTeam.map((pokemon) => (
                <div
                  key={pokemon.id}
                  className={`relative ${aiDefeatedPokemon.some((p) => p.id === pokemon.id) ? "opacity-50" : ""}`}
                >
                  <div className="relative bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full p-1">
                    <img src={pokemon.sprite || "/placeholder.svg"} alt={pokemon.name} className="w-16 h-16" />
                    {aiDefeatedPokemon.some((p) => p.id === pokemon.id) && (
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

        <div className="flex gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md blur-sm opacity-70 group-hover:opacity-100 transition-opacity"></div>
            <Button
              onClick={onExitBattle}
              className="relative bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none"
              size="lg"
            >
              Return to Lobby
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => {
                setBattleResult(null)
                setBattleStarted(false)
                setDefeatedPokemon([])
                setAiDefeatedPokemon([])
                setBattleLog([])
                setIsPlayerTurn(true)
                // Re-initialize the battle
                const initBattle = async () => {
                  const aiGeneratedTeam = await generateAITeam(difficulty, playerTeam)
                  setAiTeam(aiGeneratedTeam)

                  setAvailablePokemon([...playerTeam])
                  setActivePokemon(playerTeam[0])
                  setAiPokemon(aiGeneratedTeam[0])

                  const playerMaxHP = playerTeam[0].stats.find((s) => s.stat.name === "hp")?.base_stat || 100
                  const aiMaxHP = aiGeneratedTeam[0].stats.find((s) => s.stat.name === "hp")?.base_stat || 100

                  setPlayerHP(playerMaxHP)
                  setAiHP(aiMaxHP)

                  setBattleLog([
                    `Battle against AI (${difficulty} difficulty) has begun!`,
                    `AI Trainer sends out ${aiGeneratedTeam[0].name}!`,
                    `${playerName} sends out ${playerTeam[0].name}!`,
                  ])

                  setBattleStarted(true)
                }
                initBattle()
              }}
              variant="outline"
              size="lg"
            >
              Battle Again
            </Button>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  if (!battleStarted || !activePokemon || !aiPokemon) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p>Initializing battle...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onExitBattle} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Battle vs. AI ({difficulty})
          </h2>
        </div>
        <Badge
          variant={isPlayerTurn ? "default" : "outline"}
          className={isPlayerTurn ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none" : ""}
        >
          {isPlayerTurn ? "Your Turn" : "AI's Turn"}
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
            <div className="relative h-80 battle-arena-mobile bg-gradient-to-b from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg p-4 mb-4 overflow-hidden">
              {/* Battle background elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-200/50 to-transparent dark:from-green-900/20"></div>
                <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-blue-200/30 to-transparent dark:from-blue-900/10"></div>
                <div className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full bg-yellow-200/30 blur-xl dark:bg-yellow-500/10"></div>
                <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-purple-200/20 blur-xl dark:bg-purple-500/10"></div>
              </div>

              {/* AI Pokémon */}
              <div className="absolute top-4 left-4 right-4 z-10">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{aiPokemon?.name}</span>
                    <div className="flex gap-1">
                      {aiPokemon?.types.map((type) => (
                        <Badge
                          key={type.type.name}
                          style={{ backgroundColor: getTypeColor(type.type.name) }}
                          className="text-white text-xs type-badge"
                        >
                          {type.type.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm">
                    {aiHP}/{aiMaxHP}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden hp-bar-container">
                  <motion.div
                    className={`h-full ${getHPColor(aiHPPercent)} hp-bar`}
                    initial={{ width: `${aiHPPercent}%` }}
                    animate={{ width: `${aiHPPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Make the Pokémon sprites responsive */}
              <AnimatePresence>
                {aiPokemon && (
                  <motion.div
                    className="absolute top-12 right-8 z-10 sm:right-8 xs:right-4"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    key={aiPokemon.id}
                  >
                    <PokemonHitAnimation isHit={hitPokemon === "ai"} effectiveness={effectiveness}>
                      <motion.img
                        src={aiPokemon.sprite}
                        alt={aiPokemon.name}
                        className={`w-28 h-28 pokemon-sprite-mobile drop-shadow-md transform scale-x-[-1] ${
                          isCriticalHit && hitPokemon === "ai" ? "critical-hit" : ""
                        }`}
                      />
                    </PokemonHitAnimation>
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
                          className="text-white text-xs type-badge"
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
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden hp-bar-container">
                  <motion.div
                    className={`h-full ${getHPColor(playerHPPercent)} hp-bar`}
                    initial={{ width: `${playerHPPercent}%` }}
                    animate={{ width: `${playerHPPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <AnimatePresence>
                {activePokemon && (
                  <motion.div
                    className="absolute bottom-12 left-8 z-10 sm:left-8 xs:left-4"
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    key={activePokemon.id}
                  >
                    <PokemonHitAnimation isHit={hitPokemon === "player"} effectiveness={effectiveness}>
                      <motion.img
                        src={activePokemon.spriteBack || activePokemon.sprite}
                        alt={activePokemon.name}
                        className={`w-28 h-28 pokemon-sprite-mobile drop-shadow-md ${
                          isCriticalHit && hitPokemon === "player" ? "critical-hit" : ""
                        }`}
                      />
                    </PokemonHitAnimation>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Battle effects */}
              <AnimatePresence>
                {attackAnimation !== "none" && (
                  <AttackAnimation
                    type={getAttackAnimationDetails(currentAttackType).icon}
                    color={getAttackAnimationDetails(currentAttackType).color}
                    effectiveness={effectiveness}
                    direction={attackAnimation === "player" ? "right" : "left"}
                    onComplete={() => {
                      // Animation completed
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Effectiveness indicator */}
              <AnimatePresence>
                {showEffectivenessIndicator && <EffectivenessIndicator effectiveness={effectiveness} />}
              </AnimatePresence>

              {/* Critical hit indicator */}
              <AnimatePresence>
                {showCriticalHitIndicator && <CriticalHitIndicator isCritical={isCriticalHit} />}
              </AnimatePresence>

              {/* AI thinking indicator */}
              {aiThinking && (
                <div className="absolute top-4 right-4 z-30">
                  <div className="flex items-center gap-2 bg-background/80 p-2 rounded-md">
                    <Brain className="w-4 h-4 text-indigo-500 animate-pulse" />
                    <span className="text-xs">AI thinking...</span>
                  </div>
                </div>
              )}
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
                    className="grid grid-cols-2 gap-2 xs:grid-cols-1"
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
                        <Button
                          onClick={() => setShowAttackOptions(false)}
                          variant="outline"
                          className="col-span-2 xs:col-span-1"
                        >
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
                    <p className="text-muted-foreground mb-2">AI is making a move...</p>
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
              className="h-48 overflow-y-auto bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg p-3 space-y-2 text-sm battle-log-container"
            >
              {battleLog.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className={`p-2 rounded bg-background ${
                    log.includes("super effective")
                      ? "super-effective"
                      : log.includes("not very effective")
                        ? "not-effective"
                        : log.includes("no effect")
                          ? "no-effect"
                          : log.includes("critical hit")
                            ? "text-red-500 font-bold"
                            : ""
                  }`}
                >
                  {log}
                </motion.div>
              ))}
            </div>

            <h3 className="text-lg font-semibold mt-6 mb-3" id="switch-pokemon">
              Switch Pokémon
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {playerTeam
                .filter((p) => !defeatedPokemon.some((dp) => dp.id === p.id))
                .map((pokemon) => (
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
                      <div className="flex gap-1 mt-1">
                        {pokemon.types.map((type) => (
                          <Badge
                            key={type.type.name}
                            style={{ backgroundColor: getTypeColor(type.type.name) }}
                            className="text-white text-xs type-badge"
                            variant="outline"
                          >
                            {type.type.name}
                          </Badge>
                        ))}
                      </div>
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
                <span className="text-sm font-medium">AI ({difficulty})</span>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=AI-${difficulty}`} />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
