export default function FlipClock({ timeRemaining }: { timeRemaining: number }) {
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;

  const mStr = mins.toString().padStart(2, "0");
  const sStr = secs.toString().padStart(2, "0");

  return (
    <div className="flex items-center justify-center gap-4 text-white font-mono select-none">
      <div className="flex gap-2">
        <div className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 flex items-center justify-center shadow-2xl min-w-[80px] md:min-w-[120px]">
          <span className="text-6xl md:text-8xl font-bold tracking-tighter">{mStr[0]}</span>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 flex items-center justify-center shadow-2xl min-w-[80px] md:min-w-[120px]">
          <span className="text-6xl md:text-8xl font-bold tracking-tighter">{mStr[1]}</span>
        </div>
      </div>
      
      <div className="text-4xl md:text-6xl font-bold pb-2 animate-pulse text-[#333]">:</div>
      
      <div className="flex gap-2">
        <div className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 flex items-center justify-center shadow-2xl min-w-[80px] md:min-w-[120px]">
          <span className="text-6xl md:text-8xl font-bold tracking-tighter text-gray-300">{sStr[0]}</span>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 flex items-center justify-center shadow-2xl min-w-[80px] md:min-w-[120px]">
          <span className="text-6xl md:text-8xl font-bold tracking-tighter text-gray-300">{sStr[1]}</span>
        </div>
      </div>
    </div>
  );
}
