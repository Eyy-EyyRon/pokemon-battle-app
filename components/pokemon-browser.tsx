"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import PokemonCard from "./pokemon-card"
import PokemonDetail from "./pokemon-detail"
import TeamBuilder from "./team-builder"
import BattleSimulator from "./battle-simulator"
import MultiplayerLobby from "./multiplayer-lobby"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { useMultiplayer } from "@/context/multiplayer-context"
import type { Pokemon, TeamMember } from "@/lib/types"
import { fetchPokemonList, searchPokemon } from "@/lib/pokemon-service"
import { loadTeam, saveTeam, checkJsonServerAvailability, toggleStorageMethod } from "@/lib/storage-service"
import StorageModeToggle from "./storage-mode-toggle"

interface PokemonBrowserProps {
  username: string
}

export default function PokemonBrowser({ username }: PokemonBrowserProps) {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([])
  const [filteredList, setFilteredList] = useState<Pokemon[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)
  const [team, setTeam] = useState<TeamMember[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("browse")
  const [storageMode, setStorageMode] = useState<"server" | "local">("server")
  const { toast } = useToast()
  const { incomingInvite, isInBattle } = useMultiplayer()
  const itemsPerPage = 12

  // Check json-server availability on component mount
  useEffect(() => {
    const checkServerAvailability = async () => {
      const isServerAvailable = await checkJsonServerAvailability()
      if (!isServerAvailable) {
        setStorageMode("local")
        toggleStorageMethod(false)
        toast({
          title: "Using Local Storage",
          description: "Could not connect to json-server. Using localStorage for data persistence instead.",
          variant: "default",
        })
      }
    }

    checkServerAvailability()
  }, [toast])

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      try {
        // Load Pokémon list
        const pokemonData = await fetchPokemonList(currentPage, itemsPerPage)
        setPokemonList(pokemonData)
        setFilteredList(pokemonData)

        // Load team using storage service
        try {
          const teamData = await loadTeam()
          setTeam(teamData)
        } catch (error) {
          console.error("Failed to load team:", error)
          toast({
            title: "Data Loading Error",
            description: "Could not load your team data. Starting with an empty team.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Failed to load initial data:", error)
        toast({
          title: "Error",
          description: "Failed to load Pokémon data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [currentPage, toast])

  // Show notification when receiving an invite
  useEffect(() => {
    if (incomingInvite) {
      toast({
        title: "Battle Invite!",
        description: `${incomingInvite.from} has invited you to battle!`,
        variant: "default",
        action: (
          <Button size="sm" onClick={() => setActiveTab("multiplayer")}>
            View
          </Button>
        ),
      })
    }
  }, [incomingInvite, toast])

  // Redirect to battle when battle starts
  useEffect(() => {
    if (isInBattle) {
      setActiveTab("multiplayer")
    }
  }, [isInBattle])

  const handleSearch = async () => {
    if (searchQuery.trim() === "") {
      setFilteredList(pokemonList)
      return
    }

    setIsLoading(true)
    try {
      const results = await searchPokemon(searchQuery.toLowerCase())
      setFilteredList(results)
    } catch (error) {
      console.error("Search failed:", error)
      toast({
        title: "Search Failed",
        description: "Unable to find Pokémon. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePokemonSelect = (pokemon: Pokemon) => {
    setSelectedPokemon(pokemon)
    setActiveTab("details")
  }

  const handleAddToTeam = async (pokemon: Pokemon) => {
    if (team.length >= 6) {
      toast({
        title: "Team Full",
        description: "Your team is already full! Remove a Pokémon before adding a new one.",
        variant: "destructive",
      })
      return
    }
  
    if (team.some((p) => p.id === pokemon.id)) {
      toast({
        title: "Already in Team",
        description: "This Pokémon is already in your team!",
        variant: "destructive",
      })
      return
    }
  
    const newTeamMember: TeamMember = {
      id: pokemon.id,
      name: pokemon.name,
      sprite: pokemon.sprites.front_default,
      spriteBack: pokemon.sprites.back_default,
      spriteOfficial:
        pokemon.sprites.other?.["official-artwork"]?.front_default || pokemon.sprites.front_default,
      stats: pokemon.stats.map((s) => ({ base_stat: s.base_stat, stat: s.stat })), // ⬅️ Map to include base_stat and stat
      types: pokemon.types,
    }
  
    const updatedTeam = [...team, newTeamMember]
    setTeam(updatedTeam)
  
    try {
      await saveTeam(updatedTeam)
      toast({
        title: "Pokémon Added",
        description: `${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} was added to your team!`,
      })
    } catch (error) {
      console.error("Failed to save team:", error)
      toast({
        title: "Error",
        description: "Failed to save team. Your changes may not persist after reload.",
        variant: "destructive",
      })
    }
  }
  

  const handleRemoveFromTeam = async (pokemonId: number) => {
    const updatedTeam = team.filter((p) => p.id !== pokemonId)
    setTeam(updatedTeam)

    // Save using storage service
    try {
      await saveTeam(updatedTeam)

      toast({
        title: "Pokémon Removed",
        description: "Pokémon was removed from your team.",
      })
    } catch (error) {
      console.error("Failed to update team:", error)
      toast({
        title: "Error",
        description: "Failed to update team. Your changes may not persist after reload.",
        variant: "destructive",
      })
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    setSearchQuery("")
  }

  const toggleStorage = async () => {
    const newMode = storageMode === "server" ? "local" : "server"

    if (newMode === "server") {
      const isServerAvailable = await checkJsonServerAvailability()
      if (!isServerAvailable) {
        toast({
          title: "Server Unavailable",
          description: "Could not connect to json-server. Staying with localStorage.",
          variant: "destructive",
        })
        return
      }
    }

    setStorageMode(newMode)
    toggleStorageMethod(newMode === "server")

    toast({
      title: `Using ${newMode === "server" ? "Server" : "Local"} Storage`,
      description: `Switched to ${newMode === "server" ? "json-server" : "localStorage"} for data persistence.`,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <motion.h1
          className="text-4xl font-bold"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Pokémon Battle App
        </motion.h1>

        <motion.div
          className="flex items-center gap-3 mt-4 sm:mt-0"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="outline" className="px-3 py-1">
            Trainer
          </Badge>
          <Avatar>
            <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${username}`} alt={username} />
            <AvatarFallback>{username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{username}</span>
          <StorageModeToggle />
        </motion.div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="team">My Team</TabsTrigger>
          <TabsTrigger value="battle">Battle</TabsTrigger>
          <TabsTrigger value="multiplayer" className="relative">
            Multiplayer
            {incomingInvite && (
              <span className="absolute top-0 right-0 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {activeTab === "browse" && (
            <TabsContent key="browse" value="browse" className="space-y-4">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Search Pokémon..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch}>Search</Button>
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredList.map((pokemon, index) => (
                        <motion.div
                          key={pokemon.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                        >
                          <PokemonCard pokemon={pokemon} onSelect={handlePokemonSelect} onAddToTeam={handleAddToTeam} />
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex justify-center gap-2 mt-6">
                      <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || isLoading}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-4">Page {currentPage}</span>
                      <Button onClick={() => handlePageChange(currentPage + 1)} disabled={isLoading}>
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            </TabsContent>
          )}

          {activeTab === "details" && (
            <TabsContent key="details" value="details">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {selectedPokemon ? (
                  <PokemonDetail pokemon={selectedPokemon} onAddToTeam={handleAddToTeam} />
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-medium">Select a Pokémon to view details</h3>
                  </div>
                )}
              </motion.div>
            </TabsContent>
          )}

          {activeTab === "team" && (
            <TabsContent key="team" value="team">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <TeamBuilder team={team} onRemoveFromTeam={handleRemoveFromTeam} />
              </motion.div>
            </TabsContent>
          )}

          {activeTab === "battle" && (
            <TabsContent key="battle" value="battle">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <BattleSimulator team={team} username={username} />
              </motion.div>
            </TabsContent>
          )}

          {activeTab === "multiplayer" && (
            <TabsContent key="multiplayer" value="multiplayer">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MultiplayerLobby team={team} username={username} />
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </motion.div>
  )
}
