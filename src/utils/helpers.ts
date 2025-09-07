import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

export function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleDateString()
}

export function validatePrompt(prompt: string): boolean {
  const sensitiveWords = ['nude', 'violence', 'illegal', 'hate']
  const lowerPrompt = prompt.toLowerCase()
  
  return !sensitiveWords.some(word => lowerPrompt.includes(word))
}

export function calculateCost(tokens: number): number {
  return (tokens / 1000000) * 30
}