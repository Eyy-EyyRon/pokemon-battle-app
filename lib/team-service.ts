// Maximum team size
const MAX_TEAM_SIZE = 6

// Interface for Pokemon in the team
interface TeamPokemon {
  currentHp: number | undefined
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
  favorite?: boolean
  ability?: {
    name: string
    description: string
  }
}

// Use localStorage as a fallback when JSON server is not available
const LOCAL_STORAGE_KEY = "pokemon-team"

// Helper function to get team from localStorage
function getTeamFromLocalStorage(): TeamPokemon[] {
  if (typeof window === "undefined") return []

  try {
    const storedTeam = localStorage.getItem(LOCAL_STORAGE_KEY)
    return storedTeam ? JSON.parse(storedTeam) : []
  } catch (error) {
    console.error("Error reading from localStorage:", error)
    return []
  }
}

// Helper function to save team to localStorage
function saveTeamToLocalStorage(team: TeamPokemon[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(team))
  } catch (error) {
    console.error("Error saving to localStorage:", error)
  }
}

// Get the current team from json-server or localStorage
export async function getTeam(): Promise<TeamPokemon[]> {
  try {
    // Try to fetch from JSON server with a very short timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 500) // Short timeout

    try {
      const response = await fetch("http://localhost:3001/team", {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error("Failed to fetch team from server")
      }

      const team = await response.json()
      // Also update localStorage for backup
      saveTeamToLocalStorage(team)
      return team
    } catch (error) {
      // Any error (timeout, network error, etc.) will fall through here
      console.warn("Falling back to localStorage:", error)
      return getTeamFromLocalStorage()
    }
  } catch (error) {
    console.error("Error getting team:", error)
    // Always return an array, even if there's an error
    return []
  }
}

// Add a Pokemon to the team
export async function addToTeam(pokemon: TeamPokemon, replace = false): Promise<void> {
  try {
    // Fetch full Pokémon data (including stats, moves, etc.) if not already present
    const fullPokemonData = await fetchPokemonDetails(pokemon.id)

    // Get current team
    const currentTeam = await getTeam()

    // Check if Pokemon is already in team
    const existingIndex = currentTeam.findIndex((p) => p.id === fullPokemonData.id)
    const exists = existingIndex !== -1

    if (exists && !replace) {
      throw new Error(`${fullPokemonData.name} is already in your team!`)
    }

    // Check if team is full
    if (!exists && currentTeam.length >= MAX_TEAM_SIZE) {
      throw new Error(`Your team is full! Maximum ${MAX_TEAM_SIZE} Pokémon allowed.`)
    }

    // Create updated team
    let updatedTeam
    if (exists && replace) {
      // Replace the existing Pokemon
      updatedTeam = [...currentTeam]
      updatedTeam[existingIndex] = fullPokemonData
    } else {
      // Add new Pokemon
      updatedTeam = [...currentTeam, fullPokemonData]
    }

    try {
      if (exists && replace) {
        // Update existing Pokemon
        const response = await fetch(`http://localhost:3001/team/${fullPokemonData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fullPokemonData),
          signal: AbortSignal.timeout(3000),
        })

        if (!response.ok) {
          throw new Error("Failed to update Pokémon in team on server")
        }
      } else {
        // Add new Pokemon
        const response = await fetch("http://localhost:3001/team", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fullPokemonData),
          signal: AbortSignal.timeout(3000),
        })

        if (!response.ok) {
          throw new Error("Failed to add Pokémon to team on server")
        }
      }

      // Update localStorage regardless of server response
      saveTeamToLocalStorage(updatedTeam)
    } catch (error) {
      console.warn("Falling back to localStorage for team management:", error)
      // Fallback to localStorage
      saveTeamToLocalStorage(updatedTeam)
    }
  } catch (error) {
    console.error("Error managing team:", error)
    throw error
  }
}

// Fetch full Pokémon data from PokeAPI (or your chosen source)
async function fetchPokemonDetails(id: number): Promise<TeamPokemon> {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch data for Pokémon with ID ${id}`)
  }

  const data = await response.json()

  // Transform PokeAPI response into your desired format (TeamPokemon)
  return {
    id: data.id,
    name: data.name,
    sprite: data.sprites.front_default,
    types: data.types.map((type: any) => type.type.name),
    stats: data.stats.reduce((acc: any, stat: any) => {
      acc[stat.stat.name] = stat.base_stat
      return acc
    }, {}),
    moves: data.moves.map((move: any) => move.move.name),
    ability: {
      name: data.abilities[0].ability.name,
      description: data.abilities[0].ability.url, // Optional, you can fetch description if needed
    },
    currentHp: data.stats.find((stat: any) => stat.stat.name === "hp")?.base_stat || 0 // Initialize currentHp
  }
}


// Remove a Pokemon from the team
export async function removeFromTeam(id: number): Promise<void> {
  try {
    // Get current team first
    const currentTeam = await getTeam()

    // Create updated team without the removed Pokémon
    const updatedTeam = currentTeam.filter((pokemon) => pokemon.id !== id)

    try {
      // Try to remove from JSON server
      const response = await fetch(`http://localhost:3001/team/${id}`, {
        method: "DELETE",
        signal: AbortSignal.timeout(3000),
      })

      if (!response.ok) {
        throw new Error("Failed to remove Pokémon from team on server")
      }

      // Update localStorage regardless of server response
      saveTeamToLocalStorage(updatedTeam)
    } catch (error) {
      console.warn("Falling back to localStorage for removing Pokémon:", error)
      // Fallback to localStorage, removing Pokémon from the team
      saveTeamToLocalStorage(updatedTeam)
    }

    // Return the updated team
    return Promise.resolve()
  } catch (error) {
    console.error("Error removing from team:", error)
    throw error
  }
}



// Toggle favorite status for a Pokemon
export async function toggleFavorite(id: number): Promise<void> {
  try {
    // Get current team
    const currentTeam = await getTeam()

    // Find the Pokemon
    const pokemonIndex = currentTeam.findIndex((p) => p.id === id)
    if (pokemonIndex === -1) {
      throw new Error("Pokémon not found in team")
    }

    // Toggle favorite status
    const updatedPokemon = {
      ...currentTeam[pokemonIndex],
      favorite: !currentTeam[pokemonIndex].favorite,
    }

    // Update the team
    const updatedTeam = [...currentTeam]
    updatedTeam[pokemonIndex] = updatedPokemon

    try {
      // Update on server
      const response = await fetch(`http://localhost:3001/team/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPokemon),
        signal: AbortSignal.timeout(3000),
      })

      if (!response.ok) {
        throw new Error("Failed to update Pokémon in team on server")
      }

      // Update localStorage
      saveTeamToLocalStorage(updatedTeam)
    } catch (error) {
      console.warn("Falling back to localStorage for updating Pokémon:", error)
      // Fallback to localStorage
      saveTeamToLocalStorage(updatedTeam)
    }
  } catch (error) {
    console.error("Error toggling favorite:", error)
    throw error
  }
}

// Reorder team (drag and drop functionality)
export async function reorderTeam(startIndex: number, endIndex: number): Promise<void> {
  try {
    // Get current team
    const currentTeam = await getTeam()

    // Perform the reorder
    const result = Array.from(currentTeam)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    // Save the reordered team
    try {
      // This would require a bulk update endpoint on the server
      // For simplicity, we'll just update localStorage
      saveTeamToLocalStorage(result)

      // In a real implementation, you would update the server as well
    } catch (error) {
      console.warn("Error updating team order on server:", error)
      // Fallback to localStorage
      saveTeamToLocalStorage(result)
    }
  } catch (error) {
    console.error("Error reordering team:", error)
    throw error
  }
}
