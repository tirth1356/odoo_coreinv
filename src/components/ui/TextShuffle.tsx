import { useEffect, useState, useRef } from 'react';

interface TextShuffleProps {
  text: string;
  className?: string;
  duration?: number;
  delay?: number;
}

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';

export const TextShuffle = ({ text, className, delay = 0 }: TextShuffleProps) => {
  const [displayText, setDisplayText] = useState(text);
  const intervalRef = useRef<number | null>(null);

  const shuffle = () => {
    let iteration = 0;

    if (intervalRef.current) window.clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      setDisplayText(prev => 
        prev.split('').map((_, index) => {
          if (index < iteration) {
            return text[index];
          }
          return characters[Math.floor(Math.random() * characters.length)];
        }).join('')
      );

      if (iteration >= text.length) {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
      }

      iteration += 1;
    }, 20);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      shuffle();
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, delay]);

  return (
    <span className={className}>
      {displayText}
    </span>
  );
};
