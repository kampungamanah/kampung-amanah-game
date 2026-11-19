import React, { useEffect, useRef, useState } from 'react';
import { H, W } from './motion';
import defaultEp1Cues from './cues.json';
import defaultEp2Cues from './cues_ep2.json';
import defaultEp3Cues from './cues_ep3.json';
import { KampungAmanahVideo, VideoCues } from './KampungAmanahVideo';
import { Ep2VideoCues, KampungAmanahEp2Video } from './KampungAmanahEp2Video';
import { Ep3VideoCues, KampungAmanahEp3Video } from './KampungAmanahEp3Video';

interface PlayerCanvasProps {
  episode: 1 | 2 | 3;
  frame: number;
  cues: VideoCues | Ep2VideoCues | Ep3VideoCues;
}

export const PlayerCanvas: React.FC<PlayerCanvasProps> = ({ episode, frame, cues }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.32);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setScale(rect.width / W);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const matchedCues =
    (cues as { episode?: number })?.episode === episode
      ? cues
      : episode === 3
      ? (defaultEp3Cues as Ep3VideoCues)
      : episode === 2
      ? (defaultEp2Cues as Ep2VideoCues)
      : (defaultEp1Cues as VideoCues);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${W} / ${H}`,
        overflow: 'hidden',
        backgroundColor: '#38BDF8',
      }}
    >
      <div
        style={{
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {episode === 3 ? (
          <KampungAmanahEp3Video frame={frame} cues={matchedCues as Ep3VideoCues} />
        ) : episode === 2 ? (
          <KampungAmanahEp2Video frame={frame} cues={matchedCues as Ep2VideoCues} />
        ) : (
          <KampungAmanahVideo frame={frame} cues={matchedCues as VideoCues} />
        )}
      </div>
    </div>
  );
};
