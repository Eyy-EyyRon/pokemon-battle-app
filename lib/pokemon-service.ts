import type { Pokemon } from "./types"

export async function fetchPokemonList(page: number, limit: number): Promise<Pokemon[]> {
  const offset = (page - 1) * limit
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`)
  const data = await response.json()

  // Fetch details for each Pokémon
  const pokemonDetails = await Promise.all(
    data.results.map(async (pokemon: { name: string; url: string }) => {
      const detailResponse = await fetch(pokemon.url)
      return detailResponse.json()
    }),
  )

  return pokemonDetails
}

export async function searchPokemon(query: string): Promise<Pokemon[]> {
  try {
    // First try to fetch by exact name or ID
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`)
    if (response.ok) {
      const pokemon = await response.json()
      return [pokemon]
    }
  } catch (error) {
    // If not found by exact match, continue to search in the list
  }

  // Fetch a larger list to search through
  const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=150")
  const data = await response.json()

  // Filter Pokémon by name containing the query
  const filteredResults = data.results.filter((pokemon: { name: string }) => pokemon.name.includes(query.toLowerCase()))

  // Fetch details for filtered Pokémon
  const pokemonDetails = await Promise.all(
    filteredResults.map(async (pokemon: { name: string; url: string }) => {
      const detailResponse = await fetch(pokemon.url)
      return detailResponse.json()
    }),
  )

  return pokemonDetails
}

export async function fetchPokemonById(id: number): Promise<Pokemon> {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
  return response.json()
}
