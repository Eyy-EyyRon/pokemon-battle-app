import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// Add this export if it doesn't exist
export function generateBattleCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
// Existing exports in the utils file
export function someOtherFunction() {
  // ...
}

// Add the missing getTypeColor function
export function getTypeColor(type: string): string {
  const typeColors: Record<string, string> = {
    fire: "#F08030",
    water: "#6890F0",
    grass: "#78C850",
    electric: "#F8D030",
    // Add other type colors as needed
  };
  return typeColors[type] || "#A8A878"; // Default color
}