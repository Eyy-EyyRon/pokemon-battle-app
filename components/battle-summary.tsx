"use client"

import Image from "next/image"

interface Pokemon {
  id: number
  name: string
  sprite: string
  types: string[]
}

interface BattleSummaryProps {
  winner: "player" | "opponent"
  playerPokemon: Pokemon
  opponentPokemon: Pokemon
  turnCount: number
  battleType: string
}

export function BattleSummary({ winner, playerPokemon, opponentPokemon, turnCount, battleType }: BattleSummaryProps) {
  const getTypeColor = (type: string) => {
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
    return typeColors[type] || "bg-gray-400"
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div
          className={`inline-block px-4 py-2 rounded-full ${
            winner === "player" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          } font-bold text-xl mb-2`}
        >
          {winner === "player" ? "Victory!" : "Defeat!"}
        </div>
        <p className="text-gray-600">
          {winner === "player"
            ? `Your ${playerPokemon.name} defeated the ${opponentPokemon.name}!`
            : `Your ${playerPokemon.name} was defeated by the ${opponentPokemon.name}!`}
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-8 bg-gradient-to-b from-red-50 to-white p-6 rounded-xl shadow-md">
        <div className={`text-center ${winner === "player" ? "order-1" : "order-2 opacity-60"}`}>
          <div className="relative h-40 w-40 mx-auto">
            <div
              className={`absolute inset-0 rounded-full ${winner === "player" ? "bg-green-400/20 animate-pulse" : ""}`}
            ></div>
            <Image
              src={playerPokemon.sprite || "/placeholder.svg"}
              alt={playerPokemon.name}
              fill
              className={`object-contain ${winner === "player" ? "" : "grayscale"}`}
            />
            {winner === "player" && (
              <div className="absolute -top-4 -right-4 bg-yellow-400 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <h3 className="font-bold capitalize mt-2 text-lg">{playerPokemon.name}</h3>
          <div className="flex justify-center gap-1 mt-1">
            {playerPokemon.types.map((type) => (
              <span
                key={type}
                className={`${getTypeColor(type)} text-white text-xs px-1.5 py-0.5 rounded-full capitalize`}
              >
                {type}
              </span>
            ))}
          </div>
          {winner === "player" && (
            <span className="inline-block mt-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
              Winner
            </span>
          )}
        </div>

        <div className="text-xl font-bold my-4 relative">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white">VS</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-red-200"></div>
        </div>

        <div className={`text-center ${winner === "opponent" ? "order-1" : "order-2 opacity-60"}`}>
          <div className="relative h-40 w-40 mx-auto">
            <div
              className={`absolute inset-0 rounded-full ${winner === "opponent" ? "bg-green-400/20 animate-pulse" : ""}`}
            ></div>
            <Image
              src={opponentPokemon.sprite || "/placeholder.svg"}
              alt={opponentPokemon.name}
              fill
              className={`object-contain ${winner === "opponent" ? "" : "grayscale"}`}
            />
            {winner === "opponent" && (
              <div className="absolute -top-4 -right-4 bg-yellow-400 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <h3 className="font-bold capitalize mt-2 text-lg">{opponentPokemon.name}</h3>
          <div className="flex justify-center gap-1 mt-1">
            {opponentPokemon.types.map((type) => (
              <span
                key={type}
                className={`${getTypeColor(type)} text-white text-xs px-1.5 py-0.5 rounded-full capitalize`}
              >
                {type}
              </span>
            ))}
          </div>
          {winner === "opponent" && (
            <span className="inline-block mt-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
              Winner
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-red-100 pt-4">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-red-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
          Battle Summary
        </h3>
        <div className="bg-gradient-to-r from-red-50 to-white rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-gray-500">Total Turns</p>
              <p className="text-2xl font-bold text-red-600">{turnCount}</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-gray-500">Battle Type</p>
              <p className="text-2xl font-bold text-red-600">{battleType}</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm col-span-2">
              <p className="text-sm font-medium text-gray-500">Result</p>
              <p className="text-xl font-bold">
                {winner === "player" ? (
                  <span className="text-green-600">Victory!</span>
                ) : (
                  <span className="text-red-600">Defeat!</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
