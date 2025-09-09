import { useEffect } from 'react'

interface UseModalBlurEffectOptions {
  show: boolean;
}

export const useModalBlurEffect = ({ show }: UseModalBlurEffectOptions) => {
  useEffect(() => {
    const bodyElement = document.body
    const appElement = document.getElementById('root')
    
    if (show) {
      appElement?.classList.add('modal-blur-active')
      bodyElement.classList.add('modal-scroll-lock')
      bodyElement.classList.add('modal-blur-active')
    } else {
      appElement?.classList.remove('modal-blur-active')
      bodyElement.classList.remove('modal-scroll-lock')
      bodyElement.classList.remove('modal-blur-active')
    }

    // Cleanup function
    return () => {
      appElement?.classList.remove('modal-blur-active')
      bodyElement.classList.remove('modal-scroll-lock')
      bodyElement.classList.remove('modal-blur-active')
    }
  }, [show])
}