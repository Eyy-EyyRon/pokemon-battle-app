"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Copy, CheckCircle2, Sparkles, Users, Swords, Shield, RefreshCw, Bot, Cpu } from "lucide-react"
import { useMultiplayer } from "@/context/multiplayer-context"
import TurnBasedBattle from "./turn-based-battle"
import AIBattle from "./ai-battle"
import type { TeamMember } from "@/lib/types"
import { generateBattleCode } from "@/lib/utils"

interface MultiplayerLobbyProps {
  team: TeamMember[]
  username: string
}

export default function MultiplayerLobby({ team, username }: MultiplayerLobbyProps) {
  const [inviteCode, setInviteCode] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<TeamMember[]>([])
  const [lobbyTab, setLobbyTab] = useState("select-team")
  const [copied, setCopied] = useState(false)
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [isPlayingAI, setIsPlayingAI] = useState(false)
  const { toast } = useToast()

  const {
    createInvite,
    joinBattle,
    incomingInvite,
    acceptInvite,
    declineInvite,
    isInBattle,
    battleState,
    opponentTeam,
    opponentName,
  } = useMultiplayer()

  // Generate a random invite code when component mounts
  useEffect(() => {
    setInviteCode(generateBattleCode())
  }, [])

  const handleCreateInvite = () => {
    if (selectedTeam.length !== 6) {
      toast({
        title: "Team Incomplete",
        description: "You need to select 6 Pokémon for your battle team.",
        variant: "destructive",
      })
      return
    }

    createInvite(inviteCode, username, selectedTeam)
    toast({
      title: "Battle Created!",
      description: `Share code ${inviteCode} with your friend to battle!`,
    })
  }

  const handleJoinBattle = () => {
    if (selectedTeam.length !== 6) {
      toast({
        title: "Team Incomplete",
        description: "You need to select 6 Pokémon for your battle team.",
        variant: "destructive",
      })
      return
    }

    if (joinCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-character invite code.",
        variant: "destructive",
      })
      return
    }

    joinBattle(joinCode, username, selectedTeam)
  }

  const handleAcceptInvite = () => {
    if (selectedTeam.length !== 6) {
      toast({
        title: "Team Incomplete",
        description: "You need to select 6 Pokémon for your battle team.",
        variant: "destructive",
      })
      return
    }

    if (incomingInvite) {
      acceptInvite(incomingInvite.code, username, selectedTeam)
    }
  }

  const togglePokemonSelection = (pokemon: TeamMember) => {
    if (selectedTeam.some((p) => p.id === pokemon.id)) {
      setSelectedTeam(selectedTeam.filter((p) => p.id !== pokemon.id))
    } else if (selectedTeam.length < 6) {
      setSelectedTeam([...selectedTeam, pokemon])
    } else {
      toast({
        title: "Team Full",
        description: "You can only select 6 Pokémon for battle.",
        variant: "destructive",
      })
    }
  }

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    toast({
      title: "Copied!",
      description: "Battle code copied to clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const regenerateInviteCode = () => {
    const newCode = generateBattleCode()
    setInviteCode(newCode)
    toast({
      title: "New Code Generated",
      description: `Your new battle code is ${newCode}`,
    })
  }

  const startAIBattle = () => {
    if (selectedTeam.length !== 6) {
      toast({
        title: "Team Incomplete",
        description: "You need to select 6 Pokémon for your battle team.",
        variant: "destructive",
      })
      return
    }

    setIsPlayingAI(true)
    toast({
      title: "AI Battle Started!",
      description: `Starting battle against AI (${aiDifficulty} difficulty)`,
    })
  }

  // If in battle with another player, show the battle screen
  if (isInBattle && battleState && opponentTeam) {
    return (
      <TurnBasedBattle
        playerTeam={selectedTeam}
        opponentTeam={opponentTeam}
        playerName={username}
        opponentName={opponentName || "Opponent"}
        battleState={battleState}
      />
    )
  }

  // If in battle with AI, show the AI battle screen
  if (isPlayingAI) {
    return (
      <AIBattle
        playerTeam={selectedTeam}
        playerName={username}
        difficulty={aiDifficulty}
        onExitBattle={() => setIsPlayingAI(false)}
      />
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
            Battle Arena
          </h2>
          <p className="text-muted-foreground mt-1">Challenge trainers or battle against AI!</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
            <Users className="w-4 h-4 mr-1" /> Battle Mode
          </Badge>
          <Avatar>
            <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${username}`} alt={username} />
            <AvatarFallback>{username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </motion.div>

      <Tabs value={lobbyTab} onValueChange={setLobbyTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger
            value="select-team"
            className="data-[state=active]:bg-indigo-50 dark:data-[state=active]:bg-indigo-950/40"
          >
            <Shield className="w-4 h-4 mr-2" /> Select Team
          </TabsTrigger>
          <TabsTrigger
            value="ai-battle"
            className="data-[state=active]:bg-indigo-50 dark:data-[state=active]:bg-indigo-950/40"
          >
            <Bot className="w-4 h-4 mr-2" /> AI Battle
          </TabsTrigger>
          <TabsTrigger
            value="create-battle"
            className="data-[state=active]:bg-indigo-50 dark:data-[state=active]:bg-indigo-950/40"
          >
            <Sparkles className="w-4 h-4 mr-2" /> Create Battle
          </TabsTrigger>
          <TabsTrigger
            value="join-battle"
            className="data-[state=active]:bg-indigo-50 dark:data-[state=active]:bg-indigo-950/40"
          >
            <Swords className="w-4 h-4 mr-2" /> Join Battle
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="select-team" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden border-indigo-200 dark:border-indigo-800/30">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                  <CardTitle>Select Your Battle Team</CardTitle>
                  <CardDescription>Choose 6 Pokémon from your team for battle</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {team.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg border-muted-foreground/20">
                      <p className="text-muted-foreground mb-4">Your team is empty. Add Pokémon to your team first!</p>
                      <Button variant="outline" onClick={() => (window.location.hash = "#browse")}>
                        Browse Pokémon
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {team.map((pokemon) => (
                          <motion.div
                            key={pokemon.id}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="relative"
                          >
                            <Card
                              className={`cursor-pointer transition-all ${
                                selectedTeam.some((p) => p.id === pokemon.id)
                                  ? "ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                                  : ""
                              }`}
                              onClick={() => togglePokemonSelection(pokemon)}
                            >
                              <CardContent className="p-4 flex items-center gap-3">
                                <div className="relative">
                                  <img
                                    src={pokemon.sprite || "/placeholder.svg"}
                                    alt={pokemon.name}
                                    className="w-16 h-16"
                                  />
                                  {selectedTeam.some((p) => p.id === pokemon.id) && (
                                    <motion.div
                                      className="absolute -top-2 -right-2 bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                    >
                                      {selectedTeam.findIndex((p) => p.id === pokemon.id) + 1}
                                    </motion.div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium capitalize">{pokemon.name}</h4>
                                  <div className="flex gap-1 mt-1">
                                    {pokemon.types.map((type) => (
                                      <Badge key={type.type.name} variant="outline" className="text-xs">
                                        {type.type.name}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>

                      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-medium">Selected Battle Team ({selectedTeam.length}/6)</h3>
                          {selectedTeam.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => setSelectedTeam([])}>
                              Clear
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div
                              key={i}
                              className={`aspect-square rounded-md flex items-center justify-center ${
                                selectedTeam[i]
                                  ? "bg-indigo-100 dark:bg-indigo-900/30"
                                  : "border-2 border-dashed border-muted-foreground/20"
                              }`}
                            >
                              {selectedTeam[i] ? (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                  <img
                                    src={selectedTeam[i].sprite || "/placeholder.svg"}
                                    alt={selectedTeam[i].name}
                                    className="w-12 h-12"
                                  />
                                </motion.div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Empty</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedTeam.length === 6
                      ? "Team complete! You're ready for battle."
                      : `Select ${6 - selectedTeam.length} more Pokémon to complete your team.`}
                  </p>
                  {selectedTeam.length === 6 && (
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" onClick={() => setLobbyTab("ai-battle")}>
                        <Bot className="w-4 h-4 mr-2" /> Battle AI
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setLobbyTab("create-battle")}>
                        <Users className="w-4 h-4 mr-2" /> Battle Player
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="ai-battle">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden border-indigo-200 dark:border-indigo-800/30">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                  <CardTitle className="flex items-center">
                    <Bot className="w-5 h-5 mr-2 text-indigo-500" /> Battle Against AI
                  </CardTitle>
                  <CardDescription>Challenge the computer to a Pokémon battle</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {selectedTeam.length < 6 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg border-muted-foreground/20">
                      <p className="text-muted-foreground mb-4">
                        You need to select 6 Pokémon for your battle team first.
                      </p>
                      <Button variant="outline" onClick={() => setLobbyTab("select-team")}>
                        Select Team
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-6 flex flex-wrap justify-center gap-3">
                          {selectedTeam.map((pokemon) => (
                            <motion.div
                              key={pokemon.id}
                              initial={{ scale: 0, rotate: 10 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                                delay: selectedTeam.findIndex((p) => p.id === pokemon.id) * 0.1,
                              }}
                            >
                              <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-sm opacity-70 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative bg-background rounded-full p-1">
                                  <img
                                    src={pokemon.sprite || "/placeholder.svg"}
                                    alt={pokemon.name}
                                    className="w-14 h-14"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="w-full max-w-md space-y-6">
                          <div className="p-6 border rounded-lg bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
                            <h3 className="text-lg font-medium mb-4 text-center">Select AI Difficulty</h3>
                            <div className="grid grid-cols-3 gap-3">
                              <Button
                                variant={aiDifficulty === "easy" ? "default" : "outline"}
                                className={
                                  aiDifficulty === "easy"
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none"
                                    : ""
                                }
                                onClick={() => setAiDifficulty("easy")}
                              >
                                Easy
                              </Button>
                              <Button
                                variant={aiDifficulty === "medium" ? "default" : "outline"}
                                className={
                                  aiDifficulty === "medium"
                                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none"
                                    : ""
                                }
                                onClick={() => setAiDifficulty("medium")}
                              >
                                Medium
                              </Button>
                              <Button
                                variant={aiDifficulty === "hard" ? "default" : "outline"}
                                className={
                                  aiDifficulty === "hard"
                                    ? "bg-gradient-to-r from-red-500 to-rose-500 text-white border-none"
                                    : ""
                                }
                                onClick={() => setAiDifficulty("hard")}
                              >
                                Hard
                              </Button>
                            </div>
                            <div className="mt-4 text-sm text-muted-foreground text-center">
                              {aiDifficulty === "easy" && "The AI will make basic moves and use a random team."}
                              {aiDifficulty === "medium" && "The AI will use strategy and a balanced team."}
                              {aiDifficulty === "hard" && "The AI will use advanced tactics and a competitive team."}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md blur-sm opacity-70 group-hover:opacity-100 transition-opacity"></div>
                          <Button
                            size="lg"
                            onClick={startAIBattle}
                            className="relative bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none"
                          >
                            <Cpu className="w-5 h-5 mr-2" /> Start AI Battle
                          </Button>
                        </motion.div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="create-battle">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden border-indigo-200 dark:border-indigo-800/30">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                  <CardTitle>Create a Battle</CardTitle>
                  <CardDescription>Generate an invite code and share it with a friend</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {selectedTeam.length < 6 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg border-muted-foreground/20">
                      <p className="text-muted-foreground mb-4">
                        You need to select 6 Pokémon for your battle team first.
                      </p>
                      <Button variant="outline" onClick={() => setLobbyTab("select-team")}>
                        Select Team
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-6 flex flex-wrap justify-center gap-3">
                          {selectedTeam.map((pokemon) => (
                            <motion.div
                              key={pokemon.id}
                              initial={{ scale: 0, rotate: 10 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                                delay: selectedTeam.findIndex((p) => p.id === pokemon.id) * 0.1,
                              }}
                            >
                              <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-sm opacity-70 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative bg-background rounded-full p-1">
                                  <img
                                    src={pokemon.sprite || "/placeholder.svg"}
                                    alt={pokemon.name}
                                    className="w-14 h-14"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="w-full max-w-md">
                          <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
                            <p className="text-sm text-muted-foreground mb-2">Your battle invite code:</p>
                            <div className="relative flex items-center">
                              <motion.div
                                className="text-3xl font-mono font-bold tracking-widest mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                              >
                                {inviteCode}
                              </motion.div>
                              <div className="absolute -right-16 top-0 flex space-x-1">
                                <Button variant="ghost" size="icon" onClick={copyInviteCode}>
                                  {copied ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={regenerateInviteCode}>
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-center text-muted-foreground">
                              Share this code with a friend to start a battle
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md blur-sm opacity-70 group-hover:opacity-100 transition-opacity"></div>
                          <Button
                            size="lg"
                            onClick={handleCreateInvite}
                            className="relative bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none"
                          >
                            Create Battle & Wait for Opponent
                          </Button>
                        </motion.div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="join-battle">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden border-indigo-200 dark:border-indigo-800/30">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                  <CardTitle>Join a Battle</CardTitle>
                  <CardDescription>Enter an invite code to join a friend's battle</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {selectedTeam.length < 6 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg border-muted-foreground/20">
                      <p className="text-muted-foreground mb-4">
                        You need to select 6 Pokémon for your battle team first.
                      </p>
                      <Button variant="outline" onClick={() => setLobbyTab("select-team")}>
                        Select Team
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-6 flex flex-wrap justify-center gap-3">
                          {selectedTeam.map((pokemon) => (
                            <motion.div
                              key={pokemon.id}
                              initial={{ scale: 0, rotate: 10 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                                delay: selectedTeam.findIndex((p) => p.id === pokemon.id) * 0.1,
                              }}
                            >
                              <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-sm opacity-70 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative bg-background rounded-full p-1">
                                  <img
                                    src={pokemon.sprite || "/placeholder.svg"}
                                    alt={pokemon.name}
                                    className="w-14 h-14"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="w-full max-w-md space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Enter Battle Code</label>
                            <Input
                              placeholder="Enter 6-character invite code"
                              value={joinCode}
                              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                              maxLength={6}
                              className="text-center text-xl font-mono tracking-widest bg-gradient-to-r from-indigo-500/5 to-purple-500/5"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md blur-sm opacity-70 group-hover:opacity-100 transition-opacity"></div>
                          <Button
                            size="lg"
                            onClick={handleJoinBattle}
                            disabled={joinCode.length !== 6}
                            className="relative bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none"
                          >
                            Join Battle
                          </Button>
                        </motion.div>
                      </div>
                    </>
                  )}

                  <AnimatePresence>
                    {incomingInvite && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <Card className="border-indigo-300 dark:border-indigo-700 overflow-hidden">
                          <CardHeader className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 pb-2">
                            <CardTitle className="text-lg flex items-center">
                              <Sparkles className="w-5 h-5 mr-2 text-indigo-500" /> Battle Invitation
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                              <Avatar className="h-12 w-12 border-2 border-indigo-200 dark:border-indigo-800">
                                <AvatarImage
                                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${incomingInvite.from}`}
                                />
                                <AvatarFallback>{incomingInvite.from.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{incomingInvite.from}</p>
                                <p className="text-sm text-muted-foreground">wants to battle with you!</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {incomingInvite.team.slice(0, 3).map((pokemon: TeamMember) => (
                                <div key={pokemon.id} className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-full blur-sm"></div>
                                  <div className="relative bg-background rounded-full p-1">
                                    <img
                                      src={pokemon.sprite || "/placeholder.svg"}
                                      alt={pokemon.name}
                                      className="w-10 h-10"
                                    />
                                  </div>
                                </div>
                              ))}
                              {incomingInvite.team.length > 3 && (
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                                  <span className="text-xs">+{incomingInvite.team.length - 3}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="flex gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                            <Button
                              variant="default"
                              onClick={handleAcceptInvite}
                              disabled={selectedTeam.length !== 6}
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none"
                            >
                              Accept Challenge
                            </Button>
                            <Button variant="outline" onClick={() => declineInvite(incomingInvite.code)}>
                              Decline
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  )
}
