import { useMessages } from '../i18n.tsx'

type Credit = { name: string; url: string; license: string; note?: string }

const credits: Credit[] = [
  {
    name: 'KanjiVG © Ulrich Apel',
    url: 'https://kanjivg.tagaini.net/',
    license: 'CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/)',
    note: 'Stroke counts and the two-part component structure used in Build it are taken from data derived from KanjiVG. The original data has been modified (stroke paths removed, component structure re-encoded as JSON); the modified data is distributed under the same license.',
  },
  {
    name: 'kanjidist-visualiser © 2024 Lennart Finke & Dominic Schuhmacher',
    url: 'https://github.com/lennart-finke/kanjidist-visualiser',
    license: 'MIT',
    note: 'Kanji similarity used to choose look-alike kanji. The kanjistat distances are computed from KanjiVG (see above).',
  },
  {
    name: 'Stroke edit distances: Lars Yencken, Orthographic support for passing the reading hurdle in Japanese (PhD thesis, University of Melbourne, 2010)',
    url: 'https://lars.yencken.org/datasets/kanji-confusion',
    license: 'CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)',
    note: 'Distributed via kanjidist-visualiser.',
  },
  {
    name: 'topokanji © Dmitry Shpika',
    url: 'https://github.com/scriptin/topokanji',
    license: 'MIT (chosen from the offered licenses)',
    note: 'Order of kanji, from simple shapes to complex ones.',
  },
  {
    name: 'joyo-json © 2021 Benjamin Hoffmann',
    url: 'https://github.com/hoffmannjp/joyo-json',
    license: 'MIT',
    note: 'List of the 2,136 jōyō kanji.',
  },
  {
    name: 'Noto Sans JP © Adobe (Reserved Font Name: Source)',
    url: 'https://github.com/google/fonts/tree/main/ofl/notosansjp',
    license: 'SIL Open Font License 1.1',
    note: 'Subset to the characters used in this app (modified version).',
  },
  {
    name: 'Noto Serif JP © Google Inc.',
    url: 'https://github.com/google/fonts/tree/main/ofl/notoserifjp',
    license: 'SIL Open Font License 1.1',
    note: 'Used for screen text. Subset to the characters used in this app (modified version).',
  },
]

export function CreditsScreen() {
  const m = useMessages()
  return (
    <main className="page credits">
      <h1>{m.creditsTitle}</h1>
      <p>{m.creditsIntro}</p>
      <ul>
        {credits.map((c) => (
          <li key={c.url}>
            <a href={c.url} target="_blank" rel="noreferrer">
              {c.name}
            </a>
            <div className="license">{c.license}</div>
            {c.note && <div className="note">{c.note}</div>}
          </li>
        ))}
      </ul>
      <p>
        <a href="third-party-notices.txt" target="_blank" rel="noreferrer">
          {m.noticesLink}
        </a>
      </p>
    </main>
  )
}
