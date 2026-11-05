import { TapButton } from '../game/input/TapButton';

/**
 * "Take a break?" (SPEC §5.4, D46). Outside a service only *Keep cooking* is offered and it just
 * dismisses; *Close the café* arrives with the service in M1/M2.
 */
export function BreakDialog({
  onKeepCooking,
  onCloseCafe,
}: {
  onKeepCooking: () => void;
  onCloseCafe?: () => void;
}) {
  return (
    <div className="dialog-scrim" data-testid="break-dialog" role="dialog" aria-modal="true">
      <div className="dialog">
        <div className="dialog-title">Take a break?</div>
        <div className="dialog-buttons">
          <TapButton className="btn btn-primary dialog-btn" testId="keep-cooking" onTap={onKeepCooking}>
            Keep cooking
          </TapButton>
          {onCloseCafe && (
            <TapButton className="btn btn-secondary dialog-btn" testId="close-cafe" onTap={onCloseCafe}>
              Close the café
            </TapButton>
          )}
        </div>
      </div>
    </div>
  );
}
