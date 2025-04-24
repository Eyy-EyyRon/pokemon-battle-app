"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Swords, Volume2, VolumeX } from "lucide-react"
import Link from "next/link"
import { getTeam } from "@/lib/team-service"
import { updateInviteCodeStatus, saveBattleResult } from "@/lib/battle-service"
import { useToast } from "@/hooks/use-toast"
import { useSound } from "@/components/sound-manager"
import { BattleArena } from "@/components/battle-arena"
import { BattleControls } from "@/components/battle-controls"
import { BattleLogDisplay } from "@/components/battle-log-display"
import { BattleSummary } from "@/components/battle-summary"
import { PokemonSwitchModal } from "@/components/pokemon-switch-modal"
import {
  calculateTypeEffectiveness,
  getEffectivenessMessage,
  getMoveType,
  getMovePower,
  getMoveAccuracy,
  getMoveSoundEffect,
  isCriticalHit,
  moveMisses,
  generateMovesForPokemon,
} from "@/lib/battle-utils"

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
  currentHp?: number
}

interface BattleMove {
  name: string
  type: string
  power: number
  accuracy: number
}

interface LogEntry {
  turn: number
  attackerId: number
  attackerName: string
  defenderId: number
  defenderName: string
  move: string
  moveType: string
  damage: number
  defenderHpAfter: number
  effectiveness?: number
  isCritical?: boolean
  missed?: boolean
  switched?: boolean
  switchedFrom?: string
  switchedTo?: string
}

export default function BattleRoomPage() {
  const params = useParams()
  const { code } = params
  const router = useRouter()
  const { toast } = useToast()
  const { playSound, playBattleMusic, stopBattleMusic, playVictoryMusic, playDefeatMusic, toggleMute, isMuted } =
    useSound()

  const [team, setTeam] = useState<Pokemon[]>([])
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)
  const [opponentPokemon, setOpponentPokemon] = useState<Pokemon | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [battleState, setBattleState] = useState<"waiting" | "selecting" | "battling" | "finished">("waiting")
  const [currentTurn, setCurrentTurn] = useState<"player" | "opponent">("player")
  const [availableMoves, setAvailableMoves] = useState<BattleMove[]>([])
  const [battleLog, setBattleLog] = useState<LogEntry[]>([])
  const [turnNumber, setTurnNumber] = useState(1)
  const [battleAnimation, setBattleAnimation] = useState<"idle" | "attack" | "damage" | "faint">("idle")
  const [winner, setWinner] = useState<"player" | "opponent" | null>(null)
  const [effectMessage, setEffectMessage] = useState<{
    message: string
    type: "normal" | "effective" | "not-effective" | "critical" | "miss" | "immune"
  } | null>(null)
  const [isOpponentTurnInProgress, setIsOpponentTurnInProgress] = useState(false)
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false)

  useEffect(() => {
    const loadTeam = async () => {
      setIsLoading(true)
      try {
        const teamData = await getTeam()

        // Ensure each Pokémon has currentHp set
        const teamWithHp = teamData.map((pokemon) => ({
          ...pokemon,
          currentHp: pokemon.currentHp || pokemon.stats?.hp || 100,
        }))

        setTeam(teamWithHp)

        // For demo purposes, we'll simulate an opponent joining after a delay
        setTimeout(() => {
          setBattleState("selecting")
        }, 2000)
      } catch (error) {
        console.error("Error loading team:", error)
        toast({
          title: "Error",
          description: "Failed to load your team. Please try again.",
          variant: "destructive",
        })

        // Fallback to empty team if there's an error
        setTeam([])
      } finally {
        setIsLoading(false)
      }
    }

    loadTeam()
    playBattleMusic()

    // Update the invite code status
    if (typeof code === "string") {
      try {
        updateInviteCodeStatus(code, "active")
      } catch (err) {
        console.warn("Failed to update invite code status:", err)
      }
    }

    // Cleanup function
    return () => {
      stopBattleMusic()
      if (typeof code === "string") {
        try {
          updateInviteCodeStatus(code, "completed")
        } catch (err) {
          console.warn("Failed to update invite code status:", err)
        }
      }
    }
  }, [code, toast, playBattleMusic, stopBattleMusic])

  const handleSelectPokemon = (pokemon: Pokemon) => {
    // Add currentHp to the pokemon if not already set
    const pokemonWithHp = {
      ...pokemon,
      currentHp: pokemon.currentHp || pokemon.stats?.hp || 100,
    }
    setSelectedPokemon(pokemonWithHp)

    // For demo purposes, simulate opponent selecting a pokemon
    setTimeout(() => {
      // Select a random pokemon from the team that's different from the player's
      const availablePokemon = team.filter((p) => p.id !== pokemon.id)
      if (availablePokemon.length > 0) {
        const randomPokemon = availablePokemon[Math.floor(Math.random() * availablePokemon.length)]
        const opponentWithHp = {
          ...randomPokemon,
          currentHp: randomPokemon.currentHp || randomPokemon.stats?.hp || 100,
        }
        setOpponentPokemon(opponentWithHp)

        // Generate moves for the battle
        generateMoves(pokemon)

        // Start the battle
        setBattleState("battling")

        // Determine who goes first based on speed
        const playerSpeed = pokemon.stats?.speed || 0
        const opponentSpeed = randomPokemon.stats?.speed || 0

        if (playerSpeed >= opponentSpeed) {
          setCurrentTurn("player")
        } else {
          setCurrentTurn("opponent")
          // Set flag to indicate opponent's turn is in progress
          setIsOpponentTurnInProgress(true)
        }
      }
    }, 1500)
  }

  // Handle opponent's first turn
  useEffect(() => {
    // Only run this effect when the battle is ready and it's the opponent's turn
    if (battleState === "battling" && currentTurn === "opponent" && isOpponentTurnInProgress) {
      // Add a slight delay before opponent's turn
      const timer = setTimeout(() => {
        opponentTurn()
        // Reset the flag after opponent's turn is complete
        setIsOpponentTurnInProgress(false)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [battleState, currentTurn, isOpponentTurnInProgress])

  const generateMoves = (pokemon: Pokemon) => {
    try {
      // If the pokemon has moves, use them
      if (pokemon.moves && pokemon.moves.length > 0) {
        const moves = pokemon.moves.map((moveName) => {
          const moveType = getMoveType(moveName)
          return {
            name: moveName,
            type: moveType,
            power: getMovePower(moveName),
            accuracy: getMoveAccuracy(moveName),
          }
        })
        setAvailableMoves(moves)
      } else {
        // Generate moves based on the Pokémon's types
        const generatedMoves = generateMovesForPokemon(pokemon.types || ["normal"])
        const moves = generatedMoves.map((moveName) => {
          const moveType = getMoveType(moveName)
          return {
            name: moveName,
            type: moveType,
            power: getMovePower(moveName),
            accuracy: getMoveAccuracy(moveName),
          }
        })
        setAvailableMoves(moves)
      }
    } catch (error) {
      console.error("Error generating moves:", error)
      // Fallback to basic moves
      setAvailableMoves([
        { name: "Tackle", type: "normal", power: 40, accuracy: 100 },
        { name: "Scratch", type: "normal", power: 40, accuracy: 100 },
        { name: "Pound", type: "normal", power: 40, accuracy: 100 },
        { name: "Quick Attack", type: "normal", power: 40, accuracy: 100 },
      ])
    }
  }

  const executeMove = (move: BattleMove) => {
    if (!selectedPokemon || !opponentPokemon || currentTurn !== "player") return

    // Check if move misses
    if (moveMisses(move.accuracy)) {
      // Play miss sound
      playSound("/sounds/battle/miss.mp3")

      // Show miss message
      setEffectMessage({
        message: "Attack missed!",
        type: "miss",
      })

      // Add to battle log
      const logEntry: LogEntry = {
        turn: turnNumber,
        attackerId: selectedPokemon.id,
        attackerName: selectedPokemon.name,
        defenderId: opponentPokemon.id,
        defenderName: opponentPokemon.name,
        move: move.name,
        moveType: move.type,
        damage: 0,
        defenderHpAfter: opponentPokemon.currentHp || 0,
        missed: true,
      }
      setBattleLog([...battleLog, logEntry])

      // Switch to opponent's turn after a delay
      setTimeout(() => {
        setCurrentTurn("opponent")
        setTurnNumber(turnNumber + 1)

        // Simulate opponent's turn after a delay
        setTimeout(() => {
          opponentTurn()
        }, 1500)
      }, 1500)

      return
    }

    // Calculate type effectiveness
    const effectiveness = calculateTypeEffectiveness(move.type, opponentPokemon.types)

    // Check for critical hit
    const critical = isCriticalHit()

    // Calculate damage
    const attackStat = selectedPokemon.stats?.attack || 50
    const defenseStat = opponentPokemon.stats?.defense || 50
    const damageMultiplier = attackStat / defenseStat
    let damage = Math.floor(move.power * damageMultiplier * effectiveness)

    // Apply critical hit bonus
    if (critical) {
      damage = Math.floor(damage * 1.5)
    }

    // Apply damage animation
    setBattleAnimation("attack")

    // Play move sound effect
    playSound(getMoveSoundEffect(move.type))

    setTimeout(() => {
      setBattleAnimation("damage")

      // Show effectiveness message if applicable
      if (effectiveness !== 1) {
        setEffectMessage({
          message: getEffectivenessMessage(effectiveness),
          type: effectiveness > 1 ? "effective" : effectiveness === 0 ? "immune" : "not-effective",
        })
      } else if (critical) {
        setEffectMessage({
          message: "Critical hit!",
          type: "critical",
        })
      }

      // Update opponent's HP
      const newHp = Math.max(0, (opponentPokemon.currentHp || 0) - damage)
      setOpponentPokemon({
        ...opponentPokemon,
        currentHp: newHp,
      })

      // Add to battle log
      const logEntry: LogEntry = {
        turn: turnNumber,
        attackerId: selectedPokemon.id,
        attackerName: selectedPokemon.name,
        defenderId: opponentPokemon.id,
        defenderName: opponentPokemon.name,
        move: move.name,
        moveType: move.type,
        damage,
        defenderHpAfter: newHp,
        effectiveness,
        isCritical: critical,
      }
      setBattleLog([...battleLog, logEntry])

      // Check if opponent fainted
      if (newHp <= 0) {
        setBattleAnimation("faint")
        setTimeout(() => {
          setWinner("player")
          setBattleState("finished")
          playVictoryMusic()

          // Save battle result
          try {
            saveBattleResult({
              winnerId: selectedPokemon.id,
              winnerName: selectedPokemon.name,
              loserId: opponentPokemon.id,
              loserName: opponentPokemon.name,
              date: new Date().toISOString(),
              battleType: "Multiplayer",
              turns: turnNumber,
              battleLog: [...battleLog, logEntry],
            })
          } catch (err) {
            console.warn("Failed to save battle result:", err)
          }
        }, 1000)
      } else {
        // Switch to opponent's turn
        setTimeout(() => {
          setBattleAnimation("idle")
          setCurrentTurn("opponent")
          setTurnNumber(turnNumber + 1)

          // Simulate opponent's turn after a delay
          setTimeout(() => {
            opponentTurn()
          }, 1500)
        }, 1500)
      }
    }, 500)
  }

  const opponentTurn = () => {
    if (!selectedPokemon || !opponentPokemon) return

    // Select a random move
    const opponentMoves = opponentPokemon.moves || ["Tackle", "Scratch", "Pound", "Quick Attack"]
    const randomMoveName = opponentMoves[Math.floor(Math.random() * opponentMoves.length)]
    const moveType = getMoveType(randomMoveName)
    const movePower = getMovePower(randomMoveName)
    const moveAccuracy = getMoveAccuracy(randomMoveName)

    // Check if move misses
    if (moveMisses(moveAccuracy)) {
      // Play miss sound
      playSound("/sounds/battle/miss.mp3")

      // Show miss message
      setEffectMessage({
        message: "Attack missed!",
        type: "miss",
      })

      // Add to battle log
      const logEntry: LogEntry = {
        turn: turnNumber,
        attackerId: opponentPokemon.id,
        attackerName: opponentPokemon.name,
        defenderId: selectedPokemon.id,
        defenderName: selectedPokemon.name,
        move: randomMoveName,
        moveType,
        damage: 0,
        defenderHpAfter: selectedPokemon.currentHp || 0,
        missed: true,
      }
      setBattleLog([...battleLog, logEntry])

      // Switch back to player's turn after a delay
      setTimeout(() => {
        setBattleAnimation("idle")
        setCurrentTurn("player")
        setTurnNumber(turnNumber + 1)
      }, 1500)

      return
    }

    // Calculate type effectiveness
    const effectiveness = calculateTypeEffectiveness(moveType, selectedPokemon.types)

    // Check for critical hit
    const critical = isCriticalHit()

    // Calculate damage
    const attackStat = opponentPokemon.stats?.attack || 50
    const defenseStat = selectedPokemon.stats?.defense || 50
    const damageMultiplier = attackStat / defenseStat
    let damage = Math.floor(movePower * damageMultiplier * effectiveness)

    // Apply critical hit bonus
    if (critical) {
      damage = Math.floor(damage * 1.5)
    }

    // Play move sound effect
    playSound(getMoveSoundEffect(moveType))

    // Apply damage animation
    setBattleAnimation("damage")

    // Show effectiveness message if applicable
    if (effectiveness !== 1) {
      setEffectMessage({
        message: getEffectivenessMessage(effectiveness),
        type: effectiveness > 1 ? "effective" : effectiveness === 0 ? "immune" : "not-effective",
      })
    } else if (critical) {
      setEffectMessage({
        message: "Critical hit!",
        type: "critical",
      })
    }

    // Update player's HP
    const newHp = Math.max(0, (selectedPokemon.currentHp || 0) - damage)
    setSelectedPokemon({
      ...selectedPokemon,
      currentHp: newHp,
    })

    // Add to battle log
    const logEntry: LogEntry = {
      turn: turnNumber,
      attackerId: opponentPokemon.id,
      attackerName: opponentPokemon.name,
      defenderId: selectedPokemon.id,
      defenderName: selectedPokemon.name,
      move: randomMoveName,
      moveType,
      damage,
      defenderHpAfter: newHp,
      effectiveness,
      isCritical: critical,
    }
    setBattleLog([...battleLog, logEntry])

    // Check if player fainted
    if (newHp <= 0) {
      setBattleAnimation("faint")
      setTimeout(() => {
        setWinner("opponent")
        setBattleState("finished")
        playDefeatMusic()

        // Save battle result
        try {
          saveBattleResult({
            winnerId: opponentPokemon.id,
            winnerName: opponentPokemon.name,
            loserId: selectedPokemon.id,
            loserName: selectedPokemon.name,
            date: new Date().toISOString(),
            battleType: "Multiplayer",
            turns: turnNumber,
            battleLog: [...battleLog, logEntry],
          })
        } catch (err) {
          console.warn("Failed to save battle result:", err)
        }
      }, 1000)
    } else {
      // Switch back to player's turn
      setTimeout(() => {
        setBattleAnimation("idle")
        setCurrentTurn("player")
        setTurnNumber(turnNumber + 1)
      }, 1500)
    }
  }

  const handleSwitchPokemon = () => {
    // Only allow switching if we're in battle and not in the middle of an animation
    if (battleState === "battling" && battleAnimation === "idle") {
      setIsSwitchModalOpen(true)
    }
  }

  const handleSelectSwitchPokemon = (pokemon: Pokemon) => {
    if (!selectedPokemon || battleState !== "battling") return

    // Record the switch in the battle log
    const switchLogEntry: LogEntry = {
      turn: turnNumber,
      attackerId: selectedPokemon.id,
      attackerName: selectedPokemon.name,
      defenderId: selectedPokemon.id, // Same as attacker for switch
      defenderName: selectedPokemon.name,
      move: "Switch",
      moveType: "normal",
      damage: 0,
      defenderHpAfter: selectedPokemon.currentHp || 0,
      switched: true,
      switchedFrom: selectedPokemon.name,
      switchedTo: pokemon.name,
    }

    setBattleLog([...battleLog, switchLogEntry])

    // Set the new selected Pokémon
    setSelectedPokemon({
      ...pokemon,
      currentHp: pokemon.currentHp || pokemon.stats?.hp || 100,
    })

    // Generate moves for the new Pokémon
    generateMoves(pokemon)

    // Switch to opponent's turn after switching
    setCurrentTurn("opponent")
    setTurnNumber(turnNumber + 1)

    // Reset battle animation
    setBattleAnimation("idle")

    // Close the modal
    setIsSwitchModalOpen(false)

    // Opponent's turn after a delay
    setTimeout(() => {
      opponentTurn()
    }, 1500)
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

  const renderPokemonSelectionCard = (pokemon: Pokemon) => {
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
      <div
        key={pokemon.id}
        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
          selectedPokemon?.id === pokemon.id
            ? "border-red-500 bg-red-50 shadow-md transform scale-105"
            : "border-red-100 hover:border-red-300 hover:bg-red-50"
        }`}
        onClick={() => handleSelectPokemon(pokemon)}
      >
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 flex-shrink-0 bg-gray-100 rounded-full p-1">
            <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-white rounded-full"></div>
            <div className="relative h-full w-full">
              <div className="absolute bottom-0 w-10 h-2 bg-black/10 blur-sm rounded-full left-1/2 transform -translate-x-1/2"></div>
              <img
                src={pokemon.sprite || "/placeholder.svg"}
                alt={pokemon.name}
                className="object-contain h-full w-full"
              />
            </div>
          </div>
          <div>
            <h4 className="font-medium capitalize text-sm">{pokemon.name}</h4>
            <div className="flex gap-1 mt-1">
              {pokemon.types.map((type) => (
                <span
                  key={type}
                  className={`${getTypeColor(type)} text-white text-xs px-1.5 py-0.5 rounded-full capitalize shadow-sm`}
                >
                  {type}
                </span>
              ))}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              <span className="font-medium">HP:</span> {pokemon.stats?.hp} | <span className="font-medium">ATK:</span>{" "}
              {pokemon.stats?.attack}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Pokédex
            </Button>
          </Link>
        </div>

        <Card className="border-red-100">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Battle Arena</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-8 h-8 bg-red-600 rounded-full animate-ping opacity-75"></div>
                <div className="relative w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-lg font-medium">Loading your team...</p>
              <p className="text-sm text-gray-500">Preparing for battle</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Pokédex
          </Button>
        </Link>

        <Button variant="ghost" size="sm" onClick={toggleMute} className="text-red-600 hover:bg-red-50">
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>

      <Card className="border-red-100 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-600 to-red-500 text-white">
          <CardTitle className="text-center">
            {battleState === "waiting" && "Waiting for Opponent..."}
            {battleState === "selecting" && "Select Your Pokémon"}
            {battleState === "battling" && "Multiplayer Battle"}
            {battleState === "finished" && "Battle Results"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {battleState === "waiting" && (
            <div className="p-6">
              <div className="flex flex-col items-center justify-center py-8 bg-gradient-to-b from-red-50 to-white rounded-xl">
                <div className="mb-6 text-center">
                  <div className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg shadow-md mb-4">
                    <span className="font-mono font-bold tracking-wider text-xl">{code}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Battle Code</h3>
                  <p className="text-gray-600">Waiting for your opponent to join the battle...</p>
                </div>
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 bg-red-200 rounded-full animate-ping opacity-75"></div>
                  <div className="relative bg-red-100 rounded-full w-full h-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {battleState === "selecting" && (
            <div className="p-6">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-red-50 to-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-bold mb-3 text-center text-red-600">Select Your Pokémon for Battle</h3>
                  <p className="text-center text-gray-600 mb-4">Choose wisely! Your opponent is waiting.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {team.map((pokemon) => renderPokemonSelectionCard(pokemon))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {battleState === "battling" && selectedPokemon && opponentPokemon && (
            <div className="space-y-6">
              <BattleArena
                playerPokemon={selectedPokemon}
                opponentPokemon={opponentPokemon}
                currentTurn={currentTurn}
                battleAnimation={battleAnimation}
                winner={winner}
                effectMessage={effectMessage}
                battleType="multiplayer"
              />

              <div className="p-4 space-y-6">
                <BattleControls
                  turnNumber={turnNumber}
                  currentTurn={currentTurn}
                  availableMoves={availableMoves}
                  onMoveSelect={executeMove}
                  onSwitchPokemon={handleSwitchPokemon}
                  disabled={currentTurn !== "player" || battleAnimation !== "idle"}
                  canSwitch={team.some((p) => p.id !== selectedPokemon.id && (p.currentHp || 0) > 0)}
                />

                <BattleLogDisplay battleLog={battleLog} />
              </div>
            </div>
          )}

          {battleState === "finished" && selectedPokemon && opponentPokemon && (
            <div className="p-6">
              <BattleSummary
                winner={winner as "player" | "opponent"}
                playerPokemon={selectedPokemon}
                opponentPokemon={opponentPokemon}
                turnCount={turnNumber}
                battleType="Multiplayer Battle"
              />

              <div className="mt-6">
                <BattleLogDisplay battleLog={battleLog} />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center p-4 bg-gray-50">
          {battleState === "finished" && (
            <div className="space-x-4">
              <Link href="/">
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                  Return Home
                </Button>
              </Link>
              <Link href="/battle/create">
                <Button className="bg-red-600 hover:bg-red-700">
                  <Swords className="mr-2 h-4 w-4" />
                  New Battle
                </Button>
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Pokemon Switch Modal */}
      <PokemonSwitchModal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
        team={team}
        activePokemonId={selectedPokemon?.id || 0}
        onSelectPokemon={handleSelectSwitchPokemon}
      />
    </div>
  )
}
