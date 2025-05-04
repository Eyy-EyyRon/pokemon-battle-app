
"use client"

import React, { useEffect, useRef, useState } from "react"


const battleMusicSrc = "/sounds/Wild_Pokemon_Battle.mp3";
const victoryMusicSrc = "/sounds/Trainer_Victory.mp3";
const defeatMusicSrc = "/sounds/Trainer_Victory.mp3"; // You might want a separate defeat track
const attackSoundSrc = "/sounds/attack.mp3";



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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMuteState = localStorage.getItem("isMuted")
      if (savedMuteState) {
        setIsMuted(savedMuteState === "true")
      }

      soundEffectRef.current = new Audio()

      battleMusicRef.current = new Audio(battleMusicSrc)
      victoryMusicRef.current = new Audio(victoryMusicSrc)
      defeatMusicRef.current = new Audio(defeatMusicSrc)

      if (battleMusicRef.current) {
        battleMusicRef.current.loop = true
        battleMusicRef.current.volume = 0.5
      }

      return () => {
        battleMusicRef.current?.pause()
        victoryMusicRef.current?.pause()
        defeatMusicRef.current?.pause()
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("isMuted", isMuted.toString())
      soundEffectRef.current && (soundEffectRef.current.muted = isMuted)
      battleMusicRef.current && (battleMusicRef.current.muted = isMuted)
      victoryMusicRef.current && (victoryMusicRef.current.muted = isMuted)
      defeatMusicRef.current && (defeatMusicRef.current.muted = isMuted)
    }
  }, [isMuted])

  const playSound = (soundPath: string) => {
    if (typeof window !== "undefined" && !isMuted && soundEffectRef.current) {
      soundEffectRef.current.src = soundPath
      soundEffectRef.current.play().catch((e) => {
        console.warn("Error playing sound effect:", e)
      })
    }
  }

  const playBattleMusic = () => {
    if (typeof window !== "undefined" && !isMuted && battleMusicRef.current) {
      if (!battleMusicRef.current.src || battleMusicRef.current.error) {
        console.warn("Battle music couldn't be loaded.")
        return
      }
      battleMusicRef.current.currentTime = 0
      battleMusicRef.current.play().catch((e) => {
        console.warn("Error playing battle music:", e)
      })
    }
  }

  const stopBattleMusic = () => {
    if (typeof window !== "undefined" && battleMusicRef.current) {
      battleMusicRef.current.pause()
      battleMusicRef.current.currentTime = 0
    }
  }

  const playVictoryMusic = () => {
    if (typeof window !== "undefined" && !isMuted) {
      battleMusicRef.current?.pause()

      if (victoryMusicRef.current) {
        if (!victoryMusicRef.current.src || victoryMusicRef.current.error) {
          console.warn("Victory music couldn't be loaded.")
          return
        }
        victoryMusicRef.current.currentTime = 0
        victoryMusicRef.current.play().catch((e) => {
          console.warn("Error playing victory music:", e)
        })
      }
    }
  }

  const playDefeatMusic = () => {
    if (typeof window !== "undefined" && !isMuted) {
      battleMusicRef.current?.pause()

      if (defeatMusicRef.current) {
        if (!defeatMusicRef.current.src || defeatMusicRef.current.error) {
          console.warn("Defeat music couldn't be loaded.")
          return
        }
        defeatMusicRef.current.currentTime = 0
        defeatMusicRef.current.play().catch((e) => {
          console.warn("Error playing defeat music:", e)
        })
      }
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

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

export function useSound() {
  return React.useContext(SoundContext)
}
