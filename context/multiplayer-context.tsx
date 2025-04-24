"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"
import type { TeamMember, BattleState, BattleAction } from "@/lib/types"
import { loadInvites, saveInvite, updateInvite, getInviteByCode } from "@/lib/storage-service"

interface InviteData {
  code: string
  from: string
  team: TeamMember[]
}

interface MultiplayerContextType {
  createInvite: (code: string, username: string, team: TeamMember[]) => void
  joinBattle: (code: string, username: string, team: TeamMember[]) => void
  acceptInvite: (code: string, username: string, team: TeamMember[]) => void
  declineInvite: (code: string) => void
  performAction: (action: BattleAction) => void
  incomingInvite: InviteData | null
  isInBattle: boolean
  isPlayerTurn: boolean
  battleState: BattleState | null
  opponentTeam: TeamMember[] | null
  opponentName: string | null
}

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined)

export function MultiplayerProvider({ children }: { children: ReactNode }) {
  const [incomingInvite, setIncomingInvite] = useState<InviteData | null>(null)
  const [isInBattle, setIsInBattle] = useState(false)
  const [isPlayerTurn, setIsPlayerTurn] = useState(false)
  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const [opponentTeam, setOpponentTeam] = useState<TeamMember[] | null>(null)
  const [opponentName, setOpponentName] = useState<string | null>(null)
  const [activeInviteCode, setActiveInviteCode] = useState<string | null>(null)
  const { toast } = useToast()

  // Simulate server polling for invites
  useEffect(() => {
    const checkForInvites = async () => {
      try {
        const invites = await loadInvites()

        // Find any pending invites
        const pendingInvite = invites.find((invite: any) => invite.status === "pending")
        if (pendingInvite && !incomingInvite) {
          setIncomingInvite({
            code: pendingInvite.code,
            from: pendingInvite.from,
            team: pendingInvite.team,
          })
        }

        // Check if any battle has started
        if (activeInviteCode) {
          const activeBattle = invites.find(
            (invite: any) => invite.code === activeInviteCode && invite.status === "accepted",
          )

          if (activeBattle && !isInBattle) {
            setIsInBattle(true)
            setOpponentTeam(activeBattle.opponentTeam || activeBattle.team)
            setOpponentName(activeBattle.opponent || activeBattle.from)

            // Initialize battle state
            const initialState: BattleState = {
              playerActivePokemon: activeBattle.creatorTeam?.[0]?.id || activeBattle.opponentTeam?.[0]?.id,
              opponentActivePokemon: activeBattle.opponentTeam?.[0]?.id || activeBattle.team?.[0]?.id,
              playerHP: activeBattle.creatorTeam?.[0]?.stats.find((s: any) => s.stat.name === "hp")?.base_stat || 100,
              opponentHP:
                activeBattle.opponentTeam?.[0]?.stats.find((s: any) => s.stat.name === "hp")?.base_stat || 100,
              playerDefeatedPokemon: [],
              opponentDefeatedPokemon: [],
              isPlayerTurn: activeBattle.turn === "creator" || activeBattle.turn === "opponent",
              lastAction: "Battle has begun!",
              result: null,
            }

            setBattleState(initialState)
            setIsPlayerTurn(initialState.isPlayerTurn)
          }

          // Check for battle updates
          if (isInBattle && activeBattle) {
            // Update battle state based on the latest actions
            if (activeBattle.battleState) {
              setBattleState(activeBattle.battleState)
              setIsPlayerTurn(
                (activeBattle.turn === "creator" && activeBattle.from) ||
                  (activeBattle.turn === "opponent" && activeBattle.opponent),
              )
            }
          }
        }
      } catch (error) {
        console.error("Error checking for invites:", error)
      }
    }

    const interval = setInterval(checkForInvites, 2000)
    return () => clearInterval(interval)
  }, [incomingInvite, activeInviteCode, isInBattle])

  const createInvite = async (code: string, username: string, team: TeamMember[]) => {
    try {
      // Check if invite already exists
      const existingInvite = await getInviteByCode(code)

      if (existingInvite) {
        toast({
          title: "Invite Code Already Exists",
          description: "Please try a different invite code.",
          variant: "destructive",
        })
        return
      }

      // Create new invite
      await saveInvite({
        code,
        from: username,
        team,
        status: "pending",
        createdAt: new Date().toISOString(),
        turn: "creator", // Creator goes first
      })

      setActiveInviteCode(code)

      toast({
        title: "Battle Invite Created",
        description: `Share code ${code} with your friend to battle!`,
      })
    } catch (error) {
      console.error("Error creating invite:", error)
      toast({
        title: "Error",
        description: "Failed to create battle invite. Please try again.",
        variant: "destructive",
      })
    }
  }

  const joinBattle = async (code: string, username: string, team: TeamMember[]) => {
    try {
      // Check if invite exists
      const invite = await getInviteByCode(code)

      if (!invite) {
        toast({
          title: "Invalid Invite Code",
          description: "No battle found with this invite code.",
          variant: "destructive",
        })
        return
      }

      if (invite.status !== "pending") {
        toast({
          title: "Battle Already Started",
          description: "This battle has already started or ended.",
          variant: "destructive",
        })
        return
      }

      // Join the battle
      await updateInvite(invite.id, {
        status: "accepted",
        opponent: username,
        opponentTeam: team,
      })

      setActiveInviteCode(code)
      setOpponentTeam(invite.team)
      setOpponentName(invite.from)

      toast({
        title: "Battle Joined",
        description: `You've joined ${invite.from}'s battle!`,
      })
    } catch (error) {
      console.error("Error joining battle:", error)
      toast({
        title: "Error",
        description: "Failed to join battle. Please try again.",
        variant: "destructive",
      })
    }
  }

  const acceptInvite = async (code: string, username: string, team: TeamMember[]) => {
    if (!incomingInvite) return

    try {
      // Find the invite
      const invite = await getInviteByCode(code)

      if (!invite) {
        toast({
          title: "Invite Not Found",
          description: "This battle invite no longer exists.",
          variant: "destructive",
        })
        setIncomingInvite(null)
        return
      }

      // Accept the invite
      await updateInvite(invite.id, {
        status: "accepted",
        opponent: username,
        opponentTeam: team,
      })

      setIncomingInvite(null)
      setActiveInviteCode(code)
      setOpponentTeam(invite.team)
      setOpponentName(invite.from)

      toast({
        title: "Battle Accepted",
        description: `You've accepted ${invite.from}'s battle invitation!`,
      })
    } catch (error) {
      console.error("Error accepting invite:", error)
      toast({
        title: "Error",
        description: "Failed to accept battle invite. Please try again.",
        variant: "destructive",
      })
    }
  }

  const declineInvite = async (code: string) => {
    try {
      // Find the invite
      const invite = await getInviteByCode(code)

      if (!invite) {
        setIncomingInvite(null)
        return
      }

      // Decline the invite
      await updateInvite(invite.id, {
        status: "declined",
      })

      setIncomingInvite(null)

      toast({
        title: "Battle Declined",
        description: "You've declined the battle invitation.",
      })
    } catch (error) {
      console.error("Error declining invite:", error)
      setIncomingInvite(null)
    }
  }

  const performAction = async (action: BattleAction) => {
    if (!activeInviteCode || !battleState) return

    try {
      // Find the battle
      const battle = await getInviteByCode(activeInviteCode)

      if (!battle) {
        toast({
          title: "Battle Not Found",
          description: "This battle no longer exists.",
          variant: "destructive",
        })
        return
      }

      // Process the action
      const newBattleState = { ...battleState }
      let actionDescription = ""

      if (action.type === "attack") {
        const attackerPokemon =
          battle.creatorTeam?.find((p: any) => p.id === action.pokemonId) ||
          battle.opponentTeam?.find((p: any) => p.id === action.pokemonId)

        const defenderPokemon =
          battle.creatorTeam?.find((p: any) => p.id === battleState.opponentActivePokemon) ||
          battle.opponentTeam?.find((p: any) => p.id === battleState.opponentActivePokemon)

        if (!attackerPokemon || !defenderPokemon) return

        // Calculate damage
        const attackStat =
          action.attackType === "normal"
            ? attackerPokemon.stats.find((s: any) => s.stat.name === "attack")?.base_stat || 50
            : attackerPokemon.stats.find((s: any) => s.stat.name === "special-attack")?.base_stat ||
              attackerPokemon.stats.find((s: any) => s.stat.name === "attack")?.base_stat ||
              50

        const defenseStat =
          action.attackType === "normal"
            ? defenderPokemon.stats.find((s: any) => s.stat.name === "defense")?.base_stat || 50
            : defenderPokemon.stats.find((s: any) => s.stat.name === "special-defense")?.base_stat ||
              defenderPokemon.stats.find((s: any) => s.stat.name === "defense")?.base_stat ||
              50

        // Add some randomness to damage
        const effectiveness = Math.random() * 0.5 + 0.75 // 0.75 to 1.25
        const damage = Math.max(1, Math.floor(attackStat * effectiveness * 0.5 - defenseStat * 0.25))

        // Update HP
        if (battle.turn === "creator") {
          newBattleState.opponentHP = Math.max(0, newBattleState.opponentHP - damage)
          actionDescription = `${attackerPokemon.name} used ${action.attackType === "normal" ? "a physical" : "a special"} attack and dealt ${damage} damage to ${defenderPokemon.name}!`

          // Check if opponent Pokémon fainted
          if (newBattleState.opponentHP <= 0) {
            newBattleState.opponentDefeatedPokemon = [...newBattleState.opponentDefeatedPokemon, defenderPokemon.id]

            // Check if all opponent Pokémon are defeated
            if (newBattleState.opponentDefeatedPokemon.length >= battle.opponentTeam.length) {
              newBattleState.result = "player"
              actionDescription += ` All of opponent's Pokémon have fainted! You win!`
            } else {
              // Find next available opponent Pokémon
              const nextPokemon = battle.opponentTeam.find(
                (p: any) => !newBattleState.opponentDefeatedPokemon.includes(p.id),
              )

              if (nextPokemon) {
                newBattleState.opponentActivePokemon = nextPokemon.id
                newBattleState.opponentHP = nextPokemon.stats.find((s: any) => s.stat.name === "hp")?.base_stat || 100
                actionDescription += ` ${defenderPokemon.name} fainted! Opponent sent out ${nextPokemon.name}!`
              }
            }
          }

          // Switch turn
          await updateInvite(battle.id, {
            turn: "opponent",
            battleState: {
              ...newBattleState,
              lastAction: actionDescription,
              isPlayerTurn: false,
            },
          })
        } else {
          newBattleState.playerHP = Math.max(0, newBattleState.playerHP - damage)
          actionDescription = `${attackerPokemon.name} used ${action.attackType === "normal" ? "a physical" : "a special"} attack and dealt ${damage} damage to ${defenderPokemon.name}!`

          // Check if player Pokémon fainted
          if (newBattleState.playerHP <= 0) {
            newBattleState.playerDefeatedPokemon = [...newBattleState.playerDefeatedPokemon, defenderPokemon.id]

            // Check if all player Pokémon are defeated
            if (newBattleState.playerDefeatedPokemon.length >= battle.creatorTeam.length) {
              newBattleState.result = "opponent"
              actionDescription += ` All of your Pokémon have fainted! You lose!`
            } else {
              // Find next available player Pokémon
              const nextPokemon = battle.creatorTeam.find(
                (p: any) => !newBattleState.playerDefeatedPokemon.includes(p.id),
              )

              if (nextPokemon) {
                newBattleState.playerActivePokemon = nextPokemon.id
                newBattleState.playerHP = nextPokemon.stats.find((s: any) => s.stat.name === "hp")?.base_stat || 100
                actionDescription += ` ${defenderPokemon.name} fainted! You sent out ${nextPokemon.name}!`
              }
            }
          }

          // Switch turn
          await updateInvite(battle.id, {
            turn: "creator",
            battleState: {
              ...newBattleState,
              lastAction: actionDescription,
              isPlayerTurn: true,
            },
          })
        }
      } else if (action.type === "switch") {
        // Handle switching Pokémon
        const newPokemon =
          battle.creatorTeam?.find((p: any) => p.id === action.pokemonId) ||
          battle.opponentTeam?.find((p: any) => p.id === action.pokemonId)

        if (!newPokemon) return

        if (battle.turn === "creator") {
          newBattleState.playerActivePokemon = newPokemon.id
          newBattleState.playerHP = newPokemon.stats.find((s: any) => s.stat.name === "hp")?.base_stat || 100
          actionDescription = `You switched to ${newPokemon.name}!`

          // Switch turn
          await updateInvite(battle.id, {
            turn: "opponent",
            battleState: {
              ...newBattleState,
              lastAction: actionDescription,
              isPlayerTurn: false,
            },
          })
        } else {
          newBattleState.opponentActivePokemon = newPokemon.id
          newBattleState.opponentHP = newPokemon.stats.find((s: any) => s.stat.name === "hp")?.base_stat || 100
          actionDescription = `You switched to ${newPokemon.name}!`

          // Switch turn
          await updateInvite(battle.id, {
            turn: "creator",
            battleState: {
              ...newBattleState,
              lastAction: actionDescription,
              isPlayerTurn: true,
            },
          })
        }
      }

      // Update local state
      setBattleState({
        ...newBattleState,
        lastAction: actionDescription,
        isPlayerTurn: false,
      })
      setIsPlayerTurn(false)
    } catch (error) {
      console.error("Error performing action:", error)
      toast({
        title: "Error",
        description: "Failed to perform action. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <MultiplayerContext.Provider
      value={{
        createInvite,
        joinBattle,
        acceptInvite,
        declineInvite,
        performAction,
        incomingInvite,
        isInBattle,
        isPlayerTurn,
        battleState,
        opponentTeam,
        opponentName,
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  )
}

export function useMultiplayer() {
  const context = useContext(MultiplayerContext)
  if (context === undefined) {
    throw new Error("useMultiplayer must be used within a MultiplayerProvider")
  }
  return context
}
