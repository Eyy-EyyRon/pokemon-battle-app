"use client"

import React from "react"

import { useEffect, useRef, useState } from "react"

interface SoundManagerProps {
  children: React.ReactNode
}

interface SoundContextType {
  playSound: (soundPath: string) => void
  playBattleMusic: () => void
  stopBattleMusic: () => void
  playVictoryMusic: () => void
  playDefeatMusic: () => void
  toggleMute: () => void
  isMuted: boolean
}

// Create a context with default values
export const SoundContext = React.createContext<SoundContextType>({
  playSound: () => {},
  playBattleMusic: () => {},
  stopBattleMusic: () => {},
  playVictoryMusic: () => {},
  playDefeatMusic: () => {},
  toggleMute: () => {},
  isMuted: false,
})

export function SoundManager({ children }: SoundManagerProps) {
  const [isMuted, setIsMuted] = useState(false)
  const soundEffectRef = useRef<HTMLAudioElement | null>(null)
  const battleMusicRef = useRef<HTMLAudioElement | null>(null)
  const victoryMusicRef = useRef<HTMLAudioElement | null>(null)
  const defeatMusicRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio elements
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load mute state from localStorage
      const savedMuteState = localStorage.getItem("isMuted")
      if (savedMuteState) {
        setIsMuted(savedMuteState === "true")
      }

      // Create audio elements
      soundEffectRef.current = new Audio()

      // Add error handlers for all audio elements
      const handleAudioError = (element: HTMLAudioElement, name: string) => {
        element.addEventListener("error", (e) => {
          console.warn(`Error loading ${name}:`, e)
        })
      }

      try {
        battleMusicRef.current = new Audio("public/Wild Pokemon Battle.mp3")
        handleAudioError(battleMusicRef.current, "battle music")

        victoryMusicRef.current = new Audio("public/Trainer Victory.mp3")
        handleAudioError(victoryMusicRef.current, "victory music")

        defeatMusicRef.current = new Audio("public/Trainer Victory.mp3")
        handleAudioError(defeatMusicRef.current, "defeat music")

        // Set properties for battle music
        if (battleMusicRef.current) {
          battleMusicRef.current.loop = true
          battleMusicRef.current.volume = 0.5
        }
      } catch (e) {
        console.warn("Error initializing audio:", e)
      }

      // Clean up
      return () => {
        if (battleMusicRef.current) {
          battleMusicRef.current.pause()
        }
        if (victoryMusicRef.current) {
          victoryMusicRef.current.pause()
        }
        if (defeatMusicRef.current) {
          defeatMusicRef.current.pause()
        }
      }
    }
  }, [])

  // Update audio elements when mute state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("isMuted", isMuted.toString())

      if (soundEffectRef.current) {
        soundEffectRef.current.muted = isMuted
      }
      if (battleMusicRef.current) {
        battleMusicRef.current.muted = isMuted
      }
      if (victoryMusicRef.current) {
        victoryMusicRef.current.muted = isMuted
      }
      if (defeatMusicRef.current) {
        defeatMusicRef.current.muted = isMuted
      }
    }
  }, [isMuted])

  // Play a sound effect
  const playSound = (soundPath: string) => {
    if (typeof window !== "undefined" && !isMuted) {
      if (soundEffectRef.current) {
        soundEffectRef.current.src = soundPath
        soundEffectRef.current.play().catch((e) => {
          console.warn("Error playing sound effect:", e)
        })
      }
    }
  }

  // Play battle music
  const playBattleMusic = () => {
    if (typeof window !== "undefined" && !isMuted) {
      if (battleMusicRef.current) {
        // Check if the audio file is loaded properly
        if (!battleMusicRef.current.src || battleMusicRef.current.error) {
          console.warn("Battle music couldn't be loaded, using fallback behavior")
          return // Skip playing if there's an error
        }

        battleMusicRef.current.currentTime = 0
        battleMusicRef.current.play().catch((e) => {
          console.warn("Error playing battle music, continuing without audio:", e)
          // Continue without audio rather than breaking the experience
        })
      }
    }
  }

  // Stop battle music
  const stopBattleMusic = () => {
    if (typeof window !== "undefined") {
      if (battleMusicRef.current) {
        battleMusicRef.current.pause()
        battleMusicRef.current.currentTime = 0
      }
    }
  }

  // Play victory music
  const playVictoryMusic = () => {
    if (typeof window !== "undefined" && !isMuted) {
      // Stop battle music first
      if (battleMusicRef.current) {
        battleMusicRef.current.pause()
      }

      // Play victory music
      if (victoryMusicRef.current) {
        // Check if the audio file is loaded properly
        if (!victoryMusicRef.current.src || victoryMusicRef.current.error) {
          console.warn("Victory music couldn't be loaded, using fallback behavior")
          return // Skip playing if there's an error
        }

        victoryMusicRef.current.currentTime = 0
        victoryMusicRef.current.play().catch((e) => {
          console.warn("Error playing victory music:", e)
        })
      }
    }
  }

  // Play defeat music
  const playDefeatMusic = () => {
    if (typeof window !== "undefined" && !isMuted) {
      // Stop battle music first
      if (battleMusicRef.current) {
        battleMusicRef.current.pause()
      }

      // Play defeat music
      if (defeatMusicRef.current) {
        // Check if the audio file is loaded properly
        if (!defeatMusicRef.current.src || defeatMusicRef.current.error) {
          console.warn("Defeat music couldn't be loaded, using fallback behavior")
          return // Skip playing if there's an error
        }

        defeatMusicRef.current.currentTime = 0
        defeatMusicRef.current.play().catch((e) => {
          console.warn("Error playing defeat music:", e)
        })
      }
    }
  }

  // Toggle mute state
  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  // Context value
  const contextValue: SoundContextType = {
    playSound,
    playBattleMusic,
    stopBattleMusic,
    playVictoryMusic,
    playDefeatMusic,
    toggleMute,
    isMuted,
  }

  return <SoundContext.Provider value={contextValue}>{children}</SoundContext.Provider>
}

// Custom hook to use the sound context
export function useSound() {
  return React.useContext(SoundContext)
}
