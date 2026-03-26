import type { TextSegment } from '@/types'
import s from '@/styles/shared.module.css'

interface Props {
  segs: TextSegment[]
}

export function McText({ segs }: Props) {
  if (!segs || !segs.length) return null
  return (
    <span>
      {segs.map((seg, i) => {
        const cls = [s.mcText]
        if (seg.bold) cls.push(s.mcBold)
        if (seg.italic) cls.push(s.mcItalic)
        if (seg.underlined) cls.push(s.mcUnderline)
        if (seg.strikethrough) cls.push(s.mcStrikethrough)

        if (seg.obfuscated) {
          return (
            <span key={i} className={[s.mcText, s.mcObfuscated].join(' ')} style={{ color: seg.color }}>
              <span>{seg.text}</span>
            </span>
          )
        }

        return (
          <span key={i} className={cls.join(' ')} style={{ color: seg.color }}>
            {seg.text}
          </span>
        )
      })}
    </span>
  )
}
