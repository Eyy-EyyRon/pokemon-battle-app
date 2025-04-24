export interface Pokemon {
  id: number
  name: string
  height: number
  weight: number
  sprites: {
    front_default: string
    back_default: string
    other?: {
      "official-artwork"?: {
        front_default: string
      }
    }
  }
  stats: {
    base_stat: number
    stat: {
      name: string
    }
  }[]
  types: {
    type: {
      name: string
    }
  }[]
  abilities: {
    ability: {
      name: string
    }
    is_hidden: boolean
  }[]
}

export interface TeamMember {
  id: number
  name: string
  sprite: string
  spriteBack?: string
  spriteOfficial?: string
  stats: {
    base_stat: number
    stat: {
      name: string
    }
  }[]
  types: {
    type: {
      name: string
    }
  }[]
}

export interface BattleResult {
  id: number
  date: string
  pokemon1: {
    id: number
    name: string
    sprite: string
  }
  pokemon2: {
    id: number
    name: string
    sprite: string
  }
  winner: {
    id: number
    name: string
    sprite: string
  }
  stats: {
    pokemon1: {
      hp: number
      attack: number
      speed: number
    }
    pokemon2: {
      hp: number
      attack: number
      speed: number
    }
  }
}

export interface BattleState {
  playerActivePokemon: number
  opponentActivePokemon: number
  playerHP: number
  opponentHP: number
  playerDefeatedPokemon: number[]
  opponentDefeatedPokemon: number[]
  isPlayerTurn: boolean
  lastAction: string
  result: "player" | "opponent" | null
}

export interface BattleAction {
  type: "attack" | "switch"
  pokemonId: number
  attackType?: "normal" | "special"
}
