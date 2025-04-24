"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Swords, Volume2, VolumeX, Shield } from "lucide-react"
import Link from "next/link"
import { getTeam } from "@/lib/team-service"
import { saveBattleResult } from "@/lib/battle-service"
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
  isStatusMove,
  getStatusEffectFromMove,
  calculateStatusEffectDamage,
  canMoveWithStatus,
  getWeatherEffect,
  calculateWeatherDamage,
  getWeatherBoost,
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
  status?: {
    type: "poison" | "burn" | "paralysis" | "freeze" | "sleep" | "confusion";
    duration: number
  } | null
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
  statusEffect?: {
    type: "poison" | "burn" | "paralysis" | "freeze" | "sleep" | "confusion"
    applied: boolean
  }
  statusDamage?: number
  weatherDamage?: number
  weatherEffect?: string
  switchInfo?: {
    fromPokemon: string
    toPokemon: string
  }
}

export default function QuickBattlePage() {
  const params = useParams()
  const { id } = params
  const router = useRouter()
  const { toast } = useToast()
  const { playSound, playBattleMusic, stopBattleMusic, playVictoryMusic, playDefeatMusic, toggleMute, isMuted } =
    useSound()

  // Team state
  const [playerTeam, setPlayerTeam] = useState<Pokemon[]>([])
  const [opponentTeam, setOpponentTeam] = useState<Pokemon[]>([])

  // Active Pokémon state
  const [activePlayerPokemon, setActivePlayerPokemon] = useState<Pokemon | null>(null)
  const [activeOpponentPokemon, setActiveOpponentPokemon] = useState<Pokemon | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [battleState, setBattleState] = useState<"loading" | "battling" | "finished">("loading")
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
  const [weather, setWeather] = useState<"rain" | "sun" | "sandstorm" | "hail" | null>(null)
  const [weatherTurnsLeft, setWeatherTurnsLeft] = useState(0)

  // Switch Pokémon modal state
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false)

  // Function to fetch random moves for a Pokémon from the PokeAPI
  const fetchRandomMovesForPokemon = async (pokemonId: number): Promise<string[]> => {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
      const data = await response.json()

      // Get all moves from the API
      const allMoves = data.moves.map((moveData: any) => moveData.move.name)

      // Shuffle and take only 4 moves
      const shuffled = [...allMoves].sort(() => 0.5 - Math.random())
      return shuffled.slice(0, 4)
    } catch (error) {
      console.error("Error fetching moves:", error)
      return ["tackle", "scratch", "pound", "quick-attack"] // Fallback moves
    }
  }

  useEffect(() => {
    const loadBattle = async () => {
      setIsLoading(true)
      try {
        // Load the player's team
        const teamData = await getTeam()

        if (teamData.length === 0) {
          toast({
            title: "No Pokémon in team",
            description: "You need at least one Pokémon in your team to battle.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        // Add currentHp and status to each Pokémon in the team
        const teamWithHp = await Promise.all(
          teamData.map(async (pokemon) => {
            // Fetch random moves for each Pokémon
            const randomMoves = await fetchRandomMovesForPokemon(pokemon.id)

            return {
              ...pokemon,
              currentHp: pokemon.stats?.hp || 100,
              status: null,
              moves: randomMoves,
            }
          }),
        )

        setPlayerTeam(teamWithHp)

        // Set the selected Pokémon as the active one
        const selectedPokemon = teamWithHp.find((p) => p.id.toString() === id) || teamWithHp[0]
        setActivePlayerPokemon(selectedPokemon)

        // Generate opponent team (3 random Pokémon)
        const opponentTeam = []
        const usedIds = new Set()

        for (let i = 0; i < 3; i++) {
          let randomId
          do {
            randomId = Math.floor(Math.random() * 150) + 1
          } while (usedIds.has(randomId))

          usedIds.add(randomId)

          try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`)
            const data = await response.json()

            // Extract the stats
            const stats = data.stats.reduce((acc: any, stat: any) => {
              acc[stat.stat.name] = stat.base_stat
              return acc
            }, {})

            // Extract types
            const types = data.types.map((t: any) => t.type.name)

            // Fetch random moves for the opponent
            const randomMoves = await fetchRandomMovesForPokemon(data.id)

            // Create opponent Pokémon
            const opponent: Pokemon = {
              id: data.id,
              name: data.name,
              sprite: data.sprites.front_default,
              types,
              stats,
              moves: randomMoves,
              currentHp: stats.hp,
              status: null,
            }

            opponentTeam.push(opponent)
          } catch (error) {
            console.error("Error fetching opponent Pokémon:", error)
            // If we can't fetch a Pokémon, just continue
            i--
          }
        }

        setOpponentTeam(opponentTeam)
        setActiveOpponentPokemon(opponentTeam[0])

        // Generate moves for the active player Pokémon
        generateMoves(selectedPokemon)

        // Start the battle
        setBattleState("battling")
        playBattleMusic()

        // Determine who goes first based on speed
        const playerSpeed = selectedPokemon.stats?.speed || 0
        const opponentSpeed = opponentTeam[0].stats?.speed || 0

        if (playerSpeed >= opponentSpeed) {
          setCurrentTurn("player")
        } else {
          setCurrentTurn("opponent")
          // Set flag to indicate opponent's turn is in progress
          setIsOpponentTurnInProgress(true)
        }
      } catch (error) {
        console.error("Error setting up battle:", error)
        toast({
          title: "Error",
          description: "Failed to set up the battle. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadBattle()

    // Cleanup function
    return () => {
      stopBattleMusic()
    }
  }, [id, router, toast, playBattleMusic, stopBattleMusic])

  // Handle opponent's first turn
  useEffect(() => {
    // Only run this effect when the battle is ready and it's the opponent's turn
    if (!isLoading && battleState === "battling" && currentTurn === "opponent" && isOpponentTurnInProgress) {
      // Add a slight delay before opponent's turn
      const timer = setTimeout(() => {
        opponentTurn()
        // Reset the flag after opponent's turn is complete
        setIsOpponentTurnInProgress(false)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [isLoading, battleState, currentTurn, isOpponentTurnInProgress])

  // Apply status effects at the beginning of each turn
  useEffect(() => {
    if (battleState === "battling" && !isLoading) {
      // Apply status damage at the beginning of the turn
      const applyStatusEffects = () => {
        if (currentTurn === "player" && activePlayerPokemon?.status) {
          // Apply status effect to player
          handleStatusEffect("player")
        } else if (currentTurn === "opponent" && activeOpponentPokemon?.status) {
          // Apply status effect to opponent
          handleStatusEffect("opponent")
        }
      }

      // Apply weather damage at the beginning of the turn
      const applyWeatherEffects = () => {
        if (weather && weatherTurnsLeft > 0) {
          // Decrease weather duration
          setWeatherTurnsLeft((prev) => prev - 1)

          // Apply weather damage
          if (currentTurn === "player" && activePlayerPokemon) {
            const damage = calculateWeatherDamage(
              weather,
              activePlayerPokemon.types,
              activePlayerPokemon.stats?.hp || 100,
            )
            if (damage > 0) {
              const newHp = Math.max(0, (activePlayerPokemon.currentHp || 0) - damage)

              // Update the active Pokémon
              setActivePlayerPokemon({
                ...activePlayerPokemon,
                currentHp: newHp,
              })

              // Also update the Pokémon in the team
              setPlayerTeam((prevTeam) =>
                prevTeam.map((pokemon) =>
                  pokemon.id === activePlayerPokemon.id ? { ...pokemon, currentHp: newHp } : pokemon,
                ),
              )

              // Add to battle log
              const logEntry: LogEntry = {
                turn: turnNumber,
                attackerId: 0, // Weather has no attacker
                attackerName: "Weather",
                defenderId: activePlayerPokemon.id,
                defenderName: activePlayerPokemon.name,
                move: "",
                moveType: "",
                damage: 0,
                defenderHpAfter: newHp,
                weatherDamage: damage,
                weatherEffect: weather,
              }
              setBattleLog([...battleLog, logEntry])

              // Check if player fainted from weather
              if (newHp <= 0) {
                handlePlayerPokemonFainted()
              }
            }
          } else if (currentTurn === "opponent" && activeOpponentPokemon) {
            const damage = calculateWeatherDamage(
              weather,
              activeOpponentPokemon.types,
              activeOpponentPokemon.stats?.hp || 100,
            )
            if (damage > 0) {
              const newHp = Math.max(0, (activeOpponentPokemon.currentHp || 0) - damage)

              // Update the active Pokémon
              setActiveOpponentPokemon({
                ...activeOpponentPokemon,
                currentHp: newHp,
              })

              // Also update the Pokémon in the team
              setOpponentTeam((prevTeam) =>
                prevTeam.map((pokemon) =>
                  pokemon.id === activeOpponentPokemon.id ? { ...pokemon, currentHp: newHp } : pokemon,
                ),
              )

              // Add to battle log
              const logEntry: LogEntry = {
                turn: turnNumber,
                attackerId: 0, // Weather has no attacker
                attackerName: "Weather",
                defenderId: activeOpponentPokemon.id,
                defenderName: activeOpponentPokemon.name,
                move: "",
                moveType: "",
                damage: 0,
                defenderHpAfter: newHp,
                weatherDamage: damage,
                weatherEffect: weather,
              }
              setBattleLog([...battleLog, logEntry])

              // Check if opponent fainted from weather
              if (newHp <= 0) {
                handleOpponentPokemonFainted()
              }
            }
          }

          // If weather ended this turn
          if (weatherTurnsLeft === 0) {
            setWeather(null)
            // Add to battle log
            const logEntry: LogEntry = {
              turn: turnNumber,
              attackerId: 0,
              attackerName: "Weather",
              defenderId: 0,
              defenderName: "",
              move: "",
              moveType: "",
              damage: 0,
              defenderHpAfter: 0,
              weatherEffect: "ended",
            }
            setBattleLog([...battleLog, logEntry])
          }
        }
      }

      // Apply effects with a slight delay
      const timer = setTimeout(() => {
        applyStatusEffects()
        applyWeatherEffects()
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [turnNumber, battleState, isLoading])

  const handleStatusEffect = (target: "player" | "opponent") => {
    if (target === "player" && activePlayerPokemon) {
      const pokemon = activePlayerPokemon
      const status = pokemon.status

      if (!status) return

      // Check if status effect prevents movement
      if (!canMoveWithStatus(status.type || "")) {
        // Pokemon can't move this turn
        const logEntry: LogEntry = {
          turn: turnNumber,
          attackerId: pokemon.id,
          attackerName: pokemon.name,
          defenderId: pokemon.id,
          defenderName: pokemon.name,
          move: "",
          moveType: "",
          damage: 0,
          defenderHpAfter: pokemon.currentHp || 0,
          statusEffect: {
            type: status.type || "poison", // Default to "poison" if null
            applied: false,
          },
        }
        setBattleLog([...battleLog, logEntry])

        // Skip to opponent's turn
        setTimeout(() => {
          setCurrentTurn("opponent")
          setTurnNumber(turnNumber + 1)

          // If opponent's turn, trigger it
          setTimeout(() => {
            opponentTurn()
          }, 1500)
        }, 1500)
        return
      }

      // Apply status damage
      const statusDamage = calculateStatusEffectDamage(status.type || "", pokemon.stats?.hp || 100)
      if (statusDamage > 0) {
        const newHp = Math.max(0, (pokemon.currentHp || 0) - statusDamage)

        // Update the active Pokémon
        setActivePlayerPokemon({
          ...pokemon,
          currentHp: newHp,
          status: {
            ...status,
            duration: status.duration - 1,
          },
        })

        // Also update the Pokémon in the team
        setPlayerTeam((prevTeam) =>
          prevTeam.map((p) =>
            p.id === pokemon.id
              ? {
                  ...p,
                  currentHp: newHp,
                  status: {
                    ...status,
                    duration: status.duration - 1,
                  },
                }
              : p,
          ),
        )

        // Add to battle log
        const logEntry: LogEntry = {
          turn: turnNumber,
          attackerId: 0, // Status effect has no attacker
          attackerName: "Status",
          defenderId: pokemon.id,
          defenderName: pokemon.name,
          move: "",
          moveType: "",
          damage: 0,
          defenderHpAfter: newHp,
          statusDamage: statusDamage,
          statusEffect: {
            type: status.type || "poison", // Default to "poison" if null
            applied: false,
          },
        }
        setBattleLog([...battleLog, logEntry])

        // Check if player fainted from status
        if (newHp <= 0) {
          handlePlayerPokemonFainted()
        }
      }

      // Check if status effect has expired
      if (status.duration <= 1) {
        setTimeout(() => {
          // Update the active Pokémon
          setActivePlayerPokemon({
            ...pokemon,
            status: null,
          })

          // Also update the Pokémon in the team
          setPlayerTeam((prevTeam) => prevTeam.map((p) => (p.id === pokemon.id ? { ...p, status: null } : p)))

          // Add to battle log
          const logEntry: LogEntry = {
            turn: turnNumber,
            attackerId: 0,
            attackerName: "Status",
            defenderId: pokemon.id,
            defenderName: pokemon.name,
            move: "",
            moveType: "",
            damage: 0,
            defenderHpAfter: pokemon.currentHp || 0,
            statusEffect: {
              type: status.type || "poison", // Default to "poison" if null
              applied: false,
            },
          }
          setBattleLog([...battleLog, logEntry])

          toast({
            title: "Status Cleared",
            description: `${pokemon.name} is no longer ${status.type}d!`,
          })
        }, 1000)
      }
    } else if (target === "opponent" && activeOpponentPokemon) {
      const pokemon = activeOpponentPokemon
      const status = pokemon.status

      if (!status) return

      // Check if status effect prevents movement
      if (!canMoveWithStatus(status.type || "")) {
        // Pokemon can't move this turn
        const logEntry: LogEntry = {
          turn: turnNumber,
          attackerId: pokemon.id,
          attackerName: pokemon.name,
          defenderId: pokemon.id,
          defenderName: pokemon.name,
          move: "",
          moveType: "",
          damage: 0,
          defenderHpAfter: pokemon.currentHp || 0,
          statusEffect: {
            type: status.type || "poison", // Default to "poison" if null
            applied: false,
          },
        }
        setBattleLog([...battleLog, logEntry])

        // Skip to player's turn
        setTimeout(() => {
          setCurrentTurn("player")
          setTurnNumber(turnNumber + 1)
        }, 1500)
        return
      }

      // Apply status damage
      const statusDamage = calculateStatusEffectDamage(status.type || "", pokemon.stats?.hp || 100)
      if (statusDamage > 0) {
        const newHp = Math.max(0, (pokemon.currentHp || 0) - statusDamage)

        // Update the active Pokémon
        setActiveOpponentPokemon({
          ...pokemon,
          currentHp: newHp,
          status: {
            ...status,
            duration: status.duration - 1,
          },
        })

        // Also update the Pokémon in the team
        setOpponentTeam((prevTeam) =>
          prevTeam.map((p) =>
            p.id === pokemon.id
              ? {
                  ...p,
                  currentHp: newHp,
                  status: {
                    ...status,
                    duration: status.duration - 1,
                  },
                }
              : p,
          ),
        )

        // Add to battle log
        const logEntry: LogEntry = {
          turn: turnNumber,
          attackerId: 0, // Status effect has no attacker
          attackerName: "Status",
          defenderId: pokemon.id,
          defenderName: pokemon.name,
          move: "",
          moveType: "",
          damage: 0,
          defenderHpAfter: newHp,
          statusDamage: statusDamage,
          statusEffect: {
            type: status.type || "poison", // Default to "poison" if null
            applied: false,
          },
        }
        setBattleLog([...battleLog, logEntry])

        // Check if opponent fainted from status
        if (newHp <= 0) {
          handleOpponentPokemonFainted()
        }
      }

      // Check if status effect has expired
      if (status.duration <= 1) {
        setTimeout(() => {
          // Update the active Pokémon
          setActiveOpponentPokemon({
            ...pokemon,
            status: null,
          })

          // Also update the Pokémon in the team
          setOpponentTeam((prevTeam) => prevTeam.map((p) => (p.id === pokemon.id ? { ...p, status: null } : p)))

          // Add to battle log
          const logEntry: LogEntry = {
            turn: turnNumber,
            attackerId: 0,
            attackerName: "Status",
            defenderId: pokemon.id,
            defenderName: pokemon.name,
            move: "",
            moveType: "",
            damage: 0,
            defenderHpAfter: pokemon.currentHp || 0,
            statusEffect: {
              type: status.type || "poison", // Default to "poison" if null
              applied: false,
            },
          }
          setBattleLog([...battleLog, logEntry])
        }, 1000)
      }
    }
  }

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

      // Log the generated moves for debugging
      console.log("Generated moves for", pokemon.name, availableMoves)
    } catch (error) {
      console.error("Error generating moves:", error)
      // Fallback to basic moves if there's an error
      setAvailableMoves([
        { name: "Tackle", type: "normal", power: 40, accuracy: 100 },
        { name: "Scratch", type: "normal", power: 40, accuracy: 100 },
        { name: "Pound", type: "normal", power: 40, accuracy: 100 },
        { name: "Quick Attack", type: "normal", power: 40, accuracy: 100 },
      ])
    }
  }

  const executeMove = (move: BattleMove) => {
    if (!activePlayerPokemon || !activeOpponentPokemon || currentTurn !== "player") return

    // Check if it's a status move
    const isStatus = isStatusMove(move.name)

    // Check if move misses
    if (moveMisses(move.accuracy)) {
      // Play miss sound
      playSound("/sounds/miss.mp3")

      // Show miss message
      setEffectMessage({
        message: "Attack missed!",
        type: "miss",
      })

      // Add to battle log
      const logEntry: LogEntry = {
        turn: turnNumber,
        attackerId: activePlayerPokemon.id,
        attackerName: activePlayerPokemon.name,
        defenderId: activeOpponentPokemon.id,
        defenderName: activeOpponentPokemon.name,
        move: move.name,
        moveType: move.type,
        damage: 0,
        defenderHpAfter: activeOpponentPokemon.currentHp || 0,
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

    // Apply damage animation
    setBattleAnimation("attack")

    // Play move sound effect
    playSound(getMoveSoundEffect(move.type))

    setTimeout(() => {
      setBattleAnimation("damage")

      // Handle status moves
      if (isStatus) {
        const statusEffect = getStatusEffectFromMove(move.name)

        if (statusEffect.type && Math.random() < statusEffect.chance) {
          // Apply status effect to opponent
          const updatedOpponent = {
            ...activeOpponentPokemon,
            status: {
              type: statusEffect.type || "poison", // Default to "poison" if null
              duration: 3 + Math.floor(Math.random() * 3), // 3-5 turns
            },
          }

          setActiveOpponentPokemon(updatedOpponent)

          // Also update the Pokémon in the team
          setOpponentTeam((prevTeam) =>
            prevTeam.map((pokemon) => (pokemon.id === activeOpponentPokemon.id ? updatedOpponent : pokemon)),
          )

          // Show status effect message
          setEffectMessage({
            message: `${activeOpponentPokemon.name} was ${statusEffect.type}d!`,
            type: "effective",
          })

          // Add to battle log
          const logEntry: LogEntry = {
            turn: turnNumber,
            attackerId: activePlayerPokemon.id,
            attackerName: activePlayerPokemon.name,
            defenderId: activeOpponentPokemon.id,
            defenderName: activeOpponentPokemon.name,
            move: move.name,
            moveType: move.type,
            damage: 0,
            defenderHpAfter: activeOpponentPokemon.currentHp || 0,
            statusEffect: {
              type: statusEffect.type || "poison", // Default to "poison" if null
              applied: true,
            },
          }
          setBattleLog([...battleLog, logEntry])
        } else {
          // Status move failed
          setEffectMessage({
            message: "But it failed!",
            type: "not-effective",
          })

          // Add to battle log
          const logEntry: LogEntry = {
            turn: turnNumber,
            attackerId: activePlayerPokemon.id,
            attackerName: activePlayerPokemon.name,
            defenderId: activeOpponentPokemon.id,
            defenderName: activeOpponentPokemon.name,
            move: move.name,
            moveType: move.type,
            damage: 0,
            defenderHpAfter: activeOpponentPokemon.currentHp || 0,
            missed: true,
          }
          setBattleLog([...battleLog, logEntry])
        }

        // Check for weather effect
        const weatherEffect = getWeatherEffect(move.name)
        if (weatherEffect) {
          setWeather(weatherEffect as any)
          setWeatherTurnsLeft(5) // Weather lasts 5 turns

          // Add to battle log
          const logEntry: LogEntry = {
            turn: turnNumber,
            attackerId: activePlayerPokemon.id,
            attackerName: activePlayerPokemon.name,
            defenderId: 0,
            defenderName: "",
            move: move.name,
            moveType: move.type,
            damage: 0,
            defenderHpAfter: 0,
            weatherEffect: weatherEffect,
          }
          setBattleLog([...battleLog, logEntry])
        }

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

        return
      }

      // Calculate type effectiveness
      const effectiveness = calculateTypeEffectiveness(move.type, activeOpponentPokemon.types)

      // Check for critical hit
      const critical = isCriticalHit()

      // Calculate damage
      const attackStat = activePlayerPokemon.stats?.attack || 50
      const defenseStat = activeOpponentPokemon.stats?.defense || 50
      const damageMultiplier = attackStat / defenseStat

      // Apply weather boost
      const weatherBoostMultiplier = getWeatherBoost(weather, move.type)

      let damage = Math.floor(move.power * damageMultiplier * effectiveness * weatherBoostMultiplier)

      // Apply critical hit bonus
      if (critical) {
        damage = Math.floor(damage * 1.5)
      }

      // Apply burn status effect (reduces attack damage)
      if (activePlayerPokemon.status?.type === "burn") {
        damage = Math.floor(damage * 0.5)
      }

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
      const newHp = Math.max(0, (activeOpponentPokemon.currentHp || 0) - damage)

      // Update the active opponent Pokémon
      const updatedOpponent = {
        ...activeOpponentPokemon,
        currentHp: newHp,
      }

      setActiveOpponentPokemon(updatedOpponent)

      // Also update the Pokémon in the team
      setOpponentTeam((prevTeam) =>
        prevTeam.map((pokemon) =>
          pokemon.id === activeOpponentPokemon.id ? { ...pokemon, currentHp: newHp } : pokemon,
        ),
      )

      // Add to battle log
      const logEntry: LogEntry = {
        turn: turnNumber,
        attackerId: activePlayerPokemon.id,
        attackerName: activePlayerPokemon.name,
        defenderId: activeOpponentPokemon.id,
        defenderName: activeOpponentPokemon.name,
        move: move.name,
        moveType: move.type,
        damage,
        defenderHpAfter: newHp,
        effectiveness,
        isCritical: critical,
      }
      setBattleLog([...battleLog, logEntry])

      // Check for status effect chance from move
      const statusEffect = getStatusEffectFromMove(move.name)
      if (statusEffect.type && Math.random() < statusEffect.chance && !activeOpponentPokemon.status) {
        setTimeout(() => {
          // Apply status effect to opponent
          const updatedOpponentWithStatus = {
            ...updatedOpponent,
            status: {
              type: statusEffect.type || "poison",
              duration: 3 + Math.floor(Math.random() * 3), // 3-5 turns
            },
          }

          setActiveOpponentPokemon(updatedOpponentWithStatus)

          // Also update the Pokémon in the team
          setOpponentTeam((prevTeam) =>
            prevTeam.map((pokemon) =>
              pokemon.id === activeOpponentPokemon.id
                ? { ...updatedOpponentWithStatus, status: { ...updatedOpponentWithStatus.status, type: updatedOpponentWithStatus.status?.type || "poison" } }
                : pokemon
            )
          );

          // Show status effect message
          setEffectMessage({
            message: `${activeOpponentPokemon.name} was ${statusEffect.type}d!`,
            type: "effective",
          })

          // Add to battle log
          const statusLogEntry: LogEntry = {
            turn: turnNumber,
            attackerId: activePlayerPokemon.id,
            attackerName: activePlayerPokemon.name,
            defenderId: activeOpponentPokemon.id,
            defenderName: activeOpponentPokemon.name,
            move: move.name,
            moveType: move.type,
            damage: 0,
            defenderHpAfter: newHp,
            statusEffect: {
              type: statusEffect.type || "poison",
              applied: true,
            },
          }
          setBattleLog([...battleLog, statusLogEntry])
        }, 1000)
      }

      // Check if opponent fainted
      if (newHp <= 0) {
        setBattleAnimation("faint")
        setTimeout(() => {
          handleOpponentPokemonFainted()
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

  const handleOpponentPokemonFainted = () => {
    // Check if there are any remaining opponent Pokémon
    const remainingOpponents = opponentTeam.filter(
      (pokemon) => pokemon.id !== activeOpponentPokemon?.id && (pokemon.currentHp || 0) > 0,
    )

    if (remainingOpponents.length > 0) {
      // Switch to the next opponent Pokémon
      const nextOpponent = remainingOpponents[0]

      // Add to battle log
      const logEntry: LogEntry = {
        turn: turnNumber,
        attackerId: 0,
        attackerName: "Trainer",
        defenderId: 0,
        defenderName: "",
        move: "",
        moveType: "",
        damage: 0,
        defenderHpAfter: 0,
        switchInfo: {
          fromPokemon: activeOpponentPokemon?.name || "",
          toPokemon: nextOpponent.name,
        },
      }
      setBattleLog([...battleLog, logEntry])

      toast({
        title: "Opponent's Pokémon fainted!",
        description: `Opponent sends out ${nextOpponent.name}!`,
      })

      // Set the next opponent Pokémon as active
      setActiveOpponentPokemon(nextOpponent)

      // Reset battle animation
      setBattleAnimation("idle")

      // Continue to player's turn
      setCurrentTurn("player")
      setTurnNumber(turnNumber + 1)
    } else {
      // All opponent Pokémon have fainted, player wins
      setWinner("player")
      setBattleState("finished")
      playVictoryMusic()

      // Save battle result
      saveBattleResult({
        winnerId: activePlayerPokemon?.id || 0,
        winnerName: activePlayerPokemon?.name || "",
        loserId: activeOpponentPokemon?.id || 0,
        loserName: activeOpponentPokemon?.name || "",
        date: new Date().toISOString(),
        battleType: "Quick Battle",
        turns: turnNumber,
      })
    }
  }

  const handlePlayerPokemonFainted = () => {
    // Check if there are any remaining player Pokémon
    const remainingPlayerPokemon = playerTeam.filter(
      (pokemon) => pokemon.id !== activePlayerPokemon?.id && (pokemon.currentHp || 0) > 0,
    )

    if (remainingPlayerPokemon.length > 0) {
      // Open the switch Pokémon modal
      setIsSwitchModalOpen(true)

      toast({
        title: "Your Pokémon fainted!",
        description: "Select another Pokémon to continue the battle.",
        variant: "destructive",
      })

      // Reset battle animation
      setBattleAnimation("idle")

      // Set turn to player to allow them to select a new Pokémon
      setCurrentTurn("player")
    } else {
      // All player Pokémon have fainted, opponent wins
      setWinner("opponent")
      setBattleState("finished")
      playDefeatMusic()

      // Save battle result
      saveBattleResult({
        winnerId: activeOpponentPokemon?.id || 0,
        winnerName: activeOpponentPokemon?.name || "",
        loserId: activePlayerPokemon?.id || 0,
        loserName: activePlayerPokemon?.name || "",
        date: new Date().toISOString(),
        battleType: "Quick Battle",
        turns: turnNumber,
      })
    }
  }

  const handleSwitchPokemon = () => {
    // Allow switching if there are other Pokémon available, regardless of turn
    const availablePokemon = playerTeam.filter(
      (pokemon) => pokemon.id !== activePlayerPokemon?.id && (pokemon.currentHp || 0) > 0,
    )

    if (availablePokemon.length > 0) {
      setIsSwitchModalOpen(true)
    } else {
      toast({
        title: "Cannot switch",
        description: "You don't have any other Pokémon available to switch to.",
        variant: "destructive",
      })
    }
  }

  const handleSelectPokemon = (pokemon: Pokemon) => {
    if (!activePlayerPokemon) return

    // Close the modal
    setIsSwitchModalOpen(false)

    // Add to battle log
    const logEntry: LogEntry = {
      turn: turnNumber,
      attackerId: activePlayerPokemon.id,
      attackerName: "You",
      defenderId: 0,
      defenderName: "",
      move: "",
      moveType: "",
      damage: 0,
      defenderHpAfter: 0,
      switchInfo: {
        fromPokemon: activePlayerPokemon.name,
        toPokemon: pokemon.name,
      },
    }
    setBattleLog([...battleLog, logEntry])

    // Set the selected Pokémon as active
    setActivePlayerPokemon(pokemon)

    // Generate moves for the new Pokémon
    generateMoves(pokemon)

    // Reset battle animation
    setBattleAnimation("idle")

    // If it's already the player's turn, keep it that way
    // Otherwise, switching costs a turn
    if (currentTurn !== "player") {
      setCurrentTurn("player")
      setTurnNumber(turnNumber + 1)
    }
  }

  const opponentTurn = () => {
    if (!activePlayerPokemon || !activeOpponentPokemon) return

    // Check if opponent should switch Pokémon
    const shouldSwitch = Math.random() < 0.2 // 20% chance to switch if possible
    const availableOpponents = opponentTeam.filter(
      (pokemon) => pokemon.id !== activeOpponentPokemon.id && (pokemon.currentHp || 0) > 0,
    )

    if (shouldSwitch && availableOpponents.length > 0) {
      // Select a random Pokémon to switch to
      const nextOpponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)]

      // Add to battle log
      const logEntry: LogEntry = {
        turn: turnNumber,
        attackerId: activeOpponentPokemon.id,
        attackerName: "Opponent",
        defenderId: 0,
        defenderName: "",
        move: "",
        moveType: "",
        damage: 0,
        defenderHpAfter: 0,
        switchInfo: {
          fromPokemon: activeOpponentPokemon.name,
          toPokemon: nextOpponent.name,
        },
      }
      setBattleLog([...battleLog, logEntry])

      toast({
        title: "Opponent switched Pokémon!",
        description: `Opponent sent out ${nextOpponent.name}!`,
      })

      // Set the next opponent Pokémon as active
      setActiveOpponentPokemon(nextOpponent)

      // Switch to player's turn
      setCurrentTurn("player")
      setTurnNumber(turnNumber + 1)
      return
    }

    // Select a random move
    const opponentMoves = activeOpponentPokemon.moves || ["Tackle", "Scratch", "Pound", "Quick Attack"]
    const randomMoveName = opponentMoves[Math.floor(Math.random() * opponentMoves.length)]
    const moveType = getMoveType(randomMoveName)
    const movePower = getMovePower(randomMoveName)
    const moveAccuracy = getMoveAccuracy(randomMoveName)
    const isStatus = isStatusMove(randomMoveName)

    // Check if move misses
    if (moveMisses(moveAccuracy)) {
      // Play miss sound
      playSound("/sounds/miss.mp3")

      // Show miss message
      setEffectMessage({
        message: "Attack missed!",
        type: "miss",
      })

      // Add to battle log
      const logEntry: LogEntry = {
        turn: turnNumber,
        attackerId: activeOpponentPokemon.id,
        attackerName: activeOpponentPokemon.name,
        defenderId: activePlayerPokemon.id,
        defenderName: activePlayerPokemon.name,
        move: randomMoveName,
        moveType,
        damage: 0,
        defenderHpAfter: activePlayerPokemon.currentHp || 0,
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

    // Play move sound effect
    playSound(getMoveSoundEffect(moveType))

    // Apply damage animation
    setBattleAnimation("damage")

    // Handle status moves
    if (isStatus) {
      const statusEffect = getStatusEffectFromMove(randomMoveName)

      if (statusEffect.type && Math.random() < statusEffect.chance) {
        // Apply status effect to player
        const updatedPlayer = {
          ...activePlayerPokemon,
          status: {
            type: statusEffect.type || "poison",
            duration: 3 + Math.floor(Math.random() * 3), // 3-5 turns
          },
        }

        setActivePlayerPokemon(updatedPlayer)

        // Also update the Pokémon in the team
        setPlayerTeam((prevTeam) =>
          prevTeam.map((pokemon) => (pokemon.id === activePlayerPokemon.id ? updatedPlayer : pokemon)),
        )

        // Show status effect message
        setEffectMessage({
          message: `${activePlayerPokemon.name} was ${statusEffect.type}d!`,
          type: "effective",
        })

        // Add to battle log
        const logEntry: LogEntry = {
          turn: turnNumber,
          attackerId: activeOpponentPokemon.id,
          attackerName: activeOpponentPokemon.name,
          defenderId: activePlayerPokemon.id,
          defenderName: activePlayerPokemon.name,
          move: randomMoveName,
          moveType,
          damage: 0,
          defenderHpAfter: activePlayerPokemon.currentHp || 0,
          statusEffect: {
            type: statusEffect.type || "poison",
            applied: true,
          },
        }
        setBattleLog([...battleLog, logEntry])
      } else {
        // Status move failed
        setEffectMessage({
          message: "But it failed!",
          type: "not-effective",
        })

        // Add to battle log
        const logEntry: LogEntry = {
          turn: turnNumber,
          attackerId: activeOpponentPokemon.id,
          attackerName: activeOpponentPokemon.name,
          defenderId: activePlayerPokemon.id,
          defenderName: activePlayerPokemon.name,
          move: randomMoveName,
          moveType,
          damage: 0,
          defenderHpAfter: activePlayerPokemon.currentHp || 0,
          missed: true,
        }
        setBattleLog([...battleLog, logEntry])
      }

      // Check for weather effect
      const weatherEffect = getWeatherEffect(randomMoveName)
      if (weatherEffect) {
        setWeather(weatherEffect as any)
        setWeatherTurnsLeft(5) // Weather lasts 5 turns

        // Add to battle log
        const logEntry: LogEntry = {
          turn: turnNumber,
          attackerId: activeOpponentPokemon.id,
          attackerName: activeOpponentPokemon.name,
          defenderId: 0,
          defenderName: "",
          move: randomMoveName,
          moveType,
          damage: 0,
          defenderHpAfter: 0,
          weatherEffect: weatherEffect,
        }
        setBattleLog([...battleLog, logEntry])
      }

      // Switch to player's turn
      setTimeout(() => {
        setBattleAnimation("idle")
        setCurrentTurn("player")
        setTurnNumber(turnNumber + 1)
      }, 1500)

      return
    }

    // Calculate type effectiveness
    const effectiveness = calculateTypeEffectiveness(moveType, activePlayerPokemon.types)

    // Check for critical hit
    const critical = isCriticalHit()

    // Calculate damage
    const attackStat = activeOpponentPokemon.stats?.attack || 50
    const defenseStat = activePlayerPokemon.stats?.defense || 50
    const damageMultiplier = attackStat / defenseStat

    // Apply weather boost
    const weatherBoostMultiplier = getWeatherBoost(weather, moveType)

    let damage = Math.floor(movePower * damageMultiplier * effectiveness * weatherBoostMultiplier)

    // Apply critical hit bonus
    if (critical) {
      damage = Math.floor(damage * 1.5)
    }

    // Apply burn status effect (reduces attack damage)
    if (activeOpponentPokemon.status?.type === "burn") {
      damage = Math.floor(damage * 0.5)
    }

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
    const newHp = Math.max(0, (activePlayerPokemon.currentHp || 0) - damage)

    // Update the active player Pokémon
    const updatedPlayer = {
      ...activePlayerPokemon,
      currentHp: newHp,
    }

    setActivePlayerPokemon(updatedPlayer)

    // Also update the Pokémon in the team
    setPlayerTeam((prevTeam) =>
      prevTeam.map((pokemon) => (pokemon.id === activePlayerPokemon.id ? { ...pokemon, currentHp: newHp } : pokemon)),
    )

    // Add to battle log
    const logEntry: LogEntry = {
      turn: turnNumber,
      attackerId: activeOpponentPokemon.id,
      attackerName: activeOpponentPokemon.name,
      defenderId: activePlayerPokemon.id,
      defenderName: activePlayerPokemon.name,
      move: randomMoveName,
      moveType,
      damage,
      defenderHpAfter: newHp,
      effectiveness,
      isCritical: critical,
    }
    setBattleLog([...battleLog, logEntry])

    // Check for status effect chance from move
    const statusEffect = getStatusEffectFromMove(randomMoveName)
    if (statusEffect.type && Math.random() < statusEffect.chance && !activePlayerPokemon.status) {
      setTimeout(() => {
        // Apply status effect to player
        const updatedPlayerWithStatus = {
          ...updatedPlayer,
          status: {
            type: statusEffect.type || "poison", // Default to "poison" if null
            duration: 3 + Math.floor(Math.random() * 3), // 3-5 turns
          },
        }

        setActivePlayerPokemon(updatedPlayerWithStatus)

        // Also update the Pokémon in the team
        setPlayerTeam((prevTeam) =>
          prevTeam.map((pokemon) => (pokemon.id === activePlayerPokemon.id ? updatedPlayerWithStatus : pokemon)),
        )

        // Show status effect message
        setEffectMessage({
          message: `${activePlayerPokemon.name} was ${statusEffect.type}d!`,
          type: "effective",
        })

        // Add to battle log
        const statusLogEntry: LogEntry = {
          turn: turnNumber,
          attackerId: activeOpponentPokemon.id,
          attackerName: activeOpponentPokemon.name,
          defenderId: activePlayerPokemon.id,
          defenderName: activePlayerPokemon.name,
          move: randomMoveName,
          moveType,
          damage: 0,
          defenderHpAfter: newHp,
          statusEffect: {
            type: statusEffect.type || "poison",
            applied: true,
          },
        }
        setBattleLog([...battleLog, statusLogEntry])
      }, 1000)
    }

    // Check if player fainted
    if (newHp <= 0) {
      setBattleAnimation("faint")
      setTimeout(() => {
        handlePlayerPokemonFainted()
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

  // Check if player can switch Pokémon
  const canSwitchPokemon = () => {
    return (
      playerTeam.filter((pokemon) => pokemon.id !== activePlayerPokemon?.id && (pokemon.currentHp || 0) > 0).length > 0
    )
  }

  if (isLoading || battleState === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-50">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Pokédex
            </Button>
          </Link>
        </div>

        <Card className="border-indigo-100">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-500 text-white">
            <CardTitle className="text-center">Quick Battle</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-8 h-8 bg-indigo-600 rounded-full animate-ping opacity-75"></div>
                <div className="relative w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
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
              <p className="text-lg font-medium">Setting up your battle...</p>
              <p className="text-sm text-gray-500">Preparing the arena and finding an opponent</p>
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
          <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-50">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Pokédex
          </Button>
        </Link>

        <Button variant="ghost" size="sm" onClick={toggleMute} className="text-indigo-600 hover:bg-indigo-50">
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>

      <Card className="border-indigo-100 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-500 text-white">
          <CardTitle className="text-center">
            {battleState === "battling" && "Pokémon Battle Arena"}
            {battleState === "finished" && "Battle Results"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {battleState === "battling" && activePlayerPokemon && activeOpponentPokemon && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Battle Arena - Left Side */}
              <div className="p-4">
                <BattleArena
                  playerPokemon={activePlayerPokemon}
                  opponentPokemon={activeOpponentPokemon}
                  currentTurn={currentTurn}
                  battleAnimation={battleAnimation}
                  winner={winner}
                  effectMessage={effectMessage}
                  battleType="quick"
                  weather={weather}
                />

                <div className="mt-4">
                  <BattleControls
                    turnNumber={turnNumber}
                    currentTurn={currentTurn}
                    availableMoves={availableMoves}
                    onMoveSelect={executeMove}
                    onSwitchPokemon={handleSwitchPokemon}
                    disabled={currentTurn !== "player" || battleAnimation !== "idle"}
                    canSwitch={canSwitchPokemon()}
                  />
                </div>
              </div>

              {/* Battle Log - Right Side */}
              <div className="p-4 bg-gray-50 border-l border-indigo-100 h-full">
                <div className="flex items-center mb-3">
                  <Shield className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="text-lg font-semibold text-indigo-700">Battle Log</h3>
                </div>
                <div className="h-[500px] overflow-y-auto pr-2">
                  <BattleLogDisplay battleLog={battleLog} />
                </div>
              </div>
            </div>
          )}

          {battleState === "finished" && activePlayerPokemon && activeOpponentPokemon && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              <div>
                <BattleSummary
                  winner={winner as "player" | "opponent"}
                  playerPokemon={activePlayerPokemon}
                  opponentPokemon={activeOpponentPokemon}
                  turnCount={turnNumber}
                  battleType="Quick Battle"
                />
              </div>

              <div className="bg-gray-50 border-l border-indigo-100 p-4">
                <div className="flex items-center mb-3">
                  <Shield className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="text-lg font-semibold text-indigo-700">Battle History</h3>
                </div>
                <div className="h-[400px] overflow-y-auto pr-2">
                  <BattleLogDisplay battleLog={battleLog} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center p-4 bg-gray-50">
          {battleState === "finished" && (
            <div className="space-x-4">
              <Link href="/">
                <Button variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                  Return Home
                </Button>
              </Link>
              <Link href="/battle/create">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Swords className="mr-2 h-4 w-4" />
                  New Battle
                </Button>
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Pokémon Switch Modal */}
      <PokemonSwitchModal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
        team={playerTeam}
        activePokemonId={activePlayerPokemon?.id || 0}
        onSelectPokemon={handleSelectPokemon}
      />
    </div>
  )
}
