import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PokemonList } from "@/components/pokemon-list"
import { TeamDisplay } from "@/components/team-display"
import { BattleHistory } from "@/components/battle-history"
import Image from "next/image"
import { Sword, Users, History, Trophy, Sparkles } from "lucide-react"
import pokemonLogo from "@/public/pokemon-logo.png"

// Add this at the top of the file
const POKEBALL_EMPTY_SVG = `data:image/svg+xml,%3Csvg xmlns='public/pokemon-logo.png viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23f2f2f2' stroke='%23cccccc' strokeWidth='5'/%3E%3Cpath d='M50 20 A30 30 0 0 1 80 50 L20 50 A30 30 0 0 1 50 20' fill='%23ff5555'/%3E%3Ccircle cx='50' cy='50' r='10' fill='white' stroke='%23cccccc' strokeWidth='3'/%3E%3C/svg%3E`


export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="relative overflow-hidden bg-indigo-600 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=500&width=500')] bg-repeat opacity-20"></div>
        </div>
        <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-extrabold mb-4">Pokédex</h1>
              <p className="text-lg md:text-xl mb-8 max-w-2xl">
                Build your dream team, challenge trainers, and become the ultimate Pokémon Master!
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Link href="/battle/create">
                  <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-100">
                    <Sword className="mr-2 h-5 w-5" />
                    Start Battle
                  </Button>
                </Link>
                <Link href="/battle/join">
                  <Button size="lg" variant="outline" className="border-white text-black hover:bg-indigo-700">
                    <Users className="mr-2 h-5 w-5" />
                    Join Battle
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative w-full max-w-md h-64 md:h-80">
              <Image
                src="pokemon-logo.png?height=400&width=400"
                alt="Pokémon Battle"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-3xl font-bold text-indigo-700 flex items-center">
                <Sparkles className="h-6 w-6 mr-2 text-indigo-500" />
                Pokémon Collection
              </h2>
              <div className="flex gap-2">
                <Link href="/battles">
                  <Button variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                    <History className="mr-2 h-4 w-4" />
                    Battle History
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                    <Trophy className="mr-2 h-4 w-4" />
                    Leaderboard
                  </Button>
                </Link>
              </div>
            </div>
            <PokemonList />
          </div>

          <div className="space-y-8">
            <TeamDisplay />

            <div>
              <h2 className="text-2xl font-bold text-indigo-700 mb-4 flex items-center">
                <History className="h-5 w-5 mr-2 text-indigo-500" />
                Recent Battles
              </h2>
              <BattleHistory limit={3} compact />
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-indigo-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Pokédex</h3>
              <p className="text-indigo-200">
                Build your team, battle with friends, and become the ultimate Pokémon Master!
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-indigo-700 text-center text-indigo-300 text-sm">
            <p>© 2023 Pokémon Battle Arena. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
