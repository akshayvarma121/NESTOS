import { useState, useEffect } from 'react';

export default function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    
    const update = () => {
      const now = new Date().getTime();
      const diff = target - now;
      
      if (diff <= 0) {
        setIsPast(true);
        setTimeLeft('Expired');
        return;
      }
      
      setIsPast(false);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      let str = '';
      if (days > 0) str += `${days}d `;
      if (hours > 0 || days > 0) str += `${hours}h `;
      str += `${minutes}m`;
      
      setTimeLeft(str);
    };

    update();
    const interval = setInterval(update, 60000); // update every minute
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <span className={`font-mono font-medium ${isPast ? 'text-red-500' : 'text-orange-500'}`}>
      {timeLeft}
    </span>
  );
}
