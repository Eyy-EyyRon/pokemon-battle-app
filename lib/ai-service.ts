import type { TeamMember } from "./types"
import { calculateDamage } from "./battle-utils"

/**
 * Generates a team of Pokémon for the AI opponent based on difficulty
 * @param difficulty The difficulty level of the AI
 * @param playerTeam The player's team for reference
 * @returns A team of Pokémon for the AI
 */
export async function generateAITeam(
  difficulty: "easy" | "medium" | "hard",
  playerTeam: TeamMember[],
): Promise<TeamMember[]> {
  // For now, we'll create a simple AI team based on the player's team
  // In a real implementation, you might fetch this from an API or have a more complex algorithm

  // Clone the player's team as a starting point
  const aiTeam: TeamMember[] = JSON.parse(JSON.stringify(playerTeam))

  // Modify the team based on difficulty
  aiTeam.forEach((pokemon, index) => {
    // Give each Pokémon a unique ID to avoid conflicts
    pokemon.id = `ai-${pokemon.id}`

    // Adjust stats based on difficulty
    const statMultiplier = difficulty === "easy" ? 0.8 : difficulty === "medium" ? 1.0 : 1.2

    pokemon.stats = pokemon.stats.map((stat) => ({
      ...stat,
      base_stat: Math.floor(stat.base_stat * statMultiplier),
    }))

    // For hard difficulty, potentially swap some Pokémon types to counter the player's team
    if (difficulty === "hard" && Math.random() > 0.5) {
      // This is a simplified version - a real implementation would be more sophisticated
      const counterTypes: Record<string, string[]> = {
        fire: ["water", "rock", "ground"],
        water: ["electric", "grass"],
        grass: ["fire", "ice", "flying", "bug"],
        electric: ["ground"],
        ice: ["fire", "fighting", "rock", "steel"],
        fighting: ["flying", "psychic", "fairy"],
        poison: ["ground", "psychic"],
        ground: ["water", "grass", "ice"],
        flying: ["electric", "ice", "rock"],
        psychic: ["bug", "ghost", "dark"],
        bug: ["fire", "flying", "rock"],
        rock: ["water", "grass", "fighting", "ground", "steel"],
        ghost: ["ghost", "dark"],
        dragon: ["ice", "dragon", "fairy"],
        dark: ["fighting", "bug", "fairy"],
        steel: ["fire", "fighting", "ground"],
        fairy: ["poison", "steel"],
      }

      // Get player's primary types
      const playerTypes = playerTeam.map((p) => p.types[0]?.type.name || "normal")

      // Try to counter one of the player's types
      const typeToCounter = playerTypes[Math.floor(Math.random() * playerTypes.length)]
      if (typeToCounter && counterTypes[typeToCounter]) {
        const counterType = counterTypes[typeToCounter][Math.floor(Math.random() * counterTypes[typeToCounter].length)]

        // Apply the counter type to this Pokémon
        if (counterType) {
          pokemon.types = [{ type: { name: counterType } }]
        }
      }
    }
  })

  return aiTeam
}

/**
 * Determines what action the AI should take during its turn
 * @param aiPokemon The current AI Pokémon
 * @param playerPokemon The current player Pokémon
 * @param aiHP The current HP of the AI Pokémon
 * @param playerHP The current HP of the player Pokémon
 * @param aiTeam The full AI team
 * @param aiDefeatedPokemon The AI's defeated Pokémon
 * @param difficulty The difficulty level of the AI
 * @returns The AI's decision
 */
export async function getAIDecision(
  aiPokemon: TeamMember,
  playerPokemon: TeamMember,
  aiHP: number,
  playerHP: number,
  aiTeam: TeamMember[],
  aiDefeatedPokemon: TeamMember[],
  difficulty: "easy" | "medium" | "hard",
): Promise<{ action: "attack" | "switch"; attackType?: "normal" | "special"; pokemonId?: string }> {
  // Simple AI decision making logic

  // Calculate HP percentages
  const aiMaxHP = aiPokemon.stats.find((s) => s.stat.name === "hp")?.base_stat || 100
  const aiHPPercentage = (aiHP / aiMaxHP) * 100

  // Get available Pokémon to switch to
  const availablePokemon = aiTeam.filter((p) => !aiDefeatedPokemon.includes(p) && p.id !== aiPokemon.id)

  // Determine if we should switch
  let shouldSwitch = false

  // If HP is low and we're not on easy difficulty, consider switching
  if (aiHPPercentage < 30 && difficulty !== "easy" && availablePokemon.length > 0) {
    shouldSwitch = Math.random() < (difficulty === "hard" ? 0.7 : 0.4)
  }

  // Check type disadvantage for hard difficulty
  if (difficulty === "hard" && !shouldSwitch && availablePokemon.length > 0) {
    const playerType = playerPokemon.types[0]?.type.name || "normal"
    const aiType = aiPokemon.types[0]?.type.name || "normal"

    // This is a simplified check - a real implementation would use the full type chart
    const typeDisadvantages: Record<string, string[]> = {
      fire: ["water", "rock", "ground"],
      water: ["electric", "grass"],
      grass: ["fire", "ice", "flying", "bug"],
      electric: ["ground"],
      ice: ["fire", "fighting", "rock", "steel"],
      // Add more as needed
    }

    if (typeDisadvantages[aiType]?.includes(playerType)) {
      shouldSwitch = Math.random() < 0.6
    }
  }

  // If we decide to switch
  if (shouldSwitch) {
    // Find the best Pokémon to switch to
    let bestPokemon = availablePokemon[0]

    if (difficulty === "hard" && availablePokemon.length > 1) {
      // For hard difficulty, try to find a type advantage
      const playerType = playerPokemon.types[0]?.type.name || "normal"

      // Find a Pokémon with type advantage if possible
      const typeAdvantages: Record<string, string[]> = {
        fire: ["grass", "ice", "bug", "steel"],
        water: ["fire", "ground", "rock"],
        grass: ["water", "ground", "rock"],
        electric: ["water", "flying"],
        ice: ["grass", "ground", "flying", "dragon"],
        // Add more as needed
      }

      for (const pokemon of availablePokemon) {
        const pokemonType = pokemon.types[0]?.type.name || "normal"
        if (typeAdvantages[pokemonType]?.includes(playerType)) {
          bestPokemon = pokemon
          break
        }
      }
    }

    return {
      action: "switch",
      pokemonId: bestPokemon.id,
    }
  }

  // If we're attacking, decide between normal and special attack
  const attackStat = aiPokemon.stats.find((s) => s.stat.name === "attack")?.base_stat || 50
  const specialAttackStat =
    aiPokemon.stats.find((s) => s.stat.name === "special-attack")?.base_stat ||
    aiPokemon.stats.find((s) => s.stat.name === "attack")?.base_stat ||
    50

  // Choose attack type based on which stat is higher
  let attackType: "normal" | "special" = attackStat > specialAttackStat ? "normal" : "special"

  // For easy difficulty, sometimes choose randomly
  if (difficulty === "easy" && Math.random() < 0.4) {
    attackType = Math.random() < 0.5 ? "normal" : "special"
  }

  // For hard difficulty, calculate which attack would do more damage
  if (difficulty === "hard") {
    const normalDamage = calculateDamage(
      aiPokemon,
      playerPokemon,
      "normal",
      aiPokemon.types[0]?.type.name || "normal",
    ).damage

    const specialDamage = calculateDamage(
      aiPokemon,
      playerPokemon,
      "special",
      aiPokemon.types[0]?.type.name || "normal",
    ).damage

    attackType = normalDamage > specialDamage ? "normal" : "special"
  }

  return {
    action: "attack",
    attackType,
  }
}
