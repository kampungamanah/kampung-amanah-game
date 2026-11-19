import React, { useEffect, useState } from 'react';
import defaultEp1Cues from './cues.json';
import defaultEp2Cues from './cues_ep2.json';
import defaultEp3Cues from './cues_ep3.json';
import { KampungAmanahVideo, VideoCues } from './KampungAmanahVideo';
import { Ep2VideoCues, KampungAmanahEp2Video } from './KampungAmanahEp2Video';
import { Ep3VideoCues, KampungAmanahEp3Video } from './KampungAmanahEp3Video';
import { H, W } from './motion';

declare global {
  interface Window {
    __SET_FRAME__?: (f: number) => void;
    __SET_CUES__?: (c: VideoCues | Ep2VideoCues | Ep3VideoCues) => void;
    __SET_EP__?: (ep: 1 | 2 | 3) => void;
    __RENDER_READY__?: boolean;
  }
}

export const RenderPage: React.FC = () => {
  const epParam = new URLSearchParams(window.location.search).get('ep');
  const initialEp: 1 | 2 | 3 = epParam === '3' ? 3 : epParam === '2' ? 2 : 1;
  const [ep, setEp] = useState<1 | 2 | 3>(initialEp);
  const [frame, setFrame] = useState(0);
  const [cues, setCues] = useState<VideoCues | Ep2VideoCues | Ep3VideoCues>(
    initialEp === 3
      ? (defaultEp3Cues as Ep3VideoCues)
      : initialEp === 2
      ? (defaultEp2Cues as Ep2VideoCues)
      : (defaultEp1Cues as VideoCues)
  );

  useEffect(() => {
    window.__SET_FRAME__ = (f: number) => setFrame(f);
    window.__SET_CUES__ = (c: VideoCues | Ep2VideoCues | Ep3VideoCues) => setCues(c);
    window.__SET_EP__ = (nextEp: 1 | 2 | 3) => setEp(nextEp);
    document.fonts.ready.then(() => {
      window.__RENDER_READY__ = true;
    });
    return () => {
      delete window.__SET_FRAME__;
      delete window.__SET_CUES__;
      delete window.__SET_EP__;
      delete window.__RENDER_READY__;
    };
  }, []);

  return (
    <div style={{ width: W, height: H, overflow: 'hidden', margin: 0, padding: 0 }}>
      {ep === 3 ? (
        <KampungAmanahEp3Video frame={frame} cues={cues as Ep3VideoCues} />
      ) : ep === 2 ? (
        <KampungAmanahEp2Video frame={frame} cues={cues as Ep2VideoCues} />
      ) : (
        <KampungAmanahVideo frame={frame} cues={cues as VideoCues} />
      )}
    </div>
  );
};
