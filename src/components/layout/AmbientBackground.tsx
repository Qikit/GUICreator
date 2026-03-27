import { useEffect, useState, useMemo } from 'react'
import { usePrefsStore } from '@/store/prefsStore'
import styles from '@/styles/ambient.module.css'

const PARTICLE_COUNT = 20

function generateParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    duration: `${15 + Math.random() * 20}s`,
    delay: `${-Math.random() * 35}s`,
    size: `${1.5 + Math.random() * 1.5}px`,
    opacity: 0.2 + Math.random() * 0.4,
  }))
}

export function AmbientBackground() {
  const animations = usePrefsStore(state => state.animations)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const particles = useMemo(generateParticles, [])

  useEffect(() => {
    if (!animations) { setOffset({ x: 0, y: 0 }); return }
    const h = (e: MouseEvent) => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const x = ((e.clientX - cx) / cx) * -3
      const y = ((e.clientY - cy) / cy) * -3
      setOffset({ x, y })
    }
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [animations])

  return (
    <div
      className={styles.parallax}
      style={animations ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined}
    >
      <div className={`${styles.ambient} ${!animations ? styles.static : ''}`}>
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <div className={`${styles.blob} ${styles.blob3}`} />

        {animations && (
          <div className={styles.particles}>
            {particles.map(p => (
              <div
                key={p.id}
                className={styles.particle}
                style={{
                  left: p.left,
                  bottom: '-2px',
                  width: p.size,
                  height: p.size,
                  animationDuration: p.duration,
                  animationDelay: p.delay,
                  opacity: p.opacity,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
