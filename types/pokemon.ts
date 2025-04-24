/**
 * Represents a Pokémon in a user's team
 */
export interface TeamPokemon {
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
  currentHp?: number // Added this property to fix the type error
  moves?: string[]
  favorite?: boolean
  ability?: {
    name: string
    description: string
  }
}
