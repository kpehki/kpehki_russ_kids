# Phonetics Trainer

Run `npm run dev`, `npm test`, or `npm run build`. Tests use Node's built-in
runner and native TypeScript stripping (Node 22.18+ or a newer supported release).

The bank contains 87 words with literal letter-to-sound mappings. The original
30 follow <https://russkiy-na-5.ru/articles/230>. All 64 existing entries are
retained unchanged; 23 sourced additions use the same simplified school
convention (not automatically generated pronunciations).
Sound properties come from
an explicit sound inventory, not spelling-based pronunciation rules. Notation
and obvious source label typos are normalized; monosyllabic vowels also show
stress, and consonant pairedness is supplied consistently. In particular,
`поезд` has five sounds, with unstressed `и` and no extra `й`.

Basic mode checks stress and letter/sound counts, with an optional reference.
Full mode requires the same check before showing transcription and asking for
sound characteristics. A successful check is required to advance. Any failed
check marks that word for repetition, even after a successful retry. Repeating
mistakes starts a fresh round containing only mistakes from the completed round,
with fresh mistake tracking. A new approach samples from the retained settings.
Progress and configuration are session-only and reset on page reload.

The start screen offers seven overlapping topics: fundamentals, soft sign,
devoicing, two sounds for е/ё/ю/я, silent consonants, combined long sounds
зж/сш/зч/сж/сч, and voicing assimilation. All topics can be selected or cleared
together; partial selection is indicated. The union contains no duplicate words.
Choose 5, 10, 15, 30, or all available words; the actual session size is clamped
to availability. An empty selection disables start. Shuffling happens only when
starting a new approach, never during answers or renders. Returning to settings
retains mode, topics, and requested count.

The word card offers opt-in browser SpeechSynthesis audio in both modes,
including the full-detail step. It requests ru-RU and uses a Russian voice when
available, updating the voice list on voiceschanged. Playback is cancelled when
leaving a word. No audio files, API keys, new dependencies, or microphone access
are needed. Browser/device voices may be absent, require network access, or
mispronounce stress and difficult words; audio is not the phonetic reference.
Unsupported browsers and playback errors show a non-blocking message.

Responsive styles and keyboard-accessible native controls are provided. Tests
cover literal bank consistency, scoring, hints, topic unions, session sampling,
limits, and mistake filtering. Visual interaction and device-specific speech
still need browser testing.

## Verified Sources

Checked against the live original website on 2026-10-25. `sourceWords` in
`phonetics.ts` is the word-level source table; every task exposes the matching
`sourceUrls`. An empty list means an older curated word has not been verified,
not that it was found on the site. Tests require at least 10 distinct sourced
words in **each selectable topic**, without counting the all-topics union.

| Topic | All Words | Verified Words |
| --- | ---: | ---: |
| Fundamentals | 23 | 13 |
| Soft Sign | 24 | 20 |
| Devoicing | 14 | 10 |
| Two Sounds | 14 | 11 |
| Silent Consonants | 11 | 10 |
| Combined Long Sounds | 11 | 11 |
| Voicing | 13 | 13 |

Topics overlap: the union has 87 unique words, 66 verified. The long-sound topic
now explicitly includes `сж` and `сч`, alongside the original `зж`, `сш`, `зч`.
These combinations produce the same long sibilants; this is an explicit scope
extension, not a claim to have found ten examples restricted to the original
three spellings. The original three examples and their mappings are unchanged.

Sources used (the exact words associated with each URL are in `sourceWords`):

| URL | Evidence |
| --- | --- |
| <https://russkiy-na-5.ru/articles/230> | Full analyses of the original 30 words |
| <https://russkiy-na-5.ru/articles/157> | Sound properties, assimilation, silent-consonant examples, and transcriptions |
| <https://russkiy-na-5.ru/articles/227> | Full analysis of `праздный` |
| <https://russkiy-na-5.ru/articles/228> | Transcriptions including `косьба`, `сдать`, `экзамен`, `счёт` |
| <https://russkiy-na-5.ru/articles/229> | Preparatory exercises and transcription answers |
| <https://russkiy-na-5.ru/articles/231> | Word occurrences in phonetics questions and answers, including voicing examples |
| <https://russkiy-na-5.ru/rules/31> | `сделать`, `сдать`, `сдача` and the voicing rule |
| <https://russkiy-na-5.ru/rules/31/test> | Written examples including `сжать`, `сжалиться`, `стог` |
| <https://russkiy-na-5.ru/rules/50> | `перевоз+чик`, explicitly shown with the suffix boundary |
| <https://russkiy-na-5.ru/rules/50/test> | `загруз...ик` with the explicit answer `чик` |

Source verification distinguishes word occurrence from a full phonetic analysis.
For rule examples and test options without full analyses, the mappings are
editorially curated using the site's phonetic conventions, not quoted dictionary
entries. The suffix exercises above explicitly determine the completed words;
they are not invented derivatives. All additions retain literal stress, sound
counts, and sound features. `тьс` in reflexive verbs is one long `[ц:]`;
`счастливый` has silent `т`, while `счастье` retains `[т']`. For `экзамен`,
the page explicitly permits initial `[э]`; that variant is used here.

The linked dictionary <https://russkiy-na-5.ru/phonetics> returned HTTP 500 via
webfetch (also with a trailing slash and the www host) and via curl over HTTP.
No unavailable dictionary entries are cited as verified. Article 221 was also
read for the analysis procedure but supplies no additional word evidence.

The 21 older words without verified provenance remain available to preserve the
existing bank: `мак дым шар лук рак стул мама луна рука конь соль моль ноль суп
сад год пруд ёлка яма юг грустный`. They do not count toward any verified minimum.
Live source availability and the linguistic correctness of the original site
are not guaranteed by offline tests; the tests check provenance wiring, topic
coverage, literal consistency, and the advertised consonant phenomena.
