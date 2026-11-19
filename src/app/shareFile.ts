// Hands the backup to the grown-up (SPEC §11.6, D37): the share sheet with a JSON file where the
// browser takes one; else the same file as text/plain (Android Chrome shares only an allowlisted
// set of types); else a download link. Must be called synchronously inside the button's tap:
// `share()` needs the tap's user activation, so nothing is awaited before it.

export type ShareOutcome = { kind: 'shared' } | { kind: 'cancelled' } | { kind: 'downloaded'; url: string };

type ShareNav = Navigator & {
  canShare?: (d: { files: File[] }) => boolean;
  share?: (d: { files: File[]; title?: string }) => Promise<void>;
};

function download(json: string, name: string): ShareOutcome {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // The URL stays alive so the screen can also offer it as a visible link (iOS may ignore the click).
  return { kind: 'downloaded', url };
}

export function shareOrDownload(json: string, name: string): Promise<ShareOutcome> {
  const nav = navigator as ShareNav;
  for (const type of ['application/json', 'text/plain']) {
    const file = new File([json], name, { type });
    let ok = false;
    try {
      ok = typeof nav.share === 'function' && !!nav.canShare?.({ files: [file] });
    } catch {
      ok = false;
    }
    if (ok) {
      return nav.share!({ files: [file], title: name }).then(
        (): ShareOutcome => ({ kind: 'shared' }),
        (e: unknown): ShareOutcome =>
          // Closing the share sheet is a choice, not a failure; anything else falls back.
          (e as { name?: unknown } | null)?.name === 'AbortError' ? { kind: 'cancelled' } : download(json, name),
      );
    }
  }
  return Promise.resolve(download(json, name));
}
