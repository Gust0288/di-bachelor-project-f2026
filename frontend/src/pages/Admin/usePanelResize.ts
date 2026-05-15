import { useState } from 'react'

export function usePanelResize(defaultWidth: number, min = 280, max = 800) {
  const [width, setWidth] = useState(defaultWidth)

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = width
    function onMove(ev: MouseEvent) {
      setWidth(Math.max(min, Math.min(max, startWidth + (startX - ev.clientX))))
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return { width, onMouseDown }
}
