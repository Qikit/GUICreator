import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT)
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < MOBILE_BREAKPOINT)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return mobile
}
