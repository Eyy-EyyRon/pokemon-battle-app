// Interface for battle result
interface BattleResult {
  winnerId: number
  winnerName: string
  loserId: number
  loserName: string
  date: string
  battleType?: string
  turns?: number
  battleLog?: BattleLogEntry[]
}

interface BattleLogEntry {
  turn: number
  attackerId: number
  attackerName: string
  defenderId: number
  move: string
  damage: number
  defenderHpAfter: number
}

// Use localStorage as a fallback when JSON server is not available
const LOCAL_STORAGE_KEY = "pokemon-battles"
const INVITE_CODES_KEY = "pokemon-invite-codes"

// Helper function to get battles from localStorage
function getBattlesFromLocalStorage(): any[] {
  if (typeof window === "undefined") return []

  try {
    const storedBattles = localStorage.getItem(LOCAL_STORAGE_KEY)
    return storedBattles ? JSON.parse(storedBattles) : []
  } catch (error) {
    console.error("Error reading from localStorage:", error)
    return []
  }
}

// Helper function to save battles to localStorage
function saveBattlesToLocalStorage(battles: any[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(battles))
  } catch (error) {
    console.error("Error saving to localStorage:", error)
  }
}

// Save battle result to json-server or localStorage
export async function saveBattleResult(result: BattleResult): Promise<void> {
  try {
    // Add an ID to the result if saving to localStorage
    const resultWithId = {
      ...result,
      id: Date.now(), // Use timestamp as a simple ID
    }

    try {
      // Try to save to JSON server
      const response = await fetch("http://localhost:3001/battles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
        // Add a timeout to prevent long waiting times
        signal: AbortSignal.timeout(3000),
      })

      if (!response.ok) {
        throw new Error("Failed to save battle result to server")
      }
    } catch (error) {
      console.warn("Falling back to localStorage for saving battle:", error)
      // Fallback to localStorage
      const currentBattles = getBattlesFromLocalStorage()
      saveBattlesToLocalStorage([...currentBattles, resultWithId])
    }
  } catch (error) {
    console.error("Error saving battle result:", error)
    throw error
  }
}

// Update the getBattleHistory function to better handle errors
export async function getBattleHistory(): Promise<any[]> {
  try {
    // Try to fetch from JSON server with a short timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 500)

    try {
      const response = await fetch("http://localhost:3001/battles?_sort=date&_order=desc", {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error("Failed to fetch battle history from server")
      }

      const battles = await response.json()
      // Also update localStorage for backup
      saveBattlesToLocalStorage(battles)
      return battles
    } catch (error) {
      console.warn("Falling back to localStorage for battle history:", error)
      // Fallback to localStorage
      const localBattles = getBattlesFromLocalStorage()
      // Sort by date descending to match the server behavior
      return localBattles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }
  } catch (error) {
    console.error("Error getting battle history:", error)
    // Always return an array, even if there's an error
    return []
  }
}

// Generate a unique invite code
export function generateInviteCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed similar looking characters
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  // Store the code in localStorage
  if (typeof window !== "undefined") {
    try {
      const existingCodes = JSON.parse(localStorage.getItem(INVITE_CODES_KEY) || "{}")
      existingCodes[code] = {
        createdAt: new Date().toISOString(),
        status: "waiting", // waiting, active, completed
      }
      localStorage.setItem(INVITE_CODES_KEY, JSON.stringify(existingCodes))
    } catch (error) {
      console.error("Error storing invite code:", error)
    }
  }

  return code
}

// Validate an invite code
export function validateInviteCode(code: string): boolean {
  if (typeof window === "undefined") return false

  try {
    const existingCodes = JSON.parse(localStorage.getItem(INVITE_CODES_KEY) || "{}")
    return !!existingCodes[code] && existingCodes[code].status === "waiting"
  } catch (error) {
    console.error("Error validating invite code:", error)
    return false
  }
}

// Update invite code status
export function updateInviteCodeStatus(code: string, status: "waiting" | "active" | "completed"): boolean {
  if (typeof window === "undefined") return false

  try {
    const existingCodes = JSON.parse(localStorage.getItem(INVITE_CODES_KEY) || "{}")
    if (existingCodes[code]) {
      existingCodes[code].status = status
      localStorage.setItem(INVITE_CODES_KEY, JSON.stringify(existingCodes))
      return true
    }
    return false
  } catch (error) {
    console.error("Error updating invite code status:", error)
    return false
  }
}
