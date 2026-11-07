'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type ToastState = { message: string; tone: 'ok' | 'error' } | null

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((message: string, tone: 'ok' | 'error' = 'ok') => {
    if (timer.current) clearTimeout(timer.current)
    setToast({ message, tone })
    timer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return { toast, show }
}

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4">
      <div
        role="status"
        className="pop-in flex items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-xl"
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: toast.tone === 'ok' ? '#5fd39a' : '#ff8a80' }}
        />
        {toast.message}
      </div>
    </div>
  )
}
