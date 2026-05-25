import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
