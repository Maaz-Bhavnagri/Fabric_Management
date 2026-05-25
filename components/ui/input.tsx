import * as React from 'react'
import { cn } from '@/lib/utils'
import { SpeechControls } from '@/components/common/SpeechControls'

interface InputProps extends React.ComponentProps<'input'> {
  hideSpeech?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hideSpeech, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null)
    const combinedRef = (node: HTMLInputElement) => {
      internalRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    }

    const isSpeechSupported =
      !hideSpeech &&
      !props.disabled &&
      !props.readOnly &&
      (type === 'text' || type === 'search' || type === 'email' || type === 'tel' || type === 'url' || !type)

    const handleSpeech = (text: string) => {
      if (!internalRef.current) return
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(internalRef.current, text)
        const event = new Event('input', { bubbles: true })
        internalRef.current.dispatchEvent(event)
      }
    }

    const inputClasses = cn(
      'file:text-foreground placeholder:text-muted-foreground/60 selection:bg-primary/20 selection:text-primary dark:bg-slate-900/30 border-border/60 h-11 w-full min-w-0 rounded-xl border bg-slate-50/50 px-4 py-2 text-base shadow-sm transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      'focus-visible:border-primary focus-visible:bg-white focus-visible:ring-primary/10 focus-visible:ring-4 focus-visible:shadow-md',
      'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
      isSpeechSupported ? 'pr-12' : '',
      className,
    )

    const inputElement = (
      <input
        ref={combinedRef}
        type={type}
        data-slot="input"
        className={inputClasses}
        {...props}
      />
    )

    if (isSpeechSupported) {
      return (
        <div className="relative w-full flex items-center group">
          {inputElement}
          <div className="absolute right-2 px-1 border-l border-border/50 transition-opacity">
            <SpeechControls value={String(props.value || '')} onText={handleSpeech} />
          </div>
        </div>
      )
    }

    return inputElement
  }
)
Input.displayName = 'Input'

export { Input }
