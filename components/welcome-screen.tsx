"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface WelcomeScreenProps {
  onLogin: (username: string) => void
}

export default function WelcomeScreen({ onLogin }: WelcomeScreenProps) {
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const [pokemonSprite, setPokemonSprite] = useState("")

  useEffect(() => {
    // Get a random starter Pokémon sprite
    const starters = [1, 4, 7, 25, 133, 152, 155, 158, 252, 255, 258, 387, 390, 393, 495, 498, 501]
    const randomStarter = starters[Math.floor(Math.random() * starters.length)]

    fetch(`https://pokeapi.co/api/v2/pokemon/${randomStarter}`)
      .then((res) => res.json())
      .then((data) => {
        setPokemonSprite(data.sprites.other["official-artwork"].front_default || data.sprites.front_default)
      })
      .catch((err) => console.error("Failed to fetch starter Pokémon:", err))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters")
      return
    }
    onLogin(username.trim())
  }

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <motion.div
            className="flex justify-center mb-6"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          >
            {pokemonSprite && (
              <motion.img
                src={pokemonSprite}
                alt="Pokémon"
                className="w-32 h-32"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 10, 0] }}
                transition={{ delay: 0.5, duration: 0.5 }}
              />
            )}
          </motion.div>
          <CardTitle className="text-3xl font-bold">Pokémon Battle App</CardTitle>
          <CardDescription>Enter your trainer name to begin your journey!</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter your trainer name"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setError("")
                  }}
                  className="text-center text-lg"
                />
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" size="lg">
              Start Adventure
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}
