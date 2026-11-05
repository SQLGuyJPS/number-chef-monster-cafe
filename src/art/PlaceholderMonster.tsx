import { placeholderMonsterSvg } from './monsterSvg';

const markup = placeholderMonsterSvg();

export function PlaceholderMonster({ size, className }: { size: number; className?: string }) {
  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      aria-hidden="true"
      // Static markup authored in this repo; no user input reaches it.
      dangerouslySetInnerHTML={{ __html: markup.replace('width="200" height="200"', 'width="100%" height="100%"') }}
    />
  );
}
