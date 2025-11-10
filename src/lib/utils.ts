import { clsx, type ClassValue } from 'clsx'

/**
 * Utility function to merge class names using clsx
 * Useful for conditional className styling in components
 *
 * @example
 * cn('base-class', condition && 'conditional-class', 'another-class')
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
