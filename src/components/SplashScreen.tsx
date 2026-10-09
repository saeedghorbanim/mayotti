import { useState, useEffect } from 'react';
import splashImage from '@/assets/mayotti-splash.png';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

const SplashScreen = ({ onComplete, duration = 2500 }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration - 500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, duration]);

  return (
    <div 
      className={`fixed inset-0 z-50 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <img 
        src={splashImage} 
        alt="Mayotti" 
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default SplashScreen;
