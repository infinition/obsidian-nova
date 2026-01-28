import { useState, useEffect } from 'react';

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    isMobile: false
  });

  useEffect(() => {
    // Détection initiale
    const checkMobile = () => {
      try {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
      } catch (e) {
        return false;
      }
    };

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: checkMobile()
      });
    };

    // Appel initial
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dimensions;
};