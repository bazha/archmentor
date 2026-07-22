import { AudioPlayer } from './AudioPlayer';
import type { ConceptSpeech } from './useConceptSpeech';

export function AudioDock({ speech, visible }: { speech: ConceptSpeech; visible: boolean }): JSX.Element | null {
  if (speech.status === 'unsupported') return null;

  return (
    <div
      data-testid="audio-dock"
      aria-hidden={!visible || undefined}
      className={[
        'fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/80 px-4 py-3 backdrop-blur-xl',
        'transition-transform duration-200 motion-reduce:transition-none md:px-8 md:pl-[15.5rem]',
        visible ? 'translate-y-0' : 'invisible translate-y-full',
      ].join(' ')}
    >
      <AudioPlayer speech={speech} />
    </div>
  );
}
