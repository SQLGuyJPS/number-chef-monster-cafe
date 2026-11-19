import { useEffect, useRef, useState } from 'react';
import { buildExport, ImportError, parseImport, replaceFromImport, resetAll, type ParsedImport } from '../storage/backup';
import { balance } from '../engine/replay';
import { getStorageBoot } from './runtime';
import { getProgress, useDerived } from './progress';
import { useSettings } from './deviceSettings';
import { shareOrDownload, type ShareOutcome } from './shareFile';
import { ParentGate } from './ParentGate';

const DAY_MS = 86_400_000;

function ago(at: number | undefined, now: number): string {
  if (!at) return 'never on this device';
  const days = Math.floor((now - at) / DAY_MS);
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
}

const day = (t: number) => new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

/** After a Replace or Reset the app starts again from the Splash, so nothing in memory is stale (D136). */
const restart = () => location.reload();

type Step =
  | { k: 'idle' }
  | { k: 'error'; msg: string }
  | { k: 'checksum'; imp: ParsedImport; asked: 1 | 2 }
  | { k: 'summary'; imp: ParsedImport }
  | { k: 'gate'; then: 'replace' | 'reset'; imp?: ParsedImport }
  | { k: 'resetAsk' }
  | { k: 'working' };

/**
 * Data (SPEC §11.6, §12, M3b): Export, Replace-only import, Reset and the install help (§11.4).
 * Replace and Reset both ask a second multiplication question and write a snapshot first.
 */
export function ParentData() {
  const derived = useDerived();
  const settings = useSettings();
  const [built, setBuilt] = useState<{ json: string; name: string; for: unknown[] } | null>(null);
  const [shareResult, setShareResult] = useState<ShareOutcome | null>(null);
  const [lastBackup, setLastBackup] = useState<number | undefined>(undefined);
  const [step, setStep] = useState<Step>({ k: 'idle' });
  const fileInput = useRef<HTMLInputElement>(null);
  const [now] = useState(() => Date.now());
  const coins = balance(derived);

  // The file is built ahead of the tap: `share()` must run inside the tap's user activation, and
  // hashing is async (D136). Rebuilt whenever progress or settings change.
  useEffect(() => {
    let live = true;
    void (async () => {
      const boot = await getStorageBoot();
      if (!boot) return;
      await (await getProgress())?.flush();
      const out = await buildExport(boot.storage, boot.deviceId, Date.now());
      const last = await boot.storage.getMeta('lastBackupAt');
      if (!live) return;
      setBuilt({ json: out.json, name: out.name, for: [derived, settings] });
      setLastBackup(last);
    })().catch(() => undefined);
    return () => {
      live = false;
    };
  }, [derived, settings]);

  // Only a file made from the current progress and settings is offered.
  const prepared = built && built.for[0] === derived && built.for[1] === settings ? built : null;

  const onExport = () => {
    if (!prepared) return;
    setShareResult(null);
    void shareOrDownload(prepared.json, prepared.name).then(async (r) => {
      setShareResult(r);
      if (r.kind === 'cancelled') return;
      const at = Date.now();
      setLastBackup(at);
      await (await getStorageBoot())?.storage.setMeta('lastBackupAt', at);
    });
  };

  const onFile = async (file: File | undefined) => {
    if (fileInput.current) fileInput.current.value = '';
    if (!file) return;
    try {
      const imp = await parseImport(await file.text());
      setStep(imp.checksumOk ? { k: 'summary', imp } : { k: 'checksum', imp, asked: 1 });
    } catch (e) {
      setStep({ k: 'error', msg: e instanceof ImportError ? e.message : "This file couldn't be read." });
    }
  };

  const run = async (what: 'replace' | 'reset', imp?: ParsedImport) => {
    setStep({ k: 'working' });
    try {
      const boot = await getStorageBoot();
      if (!boot) throw new Error('no storage');
      await (await getProgress())?.flush();
      if (what === 'replace' && imp) await replaceFromImport(boot.storage, boot.deviceId, imp, Date.now());
      else await resetAll(boot.storage, boot.deviceId, Date.now());
      restart();
    } catch (e) {
      setStep({ k: 'error', msg: `That didn't work: ${e instanceof Error ? e.message : String(e)}` });
    }
  };

  if (step.k === 'gate') {
    return (
      <ParentGate
        testId="confirm-gate"
        title={step.then === 'replace' ? 'Restore this backup?' : 'Reset this device?'}
        text={
          step.then === 'replace'
            ? "Answer to replace this device's progress, coins and settings with the backup."
            : "Answer to erase this device's progress, coins and settings."
        }
        cancelLabel="Cancel"
        onCancel={() => setStep({ k: 'idle' })}
        onPass={() => void run(step.then, step.imp)}
      />
    );
  }

  return (
    <section className="parent-data" data-testid="parent-data">
      <h2>Data</h2>

      <h3>Back up</h3>
      <p>
        Saves all progress and coins, and this device&apos;s settings, to a file. Keep it somewhere safe (Files,
        Drive or email) and restore it below if this device loses its data. Last backup:{' '}
        <span data-testid="last-backup">{ago(lastBackup, now)}</span>.
      </p>
      <p>
        <button
          type="button"
          className="parent-button"
          data-testid="export"
          disabled={!prepared}
          // A real click (not pointerup) so every browser counts it as the user activation share() needs.
          onClick={onExport}
        >
          {prepared ? 'Back up now' : 'Preparing…'}
        </button>
      </p>
      {shareResult?.kind === 'shared' && <p data-testid="export-result">Backup shared.</p>}
      {shareResult?.kind === 'downloaded' && prepared && (
        <p data-testid="export-result">
          Backup downloaded. If nothing was saved,{' '}
          <a href={shareResult.url} download={prepared.name} data-testid="export-link">
            tap here to save {prepared.name}
          </a>
          .
        </p>
      )}

      <h3>Restore from a backup</h3>
      <p>
        Replaces everything on this device (progress, coins and settings) with the backup. A copy of what is here now
        is kept first. Merging two devices comes in a later version.
      </p>
      <p>
        <button
          type="button"
          className="parent-button"
          data-testid="import"
          disabled={step.k === 'working'}
          onClick={() => {
            setStep({ k: 'idle' });
            fileInput.current?.click();
          }}
        >
          Choose a backup file…
        </button>
        {/* Permissive accept: a narrow one greys the file out in the iOS Files picker (SPEC §11.6). */}
        <input
          ref={fileInput}
          type="file"
          accept="*/*"
          hidden
          data-testid="import-file"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </p>
      {step.k === 'error' && (
        <p className="parent-warn" data-testid="import-error" role="alert">
          {step.msg}
        </p>
      )}
      {step.k === 'checksum' && (
        <div className="parent-confirm" data-testid="checksum-warning" role="alert">
          <p>
            {step.asked === 1
              ? "This file's check code doesn't match its contents: it may have been changed or damaged since it was saved."
              : 'Are you sure? Restoring a damaged file can lose progress.'}
          </p>
          <button
            type="button"
            className="parent-button"
            data-testid="checksum-continue"
            onClick={() =>
              setStep(step.asked === 1 ? { ...step, asked: 2 } : { k: 'summary', imp: step.imp })
            }
          >
            {step.asked === 1 ? 'Use it anyway' : 'Yes, use it'}
          </button>{' '}
          <button type="button" className="parent-button" data-testid="import-cancel" onClick={() => setStep({ k: 'idle' })}>
            Cancel
          </button>
        </div>
      )}
      {step.k === 'summary' && (
        <div className="parent-confirm" data-testid="import-summary">
          <p>
            Backup{step.imp.deviceLabel ? ` from “${step.imp.deviceLabel}”` : ''} saved {day(step.imp.exportedAt)}:{' '}
            {step.imp.events.length} entries
            {step.imp.span ? `, ${day(step.imp.span.from)} to ${day(step.imp.span.to)}` : ''}, with{' '}
            <span data-testid="import-coins">{step.imp.coins}</span> coins.
          </p>
          <p>
            Restoring replaces this device&apos;s progress and settings; its coins go from {coins} to {step.imp.coins}.
          </p>
          <button
            type="button"
            className="parent-button"
            data-testid="import-confirm"
            onClick={() => setStep({ k: 'gate', then: 'replace', imp: step.imp })}
          >
            Restore this backup
          </button>{' '}
          <button type="button" className="parent-button" data-testid="import-cancel" onClick={() => setStep({ k: 'idle' })}>
            Cancel
          </button>
        </div>
      )}

      <h3>Reset</h3>
      <p>
        Erases all progress, coins and settings on this device, for a fresh start (for example after playtesting). Back
        up first if you might want them again: restoring an older backup brings its progress back.
      </p>
      {step.k === 'resetAsk' ? (
        <div className="parent-confirm" data-testid="reset-confirm">
          <p>Erase everything on this device? Coins go from {coins} to 0.</p>
          <button
            type="button"
            className="parent-button parent-danger"
            data-testid="reset-yes"
            onClick={() => setStep({ k: 'gate', then: 'reset' })}
          >
            Yes, reset
          </button>{' '}
          <button type="button" className="parent-button" data-testid="reset-cancel" onClick={() => setStep({ k: 'idle' })}>
            Cancel
          </button>
        </div>
      ) : (
        <p>
          <button
            type="button"
            className="parent-button"
            data-testid="reset"
            disabled={step.k === 'working'}
            onClick={() => setStep({ k: 'resetAsk' })}
          >
            Reset this device…
          </button>
        </p>
      )}
      {step.k === 'working' && <p data-testid="data-working">Working… the game restarts when done.</p>}
    </section>
  );
}

/** Install help (SPEC §11.4): text only, no detection code (D37). */
export function InstallHelp() {
  return (
    <section className="parent-help" data-testid="install-help">
      <h2>Install on the Home Screen</h2>
      <p>
        <strong>Install before the first play.</strong> On an iPad or iPhone, a Safari tab and the Home Screen app keep
        separate progress, and Safari may clear a tab&apos;s data after 7 days without a visit. The Home Screen app is
        kept.
      </p>
      <h3>iPad and iPhone (Safari)</h3>
      <ol>
        <li>Open the game in Safari.</li>
        <li>Tap the Share button (a square with an arrow pointing up).</li>
        <li>Tap “Add to Home Screen”, then “Add”.</li>
        <li>Play from the new icon on the Home Screen from now on.</li>
      </ol>
      <h3>Android (Chrome)</h3>
      <ol>
        <li>Open the game in Chrome.</li>
        <li>Tap the menu (three dots, top right).</li>
        <li>Tap “Add to Home screen” or “Install app”, then “Install”.</li>
        <li>Play from the new icon from now on.</li>
      </ol>
      <p className="parent-note">
        Back up now and then (above). Each device keeps its own progress; a backup from one device can be restored on
        another.
      </p>
    </section>
  );
}
