import { Page } from '@playwright/test'

const CAPTION_ID = 'demo-caption'

export async function showCaption(page: Page, text: string, ms = 3500) {
  await page.evaluate(
    ({ text, ms, id }) => {
      document.getElementById(id)?.remove()
      const el = document.createElement('div')
      el.id = id
      el.textContent = text
      Object.assign(el.style, {
        position: 'fixed',
        bottom: '48px',
        left: '50%',
        transform: 'translateX(-50%) translateY(20px)',
        background: 'rgba(15, 23, 42, 0.92)',
        color: 'white',
        padding: '14px 28px',
        borderRadius: '12px',
        fontSize: '20px',
        fontWeight: '500',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        zIndex: '2147483647',
        pointerEvents: 'none',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        maxWidth: '80%',
        textAlign: 'center',
        opacity: '0',
        transition: 'opacity 250ms ease-out, transform 250ms ease-out',
      })
      document.body.appendChild(el)
      requestAnimationFrame(() => {
        el.style.opacity = '1'
        el.style.transform = 'translateX(-50%) translateY(0)'
      })
      setTimeout(() => {
        el.style.opacity = '0'
        el.style.transform = 'translateX(-50%) translateY(20px)'
        setTimeout(() => el.remove(), 300)
      }, ms - 300)
    },
    { text, ms, id: CAPTION_ID }
  )
}

export async function showTitle(page: Page, text: string, ms = 4500) {
  await page.evaluate(
    ({ text, ms }) => {
      document.getElementById('demo-title')?.remove()
      const el = document.createElement('div')
      el.id = 'demo-title'
      el.textContent = text
      Object.assign(el.style, {
        position: 'fixed',
        inset: '0',
        background: 'rgba(15, 23, 42, 0.96)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '48px',
        fontWeight: '700',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        letterSpacing: '-0.02em',
        zIndex: '2147483647',
        pointerEvents: 'none',
        textAlign: 'center',
        padding: '0 40px',
        opacity: '0',
        transition: 'opacity 400ms ease-out',
      })
      document.body.appendChild(el)
      requestAnimationFrame(() => {
        el.style.opacity = '1'
      })
      setTimeout(() => {
        el.style.opacity = '0'
        setTimeout(() => el.remove(), 400)
      }, ms - 400)
    },
    { text, ms }
  )
}
