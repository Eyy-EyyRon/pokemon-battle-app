import type { TeamMember, BattleResult } from "./types"

// Configuration flag to determine which storage method to use
let useJsonServer = true

// Function to toggle between json-server and localStorage
export function toggleStorageMethod(useServer: boolean): void {
  useJsonServer = useServer
}

// Function to check if json-server is available
export async function checkJsonServerAvailability(): Promise<boolean> {
  try {
    // First check if the server is running at all
    const response = await fetch("http://localhost:3001", {
      method: "GET",
      // Add a timeout to prevent long waiting times
      signal: AbortSignal.timeout(2000),
    })

    if (!response.ok) return false

    // Then check if the team endpoint exists
    try {
      const teamResponse = await fetch("http://localhost:3001/team", {
        method: "GET",
        signal: AbortSignal.timeout(1000),
      })

      // If team endpoint doesn't exist, try to create it
      if (teamResponse.status === 404) {
        try {
          await fetch("http://localhost:3001/team", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify([]),
          })
          return true
        } catch (error) {
          console.warn("Failed to create team endpoint:", error)
          return false
        }
      }

      return teamResponse.ok
    } catch (error) {
      console.warn("Team endpoint check failed:", error)
      return false
    }
  } catch (error) {
    console.warn("json-server not available, falling back to localStorage:", error)
    return false
  }
}

// Team operations
export async function saveTeam(team: TeamMember[]): Promise<void> {
  if (useJsonServer) {
    try {
      const response = await fetch("http://localhost:3001/team", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(team),
      })

      // If we get a 404, the endpoint doesn't exist
      if (response.status === 404) {
        // Try to create the endpoint with POST
        try {
          await fetch("http://localhost:3001/team", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(team),
          })
        } catch (postError) {
          // If POST also fails, fall back to localStorage
          console.error("Failed to create team endpoint, falling back to localStorage:", postError)
          localStorage.setItem("pokemon-team", JSON.stringify(team))
          // Switch to localStorage mode
          useJsonServer = false
        }
      } else if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }
    } catch (error) {
      console.error("Failed to save team to json-server, falling back to localStorage:", error)
      localStorage.setItem("pokemon-team", JSON.stringify(team))
      // Switch to localStorage mode after an error
      useJsonServer = false
    }
  } else {
    localStorage.setItem("pokemon-team", JSON.stringify(team))
  }
}

export async function loadTeam(): Promise<TeamMember[]> {
  if (useJsonServer) {
    try {
      const response = await fetch("http://localhost:3001/team")
      if (!response.ok) throw new Error("Failed to load team from json-server")
      return await response.json()
    } catch (error) {
      console.error("Failed to load team from json-server, falling back to localStorage:", error)
      const teamData = localStorage.getItem("pokemon-team")
      return teamData ? JSON.parse(teamData) : []
    }
  } else {
    const teamData = localStorage.getItem("pokemon-team")
    return teamData ? JSON.parse(teamData) : []
  }
}

// Battle operations
export async function saveBattle(battle: BattleResult): Promise<void> {
  if (useJsonServer) {
    try {
      await fetch("http://localhost:3001/battles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(battle),
      })
    } catch (error) {
      console.error("Failed to save battle to json-server, falling back to localStorage:", error)
      const battles = await loadBattles()
      localStorage.setItem("pokemon-battles", JSON.stringify([battle, ...battles]))
    }
  } else {
    const battles = await loadBattles()
    localStorage.setItem("pokemon-battles", JSON.stringify([battle, ...battles]))
  }
}

export async function loadBattles(): Promise<BattleResult[]> {
  if (useJsonServer) {
    try {
      const response = await fetch("http://localhost:3001/battles")
      if (!response.ok) throw new Error("Failed to load battles from json-server")
      return await response.json()
    } catch (error) {
      console.error("Failed to load battles from json-server, falling back to localStorage:", error)
      const battleData = localStorage.getItem("pokemon-battles")
      return battleData ? JSON.parse(battleData) : []
    }
  } else {
    const battleData = localStorage.getItem("pokemon-battles")
    return battleData ? JSON.parse(battleData) : []
  }
}

// Invite operations
export async function saveInvite(invite: any): Promise<void> {
  if (useJsonServer) {
    try {
      await fetch("http://localhost:3001/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invite),
      })
    } catch (error) {
      console.error("Failed to save invite to json-server, falling back to localStorage:", error)
      const invites = await loadInvites()
      const existingIndex = invites.findIndex((i: any) => i.code === invite.code)

      if (existingIndex >= 0) {
        invites[existingIndex] = { ...invites[existingIndex], ...invite }
      } else {
        invites.push({ ...invite, id: Date.now() })
      }

      localStorage.setItem("pokemon-invites", JSON.stringify(invites))
    }
  } else {
    const invites = await loadInvites()
    const existingIndex = invites.findIndex((i: any) => i.code === invite.code)

    if (existingIndex >= 0) {
      invites[existingIndex] = { ...invites[existingIndex], ...invite }
    } else {
      invites.push({ ...invite, id: Date.now() })
    }

    localStorage.setItem("pokemon-invites", JSON.stringify(invites))
  }
}

export async function loadInvites(): Promise<any[]> {
  if (useJsonServer) {
    try {
      const response = await fetch("http://localhost:3001/invites")
      if (!response.ok) throw new Error("Failed to load invites from json-server")
      return await response.json()
    } catch (error) {
      console.error("Failed to load invites from json-server, falling back to localStorage:", error)
      const inviteData = localStorage.getItem("pokemon-invites")
      return inviteData ? JSON.parse(inviteData) : []
    }
  } else {
    const inviteData = localStorage.getItem("pokemon-invites")
    return inviteData ? JSON.parse(inviteData) : []
  }
}

export async function updateInvite(id: number, data: any): Promise<void> {
  if (useJsonServer) {
    try {
      await fetch(`http://localhost:3001/invites/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error("Failed to update invite in json-server, falling back to localStorage:", error)
      const invites = await loadInvites()
      const index = invites.findIndex((i: any) => i.id === id)

      if (index >= 0) {
        invites[index] = { ...invites[index], ...data }
        localStorage.setItem("pokemon-invites", JSON.stringify(invites))
      }
    }
  } else {
    const invites = await loadInvites()
    const index = invites.findIndex((i: any) => i.id === id)

    if (index >= 0) {
      invites[index] = { ...invites[index], ...data }
      localStorage.setItem("pokemon-invites", JSON.stringify(invites))
    }
  }
}

export async function getInviteByCode(code: string): Promise<any> {
  if (useJsonServer) {
    try {
      const response = await fetch(`http://localhost:3001/invites?code=${code}`)
      if (!response.ok) throw new Error("Failed to get invite from json-server")
      const invites = await response.json()
      return invites.length > 0 ? invites[0] : null
    } catch (error) {
      console.error("Failed to get invite from json-server, falling back to localStorage:", error)
      const invites = await loadInvites()
      return invites.find((i: any) => i.code === code) || null
    }
  } else {
    const invites = await loadInvites()
    return invites.find((i: any) => i.code === code) || null
  }
}
