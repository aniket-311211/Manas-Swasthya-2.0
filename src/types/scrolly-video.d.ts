declare module 'scrolly-video/dist/ScrollyVideo.esm.jsx' {
  import type * as React from 'react';

  export interface ScrollyVideoProps {
    src: string;
    transitionSpeed?: number;
    frameThreshold?: number;
    cover?: boolean;
    sticky?: boolean;
    full?: boolean;
    trackScroll?: boolean;
    lockScroll?: boolean;
    useWebCodecs?: boolean;
    videoPercentage?: number;
    onReady?: () => void;
    onChange?: (percentage: number) => void;
    debug?: boolean;
  }

  const ScrollyVideo: React.ForwardRefExoticComponent<
    ScrollyVideoProps & React.RefAttributes<{
      setVideoPercentage: (percentage: number, options?: object) => void;
    }>
  >;

  export default ScrollyVideo;
}
