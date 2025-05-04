// Type effectiveness chart
// Values: 0 = immune, 0.5 = not very effective, 1 = normal, 2 = super effective
export const typeEffectivenessChart: Record<string, Record<string, number>> = {
  normal: {
    rock: 0.5,
    ghost: 0,
    steel: 0.5,
  },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
    steel: 2,
  },
  water: {
    fire: 2,
    water: 0.5,
    grass: 0.5,
    ground: 2,
    rock: 2,
    dragon: 0.5,
  },
  electric: {
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5,
  },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 0.5,
    ground: 2,
    flying: 2,
    dragon: 2,
    steel: 0.5,
  },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: {
    grass: 2,
    poison: 0.5,
    ground: 0.5,
    rock: 0.5,
    ghost: 0.5,
    steel: 0,
    fairy: 2,
  },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
    steel: 2,
  },
  flying: {
    electric: 0.5,
    grass: 2,
    fighting: 2,
    bug: 2,
    rock: 0.5,
    steel: 0.5,
  },
  psychic: {
    fighting: 2,
    poison: 2,
    psychic: 0.5,
    dark: 0,
    steel: 0.5,
  },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: {
    fire: 2,
    ice: 2,
    fighting: 0.5,
    ground: 0.5,
    flying: 2,
    bug: 2,
    steel: 0.5,
  },
  ghost: {
    normal: 0,
    psychic: 2,
    ghost: 2,
    dark: 0.5,
  },
  dragon: {
    dragon: 2,
    steel: 0.5,
    fairy: 0,
  },
  dark: {
    fighting: 0.5,
    psychic: 2,
    ghost: 2,
    dark: 0.5,
    fairy: 0.5,
  },
  steel: {
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    ice: 2,
    rock: 2,
    steel: 0.5,
    fairy: 2,
  },
  fairy: {
    fire: 0.5,
    fighting: 2,
    poison: 0.5,
    dragon: 2,
    dark: 2,
    steel: 0.5,
  },
}

// Calculate type effectiveness multiplier
export function calculateTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
  let multiplier = 1

  // If the move type doesn't exist in our chart, return normal effectiveness
  if (!typeEffectivenessChart[moveType]) {
    return multiplier
  }

  // Apply effectiveness for each of the defender's types
  for (const defenderType of defenderTypes) {
    if (typeEffectivenessChart[moveType][defenderType] !== undefined) {
      multiplier *= typeEffectivenessChart[moveType][defenderType]
    }
  }

  return multiplier
}

// Get effectiveness message
export function getEffectivenessMessage(multiplier: number): string {
  if (multiplier === 0) {
    return "It had no effect..."
  } else if (multiplier < 1) {
    return "It's not very effective..."
  } else if (multiplier > 1) {
    return "It's super effective!"
  }
  return ""
}

// Calculate if a move is a critical hit (1/16 chance)
export function isCriticalHit(): boolean {
  return Math.random() < 0.0625 // 1/16 chance
}

// Calculate if a move misses (based on accuracy)
export function moveMisses(accuracy: number): boolean {
  return Math.random() > accuracy / 100
}

// Get move type based on move name
export function getMoveType(moveName: string): string {
  const moveTypes: Record<string, string> = {
    // Normal type moves
    Tackle: "normal",
    "Quick Attack": "normal",
    Slam: "normal",
    Pound: "normal",
    Scratch: "normal",
    Headbutt: "normal",
    "Body Slam": "normal",
    "Hyper Beam": "normal",
    Swift: "normal",

    // Fire type moves
    Ember: "fire",
    Flamethrower: "fire",
    "Fire Blast": "fire",
    "Fire Punch": "fire",
    "Flame Wheel": "fire",
    "Heat Wave": "fire",
    "Will-O-Wisp": "fire", // Status move that causes burn

    // Water type moves
    "Water Gun": "water",
    Bubble: "water",
    "Hydro Pump": "water",
    Surf: "water",
    Waterfall: "water",
    "Aqua Jet": "water",

    // Electric type moves
    "Thunder Shock": "electric",
    Thunderbolt: "electric",
    Thunder: "electric",
    Spark: "electric",
    "Volt Tackle": "electric",
    Discharge: "electric",
    "Thunder Wave": "electric", // Status move that causes paralysis

    // Grass type moves
    "Vine Whip": "grass",
    "Razor Leaf": "grass",
    "Solar Beam": "grass",
    "Seed Bomb": "grass",
    "Leaf Blade": "grass",
    "Energy Ball": "grass",
    "Sleep Powder": "grass", // Status move that causes sleep
    "Stun Spore": "grass", // Status move that causes paralysis

    // Ice type moves
    "Ice Beam": "ice",
    Blizzard: "ice",
    "Ice Punch": "ice",
    "Icy Wind": "ice",
    "Aurora Beam": "ice",
    "Frost Breath": "ice",
    "Freeze-Dry": "ice", // Special move that's super effective against water

    // Fighting type moves
    "Karate Chop": "fighting",
    "Low Kick": "fighting",
    "Cross Chop": "fighting",
    "Dynamic Punch": "fighting",
    "Brick Break": "fighting",
    "Close Combat": "fighting",

    // Poison type moves
    "Poison Sting": "poison",
    Sludge: "poison",
    "Sludge Bomb": "poison",
    "Poison Jab": "poison",
    "Gunk Shot": "poison",
    Toxic: "poison", // Status move that causes bad poison

    // Ground type moves
    Earthquake: "ground",
    Dig: "ground",
    "Earth Power": "ground",
    "Mud Shot": "ground",
    "Mud Bomb": "ground",
    Bulldoze: "ground",

    // Flying type moves
    Gust: "flying",
    "Wing Attack": "flying",
    "Aerial Ace": "flying",
    "Air Slash": "flying",
    "Brave Bird": "flying",
    Hurricane: "flying",

    // Psychic type moves
    Confusion: "psychic",
    Psychic: "psychic",
    Psybeam: "psychic",
    Psyshock: "psychic",
    "Zen Headbutt": "psychic",
    "Future Sight": "psychic",
    Hypnosis: "psychic", // Status move that causes sleep

    // Bug type moves
    "Bug Bite": "bug",
    "Pin Missile": "bug",
    "X-Scissor": "bug",
    "Signal Beam": "bug",
    Megahorn: "bug",
    "U-turn": "bug",
    "String Shot": "bug", // Status move that lowers speed

    // Rock type moves
    "Rock Throw": "rock",
    "Rock Slide": "rock",
    "Stone Edge": "rock",
    "Rock Blast": "rock",
    "Ancient Power": "rock",
    "Power Gem": "rock",

    // Ghost type moves
    Lick: "ghost",
    "Shadow Ball": "ghost",
    "Shadow Punch": "ghost",
    "Shadow Claw": "ghost",
    "Shadow Sneak": "ghost",
    Hex: "ghost",
    Confuse: "ghost", // Status move that causes confusion

    // Dragon type moves
    "Dragon Rage": "dragon",
    "Dragon Breath": "dragon",
    "Dragon Claw": "dragon",
    "Dragon Pulse": "dragon",
    "Draco Meteor": "dragon",
    Outrage: "dragon",

    // Dark type moves
    Bite: "dark",
    Crunch: "dark",
    "Dark Pulse": "dark",
    "Sucker Punch": "dark",
    "Night Slash": "dark",
    "Foul Play": "dark",

    // Steel type moves
    "Metal Claw": "steel",
    "Iron Tail": "steel",
    "Steel Wing": "steel",
    "Flash Cannon": "steel",
    "Iron Head": "steel",
    "Meteor Mash": "steel",

    // Fairy type moves
    "Fairy Wind": "fairy",
    "Dazzling Gleam": "fairy",
    Moonblast: "fairy",
    "Play Rough": "fairy",
    "Draining Kiss": "fairy",
    "Disarming Voice": "fairy",
  }

  return moveTypes[moveName] || "normal"
}

// Generate moves for a Pokémon based on its types
export function generateMovesForPokemon(types: string[]): string[] {
  const movesByType: Record<string, string[]> = {
    normal: ["Tackle", "Quick Attack", "Slam", "Pound", "Scratch", "Headbutt", "Body Slam"],
    fire: ["Ember", "Flamethrower", "Fire Blast", "Fire Punch", "Flame Wheel", "Heat Wave", "Will-O-Wisp"],
    water: ["Water Gun", "Bubble", "Hydro Pump", "Surf", "Waterfall", "Aqua Jet"],
    electric: ["Thunder Shock", "Thunderbolt", "Thunder", "Spark", "Volt Tackle", "Discharge", "Thunder Wave"],
    grass: [
      "Vine Whip",
      "Razor Leaf",
      "Solar Beam",
      "Seed Bomb",
      "Leaf Blade",
      "Energy Ball",
      "Sleep Powder",
      "Stun Spore",
    ],
    ice: ["Ice Beam", "Blizzard", "Ice Punch", "Icy Wind", "Aurora Beam", "Frost Breath", "Freeze-Dry"],
    fighting: ["Karate Chop", "Low Kick", "Cross Chop", "Dynamic Punch", "Brick Break", "Close Combat"],
    poison: ["Poison Sting", "Sludge", "Sludge Bomb", "Poison Jab", "Gunk Shot", "Toxic"],
    ground: ["Earthquake", "Dig", "Earth Power", "Mud Shot", "Mud Bomb", "Bulldoze"],
    flying: ["Gust", "Wing Attack", "Aerial Ace", "Air Slash", "Brave Bird", "Hurricane"],
    psychic: ["Confusion", "Psychic", "Psybeam", "Psyshock", "Zen Headbutt", "Future Sight", "Hypnosis"],
    bug: ["Bug Bite", "Pin Missile", "X-Scissor", "Signal Beam", "Megahorn", "U-turn", "String Shot"],
    rock: ["Rock Throw", "Rock Slide", "Stone Edge", "Rock Blast", "Ancient Power", "Power Gem"],
    ghost: ["Lick", "Shadow Ball", "Shadow Punch", "Shadow Claw", "Shadow Sneak", "Hex", "Confuse"],
    dragon: ["Dragon Rage", "Dragon Breath", "Dragon Claw", "Dragon Pulse", "Draco Meteor", "Outrage"],
    dark: ["Bite", "Crunch", "Dark Pulse", "Sucker Punch", "Night Slash", "Foul Play"],
    steel: ["Metal Claw", "Iron Tail", "Steel Wing", "Flash Cannon", "Iron Head", "Meteor Mash"],
    fairy: ["Fairy Wind", "Dazzling Gleam", "Moonblast", "Play Rough", "Draining Kiss", "Disarming Voice"],
  }

  // Always include some normal type moves
  let availableMoves = [...movesByType.normal]

  // Add moves based on the Pokémon's types
  for (const type of types) {
    if (movesByType[type]) {
      availableMoves = [...availableMoves, ...movesByType[type]]
    }
  }

  // Shuffle and pick 4 random moves
  const shuffled = availableMoves.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, 4)
}

// Get move power based on move name
export function getMovePower(moveName: string): number {
  const movePowers: Record<string, number> = {
    // Normal type moves
    Tackle: 40,
    "Quick Attack": 40,
    Slam: 80,
    Pound: 40,
    Scratch: 40,
    Headbutt: 70,
    "Body Slam": 85,
    "Hyper Beam": 150,
    Swift: 60,

    // Fire type moves
    Ember: 40,
    Flamethrower: 90,
    "Fire Blast": 110,
    "Fire Punch": 75,
    "Flame Wheel": 60,
    "Heat Wave": 95,
    "Will-O-Wisp": 0, // Status move

    // Water type moves
    "Water Gun": 40,
    Bubble: 40,
    "Hydro Pump": 110,
    Surf: 90,
    Waterfall: 80,
    "Aqua Jet": 40,

    // Electric type moves
    "Thunder Shock": 40,
    Thunderbolt: 90,
    Thunder: 110,
    Spark: 65,
    "Volt Tackle": 120,
    Discharge: 80,
    "Thunder Wave": 0, // Status move

    // Grass type moves
    "Vine Whip": 45,
    "Razor Leaf": 55,
    "Solar Beam": 120,
    "Seed Bomb": 80,
    "Leaf Blade": 90,
    "Energy Ball": 90,
    "Sleep Powder": 0, // Status move
    "Stun Spore": 0, // Status move

    // Ice type moves
    "Ice Beam": 90,
    Blizzard: 110,
    "Ice Punch": 75,
    "Icy Wind": 55,
    "Aurora Beam": 65,
    "Frost Breath": 60,
    "Freeze-Dry": 70,

    // Poison type moves
    "Poison Sting": 15,
    Sludge: 65,
    "Sludge Bomb": 90,
    "Poison Jab": 80,
    "Gunk Shot": 120,
    Toxic: 0, // Status move

    // Psychic type moves
    Confusion: 50,
    Psychic: 90,
    Psybeam: 65,
    Psyshock: 80,
    "Zen Headbutt": 80,
    "Future Sight": 120,
    Hypnosis: 0, // Status move

    // Ghost type moves
    Lick: 30,
    "Shadow Ball": 80,
    "Shadow Punch": 60,
    "Shadow Claw": 70,
    "Shadow Sneak": 40,
    Hex: 65,
    Confuse: 0, // Status move
  }

  // If the move isn't in our database, give it a default power
  return movePowers[moveName] || 50
}

// Get move accuracy based on move name
export function getMoveAccuracy(moveName: string): number {
  const moveAccuracies: Record<string, number> = {
    // Some moves with less than 100% accuracy
    "Hydro Pump": 80,
    "Fire Blast": 85,
    Thunder: 70,
    Blizzard: 70,
    Hurricane: 70,
    "Stone Edge": 80,
    "Focus Blast": 70,
    Megahorn: 85,
    "Gunk Shot": 80,
    "Draco Meteor": 90,
    "Will-O-Wisp": 85,
    "Thunder Wave": 90,
    "Sleep Powder": 75,
    "Stun Spore": 75,
    Hypnosis: 60,
    Toxic: 90,
    Confuse: 100,
  }

  // Most moves have 100% accuracy by default
  return moveAccuracies[moveName] || 100
}

// Check if a move is a status move
export function isStatusMove(moveName: string): boolean {
  const statusMoves = [
    "Thunder Wave",
    "Will-O-Wisp",
    "Toxic",
    "Sleep Powder",
    "Stun Spore",
    "Confuse Ray",
    "Hypnosis",
    "Spore",
    "Yawn",
    "Glare",
    "Poison Powder",
    "Sing",
    "Supersonic",
    "Rain Dance",
    "Sunny Day",
    "Sandstorm",
    "Hail",
  ]
  return statusMoves.includes(moveName)
}

// Get status effect from move
export function getStatusEffectFromMove(moveName: string): {
  type: "poison" | "burn" | "paralysis" | "freeze" | "sleep" | "confusion" | null
  chance: number
} {
  const statusEffects: Record<
    string,
    { type: "poison" | "burn" | "paralysis" | "freeze" | "sleep" | "confusion" | null; chance: number }
  > = {
    "Thunder Wave": { type: "paralysis", chance: 0.9 },
    "Will-O-Wisp": { type: "burn", chance: 0.85 },
    Toxic: { type: "poison", chance: 0.9 },
    "Sleep Powder": { type: "sleep", chance: 0.75 },
    "Stun Spore": { type: "paralysis", chance: 0.75 },
    "Confuse Ray": { type: "confusion", chance: 0.8 },
    Hypnosis: { type: "sleep", chance: 0.6 },
    Spore: { type: "sleep", chance: 0.9 },
    Yawn: { type: "sleep", chance: 1.0 },
    Glare: { type: "paralysis", chance: 0.9 },
    "Poison Powder": { type: "poison", chance: 0.75 },
    Sing: { type: "sleep", chance: 0.55 },
    Supersonic: { type: "confusion", chance: 0.65 },
    // Secondary effects from regular moves
    Ember: { type: "burn", chance: 0.1 },
    Flamethrower: { type: "burn", chance: 0.1 },
    "Fire Blast": { type: "burn", chance: 0.1 },
    Thunderbolt: { type: "paralysis", chance: 0.1 },
    Thunder: { type: "paralysis", chance: 0.3 },
    "Body Slam": { type: "paralysis", chance: 0.3 },
    Sludge: { type: "poison", chance: 0.3 },
    "Sludge Bomb": { type: "poison", chance: 0.3 },
    "Ice Beam": { type: "freeze", chance: 0.1 },
    Blizzard: { type: "freeze", chance: 0.1 },
  }

  return statusEffects[moveName] || { type: null, chance: 0 }
}

// Calculate status effect damage
export function calculateStatusEffectDamage(statusType: string, maxHp: number): number {
  switch (statusType) {
    case "poison":
      return Math.floor(maxHp / 8) // 1/8 of max HP
    case "burn":
      return Math.floor(maxHp / 16) // 1/16 of max HP
    default:
      return 0
  }
}

// Check if Pokémon can move with status
export function canMoveWithStatus(statusType: string): boolean {
  switch (statusType) {
    case "paralysis":
      return Math.random() > 0.25 // 25% chance to be fully paralyzed
    case "freeze":
      const thawed = Math.random() < 0.2 // 20% chance to thaw each turn
      return thawed
    case "sleep":
      const wokeUp = Math.random() < 0.33 // 33% chance to wake up each turn
      return wokeUp
    case "confusion":
      const hurtItself = Math.random() < 0.5 // 50% chance to hurt itself
      return !hurtItself
    default:
      return true
  }
}

// Get sound effect for a move
export function getMoveSoundEffect(moveType: string): string {
  const defaultSound = "/sounds/attack.mp3"

  const soundEffects: Record<string, string> = {
    normal: defaultSound,
    fire: defaultSound,
    water: defaultSound,
    electric: defaultSound,
    grass: defaultSound,
    ice: defaultSound,
    fighting: defaultSound,
    poison: defaultSound,
    ground: defaultSound,
    flying: defaultSound,
    psychic: defaultSound,
    bug: defaultSound,
    rock: defaultSound,
    ghost: defaultSound,
    dragon: defaultSound,
    dark: defaultSound,
    steel: defaultSound,
    fairy: defaultSound,
  }

  return soundEffects[moveType] || "/sounds/normal-hit.mp3"
}

// Get animation class for a move type
export function getMoveAnimationClass(moveType: string): string {
  const animations: Record<string, string> = {
    normal: "animate-normal-attack",
    fire: "animate-fire-attack",
    water: "animate-water-attack",
    electric: "animate-electric-attack",
    grass: "animate-grass-attack",
    ice: "animate-ice-attack",
    fighting: "animate-fighting-attack",
    poison: "animate-poison-attack",
    ground: "animate-ground-attack",
    flying: "animate-flying-attack",
    psychic: "animate-psychic-attack",
    bug: "animate-bug-attack",
    rock: "animate-rock-attack",
    ghost: "animate-ghost-attack",
    dragon: "animate-dragon-attack",
    dark: "animate-dark-attack",
    steel: "animate-steel-attack",
    fairy: "animate-fairy-attack",
  }

  return animations[moveType] || "animate-normal-attack"
}

// Get color for a move type
export function getMoveTypeColor(moveType: string): string {
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

  return typeColors[moveType] || "bg-gray-400"
}

// Calculate HP percentage for display
export function calculateHpPercentage(pokemon: any): number {
  if (!pokemon.currentHp || !pokemon.stats?.hp) return 0
  return (pokemon.currentHp / pokemon.stats.hp) * 100
}

// Get weather effect from move
export function getWeatherEffect(moveName: string): string | null {
  const weatherMoves: Record<string, string> = {
    "Rain Dance": "rain",
    "Sunny Day": "sun",
    Sandstorm: "sandstorm",
    Hail: "hail",
  }

  return weatherMoves[moveName] || null
}

// Calculate weather damage
export function calculateWeatherDamage(weather: string, types: string[], maxHp: number): number {
  switch (weather) {
    case "sandstorm":
      // Sandstorm damages all types except Rock, Ground, and Steel
      if (!types.some((type) => ["rock", "ground", "steel"].includes(type))) {
        return Math.floor(maxHp / 16) // 1/16 of max HP
      }
      return 0
    case "hail":
      // Hail damages all types except Ice
      if (!types.includes("ice")) {
        return Math.floor(maxHp / 16) // 1/16 of max HP
      }
      return 0
    default:
      return 0
  }
}

// Get weather boost for moves
export function getWeatherBoost(weather: string | null, moveType: string): number {
  if (!weather) return 1.0

  switch (weather) {
    case "rain":
      if (moveType === "water") return 1.5 // Water moves boosted in rain
      if (moveType === "fire") return 0.5 // Fire moves weakened in rain
      return 1.0
    case "sun":
      if (moveType === "fire") return 1.5 // Fire moves boosted in sun
      if (moveType === "water") return 0.5 // Water moves weakened in sun
      return 1.0
    default:
      return 1.0
  }
}
