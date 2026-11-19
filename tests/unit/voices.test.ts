// Voice picker shows each name and language once (D137): iOS lists Samantha, Daniel, Moira twice.
import { describe, expect, it } from 'vitest';
import { uniqueVoices } from '../../src/audio/speech';

const v = (voiceURI: string, name: string, lang: string, localService = true) => ({ voiceURI, name, lang, localService });

describe('uniqueVoices', () => {
  const ios = [
    v('com.apple.voice.compact.en-US.Samantha', 'Samantha', 'en-US'),
    v('com.apple.speech.synthesis.voice.samantha', 'Samantha', 'en-US'),
    v('com.apple.voice.compact.en-GB.Daniel', 'Daniel', 'en-GB'),
    v('com.apple.speech.synthesis.voice.daniel', 'Daniel', 'en_GB'),
    v('com.apple.voice.compact.en-IE.Moira', 'Moira', 'en-IE'),
    v('moira-2', 'Moira', 'en-IE'),
    v('fred', 'Fred', 'en-US'),
  ];

  it('keeps one per name and language, in the device order', () => {
    expect(uniqueVoices(ios).map((x) => x.name)).toEqual(['Samantha', 'Daniel', 'Moira', 'Fred']);
    expect(uniqueVoices(ios)[0]?.voiceURI).toBe('com.apple.voice.compact.en-US.Samantha');
  });

  it('keeps the chosen voice when it is the second of a pair', () => {
    const out = uniqueVoices(ios, 'com.apple.speech.synthesis.voice.samantha');
    expect(out.filter((x) => x.name === 'Samantha').map((x) => x.voiceURI)).toEqual([
      'com.apple.speech.synthesis.voice.samantha',
    ]);
  });

  it('prefers the on-device voice over a network one of the same name', () => {
    const out = uniqueVoices([v('net', 'Google US English', 'en-US', false), v('local', 'Google US English', 'en-US')]);
    expect(out.map((x) => x.voiceURI)).toEqual(['local']);
  });

  it('keeps the same name in different languages apart', () => {
    expect(uniqueVoices([v('a', 'Karen', 'en-AU'), v('b', 'Karen', 'en-US')])).toHaveLength(2);
  });
});
