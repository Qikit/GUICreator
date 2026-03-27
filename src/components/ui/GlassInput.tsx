import { type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode, forwardRef } from 'react'
import s from './GlassInput.module.css'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  as?: 'input'
  prefix?: ReactNode
  suffix?: ReactNode
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  as: 'textarea'
  prefix?: ReactNode
  suffix?: ReactNode
}

type Props = InputProps | TextareaProps

export const GlassInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
  ({ as = 'input', prefix, suffix, className, ...rest }, ref) => {
    const cls = [
      s.input,
      prefix ? s.hasPrefix : '',
      suffix ? s.hasSuffix : '',
      as === 'textarea' ? s.textarea : '',
      className || '',
    ].filter(Boolean).join(' ')

    return (
      <div className={s.wrap}>
        {prefix && <span className={s.prefix}>{prefix}</span>}
        {as === 'textarea' ? (
          <textarea ref={ref as React.Ref<HTMLTextAreaElement>} className={cls} {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
        ) : (
          <input ref={ref as React.Ref<HTMLInputElement>} className={cls} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />
        )}
        {suffix && <span className={s.suffix}>{suffix}</span>}
      </div>
    )
  },
)
