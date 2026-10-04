import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import VideoCard from './VideoCard';

export default function VideoCarousel({ videos }) {
  const trackRef = useRef(null);

  const scrollByCards = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('[data-card]');
    const width = card ? card.offsetWidth + 20 : 300;
    track.scrollBy({ left: dir * width, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div ref={trackRef} className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {videos.map((v, i) => (
          <div key={v.videoId} data-card className="w-[78%] shrink-0 snap-center sm:w-[46%] lg:w-[31.5%]">
            <VideoCard {...v} index={i} />
          </div>
        ))}
      </div>
      <button onClick={() => scrollByCards(-1)} aria-label="Previous video"
        className="absolute left-0 top-1/2 hidden -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-700 bg-black/90 p-2.5 text-neutral-300 shadow-lg backdrop-blur transition hover:border-white hover:text-white sm:flex">
        <ChevronLeft size={18} />
      </button>
      <button onClick={() => scrollByCards(1)} aria-label="Next video"
        className="absolute right-0 top-1/2 hidden translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-700 bg-black/90 p-2.5 text-neutral-300 shadow-lg backdrop-blur transition hover:border-white hover:text-white sm:flex">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}