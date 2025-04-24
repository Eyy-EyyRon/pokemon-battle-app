// Ability System for Pokémon
// This file contains the definitions and implementations of Pokémon abilities

export interface Ability {
  name: string
  description: string
  battleEffect?: (context: AbilityContext) => void
  passiveEffect?: boolean
  triggerTiming?: "start-of-turn" | "end-of-turn" | "on-hit" | "on-status" | "weather-change" | "switch-in"
}

export interface AbilityContext {
  triggerTiming: string
  pokemon: any
  opponent: any
  weather: string | null
  moveType?: string
  damage?: number
  isAttacking?: boolean
}

// Database of Pokémon abilities
export const abilities: Record<string, Ability> = {
  // Weather abilities
  Drought: {
    name: "Drought",
    description: "Summons harsh sunlight when the Pokémon enters battle.",
    battleEffect: (context) => {
      return { weatherEffect: "sun", weatherTurns: 5 }
    },
    triggerTiming: "switch-in",
  },
  Drizzle: {
    name: "Drizzle",
    description: "Summons rain when the Pokémon enters battle.",
    battleEffect: (context) => {
      return { weatherEffect: "rain", weatherTurns: 5 }
    },
    triggerTiming: "switch-in",
  },
  "Sand Stream": {
    name: "Sand Stream",
    description: "Summons a sandstorm when the Pokémon enters battle.",
    battleEffect: (context) => {
      return { weatherEffect: "sandstorm", weatherTurns: 5 }
    },
    triggerTiming: "switch-in",
  },
  "Snow Warning": {
    name: "Snow Warning",
    description: "Summons hail when the Pokémon enters battle.",
    battleEffect: (context) => {
      return { weatherEffect: "hail", weatherTurns: 5 }
    },
    triggerTiming: "switch-in",
  },

  // Type-based damage modifiers
  Blaze: {
    name: "Blaze",
    description: "Powers up Fire-type moves when the Pokémon's HP is low.",
    battleEffect: (context) => {
      if (
        context.pokemon.currentHp <= context.pokemon.stats.hp / 3 &&
        context.moveType === "fire" &&
        context.isAttacking
      ) {
        return { damageMultiplier: 1.5 }
      }
      return {}
    },
    passiveEffect: true,
  },
  Torrent: {
    name: "Torrent",
    description: "Powers up Water-type moves when the Pokémon's HP is low.",
    battleEffect: (context) => {
      if (
        context.pokemon.currentHp <= context.pokemon.stats.hp / 3 &&
        context.moveType === "water" &&
        context.isAttacking
      ) {
        return { damageMultiplier: 1.5 }
      }
      return {}
    },
    passiveEffect: true,
  },
  Overgrow: {
    name: "Overgrow",
    description: "Powers up Grass-type moves when the Pokémon's HP is low.",
    battleEffect: (context) => {
      if (
        context.pokemon.currentHp <= context.pokemon.stats.hp / 3 &&
        context.moveType === "grass" &&
        context.isAttacking
      ) {
        return { damageMultiplier: 1.5 }
      }
      return {}
    },
    passiveEffect: true,
  },
  Swarm: {
    name: "Swarm",
    description: "Powers up Bug-type moves when the Pokémon's HP is low.",
    battleEffect: (context) => {
      if (
        context.pokemon.currentHp <= context.pokemon.stats.hp / 3 &&
        context.moveType === "bug" &&
        context.isAttacking
      ) {
        return { damageMultiplier: 1.5 }
      }
      return {}
    },
    passiveEffect: true,
  },

  // Status condition abilities
  Immunity: {
    name: "Immunity",
    description: "Prevents the Pokémon from getting poisoned.",
    battleEffect: (context) => {
      if (context.pokemon.status?.type === "poison") {
        return { preventStatus: true }
      }
      return {}
    },
    passiveEffect: true,
  },
  Limber: {
    name: "Limber",
    description: "Prevents the Pokémon from getting paralyzed.",
    battleEffect: (context) => {
      if (context.pokemon.status?.type === "paralysis") {
        return { preventStatus: true }
      }
      return {}
    },
    passiveEffect: true,
  },
  "Water Veil": {
    name: "Water Veil",
    description: "Prevents the Pokémon from getting burned.",
    battleEffect: (context) => {
      if (context.pokemon.status?.type === "burn") {
        return { preventStatus: true }
      }
      return {}
    },
    passiveEffect: true,
  },
  Insomnia: {
    name: "Insomnia",
    description: "Prevents the Pokémon from falling asleep.",
    battleEffect: (context) => {
      if (context.pokemon.status?.type === "sleep") {
        return { preventStatus: true }
      }
      return {}
    },
    passiveEffect: true,
  },

  // Weather-based abilities
  "Swift Swim": {
    name: "Swift Swim",
    description: "Boosts the Pokémon's Speed stat in rain.",
    battleEffect: (context) => {
      if (context.weather === "rain") {
        return { speedMultiplier: 2.0 }
      }
      return {}
    },
    passiveEffect: true,
  },
  Chlorophyll: {
    name: "Chlorophyll",
    description: "Boosts the Pokémon's Speed stat in harsh sunlight.",
    battleEffect: (context) => {
      if (context.weather === "sun") {
        return { speedMultiplier: 2.0 }
      }
      return {}
    },
    passiveEffect: true,
  },
  "Sand Rush": {
    name: "Sand Rush",
    description: "Boosts the Pokémon's Speed stat in a sandstorm.",
    battleEffect: (context) => {
      if (context.weather === "sandstorm") {
        return { speedMultiplier: 2.0 }
      }
      return {}
    },
    passiveEffect: true,
  },
  
  "Solar Power": {
    name: "Solar Power",
    description: "Boosts Special Attack in harsh sunlight, but HP decreases.",
    battleEffect: (context) => {
      if (context.weather === "sun") {
        if (context.triggerTiming === "end-of-turn") {
          return { damage: Math.floor(context.pokemon.stats.hp / 8) }
        }
        if (context.isAttacking) {
          return { damageMultiplier: 1.5 }
        }
      }
      return {}
    },
    triggerTiming: "end-of-turn",
  },

  // Damage modifiers
  Intimidate: {
    name: "Intimidate",
    description: "Lowers the opponent's Attack stat when the Pokémon enters battle.",
    battleEffect: (context) => {
      return { opponentStatChange: { attack: -1 } }
    },
    triggerTiming: "switch-in",
  },
  Levitate: {
    name: "Levitate",
    description: "Gives immunity to Ground-type moves.",
    battleEffect: (context) => {
      if (context.moveType === "ground" && !context.isAttacking) {
        return { immuneToMove: true }
      }
      return {}
    },
    passiveEffect: true,
  },
  "Flash Fire": {
    name: "Flash Fire",
    description: "Powers up Fire-type moves if hit by one.",
    battleEffect: (context) => {
      if (context.moveType === "fire" && !context.isAttacking) {
        return { immuneToMove: true, activateEffect: "flash-fire" }
      }
      if (context.pokemon.effects?.includes("flash-fire") && context.moveType === "fire" && context.isAttacking) {
        return { damageMultiplier: 1.5 }
      }
      return {}
    },
    passiveEffect: true,
  },
  "Wonder Guard": {
    name: "Wonder Guard",
    description: "Only super-effective moves will hit the Pokémon.",
    battleEffect: (context) => {
      if (!context.isAttacking && context.damage && context.damage > 0) {
        // Calculate effectiveness
        const effectiveness = calculateTypeEffectiveness(context.moveType || "normal", context.pokemon.types)
        if (effectiveness <= 1) {
          return { immuneToMove: true }
        }
      }
      return {}
    },
    passiveEffect: true,
  },

  // Miscellaneous abilities
  Sturdy: {
    name: "Sturdy",
    description: "The Pokémon cannot be knocked out with one hit if at full HP.",
    battleEffect: (context) => {
      if (
        context.pokemon.currentHp === context.pokemon.stats.hp &&
        !context.isAttacking &&
        context.damage &&
        context.damage >= context.pokemon.currentHp
      ) {
        return { surviveWithHp: 1 }
      }
      return {}
    },
    passiveEffect: true,
  },
  Guts: {
    name: "Guts",
    description: "Boosts Attack if the Pokémon has a status condition.",
    battleEffect: (context) => {
      if (context.pokemon.status && context.isAttacking) {
        return { damageMultiplier: 1.5 }
      }
      return {}
    },
    passiveEffect: true,
  },
  "Marvel Scale": {
    name: "Marvel Scale",
    description: "Boosts Defense if the Pokémon has a status condition.",
    battleEffect: (context) => {
      if (context.pokemon.status && !context.isAttacking) {
        return { defenseMultiplier: 1.5 }
      }
      return {}
    },
    passiveEffect: true,
  },
  "Speed Boost": {
    name: "Speed Boost",
    description: "Increases Speed at the end of each turn.",
    battleEffect: (context) => {
      return { statChange: { speed: 1 } }
    },
    triggerTiming: "end-of-turn",
  },
}

// Helper function to calculate type effectiveness (simplified version)
function calculateTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
  // This is a simplified version - in a real implementation, you would use the full type chart
  return 1.0
}

// Get a random ability for a Pokémon based on its types
export function getRandomAbilityForPokemon(types: string[]): Ability {
  // Map of type to common abilities for that type
  const typeToAbilities: Record<string, string[]> = {
    normal: ["Limber", "Guts", "Intimidate"],
    fire: ["Blaze", "Flash Fire", "Drought", "Solar Power"],
    water: ["Torrent", "Swift Swim", "Drizzle", "Water Veil"],
    electric: ["Static", "Volt Absorb", "Lightning Rod"],
    grass: ["Overgrow", "Chlorophyll", "Solar Power"],
    ice: ["Snow Warning", "Ice Body", "Snow Cloak"],
    fighting: ["Guts", "Iron Fist", "Steadfast"],
    poison: ["Poison Point", "Liquid Ooze", "Immunity"],
    ground: ["Sand Stream", "Sand Rush", "Sand Force"],
    flying: ["Keen Eye", "Big Pecks", "Gale Wings"],
    psychic: ["Synchronize", "Magic Bounce", "Telepathy"],
    bug: ["Swarm", "Compound Eyes", "Shield Dust"],
    rock: ["Sturdy", "Rock Head", "Sand Stream"],
    ghost: ["Levitate", "Cursed Body", "Insomnia"],
    dragon: ["Intimidate", "Multiscale", "Marvel Scale"],
    dark: ["Intimidate", "Pressure", "Justified"],
    steel: ["Sturdy", "Heavy Metal", "Clear Body"],
    fairy: ["Cute Charm", "Magic Guard", "Pixilate"],
  }

  // Collect all possible abilities for the Pokémon's types
  let possibleAbilities: string[] = []
  for (const type of types) {
    if (typeToAbilities[type]) {
      possibleAbilities = [...possibleAbilities, ...typeToAbilities[type]]
    }
  }

  // If no type-specific abilities, use some generic ones
  if (possibleAbilities.length === 0) {
    possibleAbilities = ["Intimidate", "Sturdy", "Guts", "Speed Boost"]
  }

  // Filter out duplicates
  possibleAbilities = [...new Set(possibleAbilities)]

  // Select a random ability
  const randomAbility = possibleAbilities[Math.floor(Math.random() * possibleAbilities.length)]

  // Return the ability object, or a default if not found
  return (
    abilities[randomAbility] || {
      name: "Keen Eye",
      description: "Prevents the Pokémon from losing accuracy.",
      passiveEffect: true,
    }
  )
}
