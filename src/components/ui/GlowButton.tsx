import { type ButtonHTMLAttributes } from 'react'
import s from './GlowButton.module.css'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'primary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function GlowButton({ variant = 'ghost', size = 'sm', className, children, ...rest }: Props) {
  return (
    <button className={`${s.btn} ${s[variant]} ${s[size]} ${className || ''}`} {...rest}>
      {children}
    </button>
  )
}
