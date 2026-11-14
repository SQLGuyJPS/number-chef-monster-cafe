import { useEffect } from 'react';
import { TapButton } from '../game/input/TapButton';
import { phrase } from '../engine/phrases';
import { PIP_PITCH, speakText } from '../audio/speech';

/**
 * "Continue dinner service?" (SPEC §5.8, §11.6, D33): offered, never resumed silently. Two big
 * buttons; Pip asks aloud because the child may not read yet.
 */
export function ResumeDialog({ onContinue, onNew }: { onContinue: () => void; onNew: () => void }) {
  useEffect(() => {
    void speakText(phrase('resume.ask'), { pitch: PIP_PITCH });
  }, []);
  return (
    <div className="dialog-scrim" data-testid="resume-dialog" role="dialog" aria-modal="true">
      <div className="dialog">
        <div className="dialog-title">{phrase('resume.ask')}</div>
        <div className="dialog-buttons">
          <TapButton className="btn btn-primary dialog-btn" testId="resume-yes" onTap={onContinue}>
            Keep cooking
          </TapButton>
          <TapButton className="btn btn-secondary dialog-btn" testId="resume-no" onTap={onNew}>
            Not now
          </TapButton>
        </div>
      </div>
    </div>
  );
}
