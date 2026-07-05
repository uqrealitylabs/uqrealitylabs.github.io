export type HoverAudioPlay = () => Promise<void> | void;
export type HoverAudioStop = () => void;

export interface HoverAudioHandle {
  activeKey: string | null;
  play(key: string, play: HoverAudioPlay, stop?: HoverAudioStop): Promise<void>;
  stop(key?: string): void;
  handleVisibility(hidden: boolean): void;
}

export function createHoverAudioHandle(): HoverAudioHandle {
  let activeKey: string | null = null;
  let activeStop: HoverAudioStop | undefined;

  const stop = (key?: string) => {
    if (key && key !== activeKey) return;
    activeStop?.();
    activeKey = null;
    activeStop = undefined;
  };

  return {
    get activeKey() {
      return activeKey;
    },
    async play(key, play, stopCue) {
      if (activeKey === key) return;
      stop();
      activeKey = key;
      activeStop = stopCue;

      try {
        await play();
      } catch {
        stop();
      }
    },
    stop,
    handleVisibility(hidden) {
      if (hidden) stop();
    },
  };
}
