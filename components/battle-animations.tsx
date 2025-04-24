"use client"

import type React from "react"

import { motion } from "framer-motion"
import {
  Swords,
  Flame,
  Droplet,
  Leaf,
  Zap,
  Wind,
  Snowflake,
  Mountain,
  MountainSnow,
  Ghost,
  Moon,
  Shield,
  Sparkles,
  Brain,
  Skull,
  Bug,
} from "lucide-react"

interface AttackAnimationProps {
  type: string
  color: string
  effectiveness: number
  direction: "left" | "right"
  onComplete?: () => void
}

export function AttackAnimation({ type, color, effectiveness, direction, onComplete }: AttackAnimationProps) {
  // Determine animation properties based on effectiveness
  const scale = effectiveness > 1 ? 1.8 : effectiveness === 0 ? 0.8 : 1.2
  const duration = effectiveness > 1 ? 0.8 : effectiveness === 0 ? 0.4 : 0.6
  const opacity = effectiveness === 0 ? 0.5 : 1

  // Determine movement based on direction
  const xMovement = direction === "right" ? [0, 50, 70] : [0, -50, -70]

  // Get the appropriate icon component
  const IconComponent = getIconComponent(type)

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{
          scale: [0.5, scale, 1],
          rotate: [0, direction === "right" ? 15 : -15, 0],
          x: xMovement,
          opacity: [0, opacity, 0.8, 0],
        }}
        transition={{
          duration: duration,
          times: [0, 0.3, 0.7, 1],
          ease: "easeInOut",
        }}
        onAnimationComplete={onComplete}
      >
        <div className={`absolute inset-0 bg-${color}-500/30 rounded-full blur-lg animate-pulse`}></div>
        <IconComponent className={`w-12 h-12 text-${color}-500 relative z-10`} />

        {/* Particles for super effective attacks */}
        {effectiveness > 1 && (
          <div className="absolute inset-0 -z-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-2 h-2 rounded-full bg-${color}-500`}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 0,
                }}
                animate={{
                  x: (Math.random() - 0.5) * 100,
                  y: (Math.random() - 0.5) * 100,
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.5, 0],
                }}
                transition={{
                  duration: Math.random() * 0.5 + 0.5,
                  delay: Math.random() * 0.2,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// Helper function to get the icon component based on type
function getIconComponent(type: string) {
  switch (type) {
    case "swords":
      return Swords
    case "flame":
      return Flame
    case "droplet":
      return Droplet
    case "leaf":
      return Leaf
    case "zap":
      return Zap
    case "snowflake":
      return Snowflake
    case "mountain":
      return Mountain
    case "mountain-snow":
      return MountainSnow
    case "ghost":
      return Ghost
    case "moon":
      return Moon
    case "shield":
      return Shield
    case "sparkles":
      return Sparkles
    case "brain":
      return Brain
    case "skull":
      return Skull
    case "bug":
      return Bug
    case "wind":
    default:
      return Wind
  }
}

interface EffectivenessIndicatorProps {
  effectiveness: number
}

export function EffectivenessIndicator({ effectiveness }: EffectivenessIndicatorProps) {
  if (effectiveness === 1) return null

  let message = ""
  let color = ""

  if (effectiveness === 0) {
    message = "No effect!"
    color = "text-gray-500"
  } else if (effectiveness < 1) {
    message = "Not very effective..."
    color = "text-orange-500"
  } else {
    message = "Super effective!"
    color = "text-green-500"
  }

  return (
    <motion.div
      className={`absolute bottom-16 left-0 right-0 text-center z-30 font-bold ${color} text-shadow`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {message}
    </motion.div>
  )
}

interface PokemonHitAnimationProps {
  isHit: boolean
  effectiveness: number
  children: React.ReactNode
}

export function PokemonHitAnimation({ isHit, effectiveness, children }: PokemonHitAnimationProps) {
  if (!isHit) return <>{children}</>

  // Determine animation based on effectiveness
  let animation = {}

  if (effectiveness === 0) {
    // No effect
    animation = {
      opacity: [1, 0.8, 1],
    }
  } else if (effectiveness < 1) {
    // Not very effective
    animation = {
      x: [0, -3, 3, -3, 0],
      y: [0, -2, 2, -2, 0],
      filter: ["brightness(1)", "brightness(1.1)", "brightness(1)"],
    }
  } else if (effectiveness > 1) {
    // Super effective
    animation = {
      x: [0, -8, 8, -5, 5, 0],
      y: [0, -5, 5, -3, 3, 0],
      rotate: [0, -3, 3, -2, 2, 0],
      filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"],
    }
  } else {
    // Normal effectiveness
    animation = {
      x: [0, -5, 5, -3, 3, 0],
      y: [0, -3, 3, -2, 2, 0],
      filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"],
    }
  }

  return (
    <motion.div animate={animation} transition={{ duration: 0.5 }}>
      {children}
    </motion.div>
  )
}

interface CriticalHitIndicatorProps {
  isCritical: boolean
}

export function CriticalHitIndicator({ isCritical }: CriticalHitIndicatorProps) {
  if (!isCritical) return null

  return (
    <motion.div
      className="absolute top-10 left-0 right-0 text-center z-30 font-bold text-red-500 text-shadow"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1.2 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.3 }}
    >
      CRITICAL HIT!
    </motion.div>
  )
}
