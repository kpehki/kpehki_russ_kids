export type Features = Record<string, string>;
export type Task = {
  word: string;
  syllables: string[];
  stress: number;
  letters: number;
  sounds: number;
  rows: { letter: string; sounds: { symbol: string; features: Features }[] }[];
  transcription: string;
  topics: Topic[];
  sourceUrls: string[];
};

export const topics = {
  fundamentals: "Основы: простые слова",
  softSign: "Мягкий знак",
  devoicing: "Оглушение согласных",
  twoSounds: "Е, ё, ю, я: два звука",
  silent: "Непроизносимые согласные",
  combined: "Долгие звуки: зж, сш, зч, сж, сч",
  voicing: "Озвончение согласных",
} as const;
export type Topic = keyof typeof topics;
export const topicIds = Object.keys(topics) as Topic[];
export type SessionLimit = 5 | 10 | 15 | 30 | "all";

// Literal sound inventory: properties belong to sounds, never inferred from spelling.
const inventory: Record<string, string[]> = {
  а: ["v"],
  а́: ["v", "stress"],
  о: ["v"],
  о́: ["v", "stress"],
  э: ["v"],
  э́: ["v", "stress"],
  и: ["v"],
  и́: ["v", "stress"],
  ы: ["v"],
  ы́: ["v", "stress"],
  у: ["v"],
  у́: ["v", "stress"],
  б: ["c", "voiced", "hard", "paired", "paired"],
  "б'": ["c", "voiced", "soft", "paired", "paired"],
  в: ["c", "voiced", "hard", "paired", "paired"],
  г: ["c", "voiced", "hard", "paired", "paired"],
  "г'": ["c", "voiced", "soft", "paired", "paired"],
  д: ["c", "voiced", "hard", "paired", "paired"],
  "д'": ["c", "voiced", "soft", "paired", "paired"],
  з: ["c", "voiced", "hard", "paired", "paired"],
  "з'": ["c", "voiced", "soft", "paired", "paired"],
  ж: ["c", "voiced", "hard", "paired", "unpaired"],
  "ж:": ["c", "voiced", "hard", "paired", "unpaired", "long"],
  п: ["c", "voiceless", "hard", "paired", "paired"],
  "п'": ["c", "voiceless", "soft", "paired", "paired"],
  ф: ["c", "voiceless", "hard", "paired", "paired"],
  к: ["c", "voiceless", "hard", "paired", "paired"],
  "к'": ["c", "voiceless", "soft", "paired", "paired"],
  т: ["c", "voiceless", "hard", "paired", "paired"],
  "т'": ["c", "voiceless", "soft", "paired", "paired"],
  с: ["c", "voiceless", "hard", "paired", "paired"],
  "с'": ["c", "voiceless", "soft", "paired", "paired"],
  ш: ["c", "voiceless", "hard", "paired", "unpaired"],
  "ш:": ["c", "voiceless", "hard", "paired", "unpaired", "long"],
  "ш':": ["c", "voiceless", "soft", "unpaired", "unpaired", "long"],
  "ч'": ["c", "voiceless", "soft", "unpaired", "unpaired"],
  ц: ["c", "voiceless", "hard", "unpaired", "unpaired"],
  "ц:": ["c", "voiceless", "hard", "unpaired", "unpaired", "long"],
  л: ["c", "voiced", "hard", "unpaired", "paired"],
  "л'": ["c", "voiced", "soft", "unpaired", "paired"],
  м: ["c", "voiced", "hard", "unpaired", "paired"],
  "м'": ["c", "voiced", "soft", "unpaired", "paired"],
  н: ["c", "voiced", "hard", "unpaired", "paired"],
  "н'": ["c", "voiced", "soft", "unpaired", "paired"],
  р: ["c", "voiced", "hard", "unpaired", "paired"],
  "р'": ["c", "voiced", "soft", "unpaired", "paired"],
  "й'": ["c", "voiced", "soft", "unpaired", "unpaired"],
};

// First 30: https://russkiy-na-5.ru/articles/230. Additions use the same
// simplified school notation. Every mapping is literal; '-' is silent.
const source: [string, number, number, number, string][] = [
  ["день|ги", 0, 6, 5, "д=д' е=э́ н=н' ь=- г=г' и=и"],
  ["луч", 0, 3, 3, "л=л у=у́ ч=ч'"],
  ["солн|це", 0, 6, 5, "с=с о=о́ л=- н=н ц=ц е=э"],
  ["си|ним", 0, 5, 5, "с=с' и=и́ н=н' и=и м=м"],
  ["лож|ка", 0, 5, 5, "л=л о=о́ ж=ш к=к а=а"],
  ["про|спект", 1, 8, 8, "п=п р=р о=а с=с п=п' е=э́ к=к т=т"],
  ["о|кно", 1, 4, 4, "о=а к=к н=н о=о́"],
  ["груз", 0, 4, 4, "г=г р=р у=у́ з=с"],
  ["груз|чик", 0, 7, 6, "г=г р=р у=у́ зч=ш': и=и к=к"],
  ["мышь", 0, 4, 3, "м=м ы=ы́ ш=ш ь=-"],
  ["е|да", 1, 3, 4, "е=й',и д=д а=а́"],
  ["въезд", 0, 5, 5, "в=в ъ=- е=й',э́ з=с д=т"],
  ["мест|ный", 0, 7, 6, "м=м' е=э́ с=с т=- н=н ы=ы й=й'"],
  ["глушь", 0, 5, 4, "г=г л=л у=у́ ш=ш ь=-"],
  ["раз|жечь", 1, 7, 5, "р=р а=а зж=ж: е=э́ ч=ч' ь=-"],
  ["а|тель|е", 2, 6, 6, "а=а т=т е=э л=л' ь=- е=й',э́"],
  ["ци|фры", 0, 5, 5, "ц=ц и=ы́ ф=ф р=р ы=ы"],
  ["сшить", 0, 5, 3, "сш=ш: и=ы́ т=т' ь=-"],
  ["ноч|ной", 1, 6, 6, "н=н о=а ч=ч' н=н о=о́ й=й'"],
  ["о|поз|дав", 2, 7, 7, "о=а п=п о=а з=з д=д а=а́ в=ф"],
  ["о|быс|кать", 2, 8, 7, "о=а б=б ы=ы с=с к=к а=а́ т=т' ь=-"],
  ["объ|ём|ный", 1, 8, 8, "о=а б=б ъ=- ё=й',о́ м=м н=н ы=ы й=й'"],
  ["ружь|ё", 1, 5, 5, "р=р у=у ж=ж ь=- ё=й',о́"],
  ["туч", 0, 3, 3, "т=т у=у́ ч=ч'"],
  ["ложь", 0, 4, 3, "л=л о=о́ ж=ш ь=-"],
  ["власт|ный", 0, 8, 7, "в=в л=л а=а́ с=с т=- н=н ы=ы й=й'"],
  ["е|го", 1, 3, 4, "е=й',и г=в о=о́"],
  ["тест", 0, 4, 4, "т=т е=э́ с=с т=т"],
  ["по|езд", 0, 5, 5, "п=п о=о́ е=и з=с д=т"],
  ["вок|заль|ный", 1, 10, 9, "в=в о=а к=г з=з а=а́ л=л' ь=- н=н ы=ы й=й'"],
  ["мак", 0, 3, 3, "м=м а=а́ к=к"],
  ["дом", 0, 3, 3, "д=д о=о́ м=м"],
  ["кот", 0, 3, 3, "к=к о=о́ т=т"],
  ["дым", 0, 3, 3, "д=д ы=ы́ м=м"],
  ["сыр", 0, 3, 3, "с=с ы=ы́ р=р"],
  ["шар", 0, 3, 3, "ш=ш а=а́ р=р"],
  ["лук", 0, 3, 3, "л=л у=у́ к=к"],
  ["рак", 0, 3, 3, "р=р а=а́ к=к"],
  ["стол", 0, 4, 4, "с=с т=т о=о́ л=л"],
  ["стул", 0, 4, 4, "с=с т=т у=у́ л=л"],
  ["ма|ма", 0, 4, 4, "м=м а=а́ м=м а=а"],
  ["ла|па", 0, 4, 4, "л=л а=а́ п=п а=а"],
  ["лу|на", 1, 4, 4, "л=л у=у н=н а=а́"],
  ["ру|ка", 1, 4, 4, "р=р у=у к=к а=а́"],
  ["конь", 0, 4, 3, "к=к о=о́ н=н' ь=-"],
  ["соль", 0, 4, 3, "с=с о=о́ л=л' ь=-"],
  ["моль", 0, 4, 3, "м=м о=о́ л=л' ь=-"],
  ["ноль", 0, 4, 3, "н=н о=о́ л=л' ь=-"],
  ["дуб", 0, 3, 3, "д=д у=у́ б=п"],
  ["суп", 0, 3, 3, "с=с у=у́ п=п"],
  ["сад", 0, 3, 3, "с=с а=а́ д=т"],
  ["год", 0, 3, 3, "г=г о=о́ д=т"],
  ["зуб", 0, 3, 3, "з=з у=у́ б=п"],
  ["пруд", 0, 4, 4, "п=п р=р у=у́ д=т"],
  ["стог", 0, 4, 4, "с=с т=т о=о́ г=к"],
  ["ёж", 0, 2, 3, "ё=й',о́ ж=ш"],
  ["ёл|ка", 0, 4, 5, "ё=й',о́ л=л к=к а=а"],
  ["ю|ла", 1, 3, 4, "ю=й',у л=л а=а́"],
  ["я|ма", 0, 3, 4, "я=й',а́ м=м а=а"],
  ["ем", 0, 2, 3, "е=й',э́ м=м"],
  ["юг", 0, 2, 3, "ю=й',у́ г=к"],
  ["яс|ный", 0, 5, 6, "я=й',а́ с=с н=н ы=ы й=й'"],
  ["груст|ный", 0, 8, 7, "г=г р=р у=у́ с=с т=- н=н ы=ы й=й'"],
  ["сда|ча", 0, 5, 5, "с=з д=д а=а́ ч=ч' а=а"],
  ["празд|ный", 0, 8, 7, "п=п р=р а=а́ з=з д=- н=н ы=ы й=й'"],
  ["позд|но", 0, 6, 5, "п=п о=о́ з=з д=- н=н о=а"],
  ["серд|це", 0, 6, 5, "с=с' е=э́ р=р д=- ц=ц е=э"],
  ["счаст|ли|вый", 1, 10, 8, "сч=ш': а=и с=с т=- л=л' и=и́ в=в ы=ы й=й'"],
  ["празд|ник", 0, 8, 7, "п=п р=р а=а́ з=з д=- н=н' и=и к=к"],
  ["чувст|во|вать", 0, 11, 9, "ч=ч' у=у́ в=- с=с т=т в=в о=а в=в а=а т=т' ь=-"],
  ["здрав|ствуй", 0, 10, 9, "з=з д=д р=р а=а́ в=- с=с т=т в=в у=у й=й'"],
  ["кось|ба", 1, 6, 5, "к=к о=а с=з' ь=- б=б а=а́"],
  ["прось|ба", 0, 7, 6, "п=п р=р о=о́ с=з' ь=- б=б а=а"],
  ["сдать", 0, 5, 4, "с=з д=д а=а́ т=т' ь=-"],
  ["эк|за|мен", 1, 7, 7, "э=э к=г з=з а=а́ м=м' е=и н=н"],
  ["сго|во|рить|ся", 2, 11, 9, "с=з г=г о=а в=в о=а р=р' и=и́ тьс=ц: я=а"],
  ["сбой", 0, 4, 4, "с=з б=б о=о́ й=й'"],
  ["эк|зо|ти|ка", 1, 8, 8, "э=э к=г з=з о=о́ т=т' и=и к=к а=а"],
  ["сде|лать", 0, 7, 6, "с=з д=д' е=э́ л=л а=а т=т' ь=-"],
  ["от|бой", 1, 5, 5, "о=а т=д б=б о=о́ й=й'"],
  ["раз|жать", 1, 7, 5, "р=р а=а зж=ж: а=а́ т=т' ь=-"],
  ["пе|ре|воз|чик", 2, 10, 9, "п=п' е=и р=р' е=и в=в о=о́ зч=ш': и=и к=к"],
  ["за|груз|чик", 1, 9, 8, "з=з а=а г=г р=р у=у́ зч=ш': и=и к=к"],
  ["сжать", 0, 5, 3, "сж=ж: а=а́ т=т' ь=-"],
  ["сжа|лить|ся", 0, 9, 6, "сж=ж: а=а́ л=л' и=и тьс=ц: я=а"],
  ["счёт", 0, 4, 3, "сч=ш': ё=о́ т=т"],
  ["счасть|е", 0, 7, 6, "сч=ш': а=а́ с=с' т=т' ь=- е=й',э"],
];

// Verified word occurrences, not a claim that every page supplies a full analysis.
// Empty provenance on retained legacy additions is deliberate. See README.
export const sourceWords: Record<string, string> = {
  "https://russkiy-na-5.ru/articles/230": "деньги луч солнце синим ложка проспект окно груз грузчик мышь еда въезд местный глушь разжечь ателье цифры сшить ночной опоздав обыскать объёмный ружьё туч ложь властный его тест поезд вокзальный",
  "https://russkiy-na-5.ru/articles/157": "дом кот дуб зуб просьба косьба поздно сердце счастливый чувствовать здравствуй сжать счастье",
  "https://russkiy-na-5.ru/articles/227": "праздный",
  "https://russkiy-na-5.ru/articles/228": "косьба сдать экзамен счёт",
  "https://russkiy-na-5.ru/articles/229": "лапа стол сыр ёж юла ем дом зуб сердце счёт",
  "https://russkiy-na-5.ru/articles/231": "праздник ясный сдача сговориться сбой экзотика отбой разжать",
  "https://russkiy-na-5.ru/rules/31": "сделать сдача сдать",
  "https://russkiy-na-5.ru/rules/31/test": "сжать сжалиться стог",
  "https://russkiy-na-5.ru/rules/50": "перевозчик",
  "https://russkiy-na-5.ru/rules/50/test": "загрузчик",
};

// Curated membership, not rules inferred from spelling. Topics may overlap.
const topicWords: Record<Topic, string> = {
  fundamentals: "луч синим проспект окно цифры ночной туч тест мак дом кот дым сыр шар лук рак стол стул мама лапа луна рука суп",
  softSign: "деньги мышь глушь разжечь ателье сшить обыскать ружьё ложь вокзальный конь соль моль ноль косьба просьба сдать сделать разжать сжать сжалиться чувствовать сговориться счастье",
  devoicing: "ложка груз въезд опоздав ложь поезд дуб сад год зуб пруд стог ёж юг",
  twoSounds: "еда въезд ателье объёмный ружьё его ёж ёлка юла яма ем юг ясный счастье",
  silent: "солнце местный властный грустный праздный поздно сердце счастливый праздник чувствовать здравствуй",
  combined: "грузчик разжечь сшить разжать перевозчик загрузчик сжать сжалиться счёт счастье счастливый",
  voicing: "вокзальный сдача косьба просьба сдать экзамен сговориться сбой экзотика сделать отбой сжать сжалиться",
};

export const tasks: Task[] = source.map(
  ([parts, stress, letters, sounds, mapping]) => {
    const rows = mapping.split(" ").map((entry) => {
      const [letter, tokens] = entry.split("=");
      return {
        letter,
        sounds:
          tokens === "-"
            ? []
            : tokens.split(",").map((symbol) => {
                const data = inventory[symbol];
                if (!data) throw new Error(`Unknown sound: ${symbol}`);
                const features: Features =
                  data[0] === "v"
                    ? {
                        kind: "vowel",
                        stress:
                          data[1] === "stress" ? "stressed" : "unstressed",
                      }
                    : {
                        kind: "consonant",
                        voice: data[1],
                        softness: data[2],
                        voicePair: data[3],
                        softPair: data[4],
                        length: data[5] === "long" ? "long" : "short",
                      };
                return { symbol, features };
              }),
      };
    });
    return {
      word: parts.split("|").join(""),
      syllables: parts.split("|"),
      stress,
      letters,
      sounds,
      topics: topicIds.filter((topic) => topicWords[topic].split(" ").includes(parts.split("|").join(""))),
      sourceUrls: Object.entries(sourceWords)
        .filter(([, words]) => words.split(" ").includes(parts.split("|").join("")))
        .map(([url]) => url),
      rows,
      transcription: `[${rows.flatMap((row) => row.sounds.map((sound) => sound.symbol)).join("")}]`,
    };
  },
);

export function selectTasks(selected: readonly Topic[]) {
  return tasks.filter((task) => task.topics.some((topic) => selected.includes(topic)));
}

export function sessionSize(available: number, limit: SessionLimit) {
  return limit === "all" ? available : Math.min(available, limit);
}

export function createSession(selected: readonly Topic[], limit: SessionLimit, random = Math.random) {
  const words = selectTasks(selected);
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  return words.slice(0, sessionSize(words.length, limit));
}

export function scoreBasic(
  task: Task,
  stress: number | null,
  letters: number | null,
  sounds: number | null,
) {
  return (
    stress === task.stress && letters === task.letters && sounds === task.sounds
  );
}
export function detailItems(task: Task) {
  return task.rows.flatMap((row, i) =>
    row.sounds.length
      ? row.sounds.map((sound, j) => ({
          id: `${i}-${j}`,
          letter: row.letter,
          symbol: sound.symbol,
          features: sound.features,
        }))
      : [
          {
            id: `${i}-0`,
            letter: row.letter,
            symbol: "—",
            features: { kind: "none" } as Features,
          },
        ],
  );
}
export function detailKeys(kind?: string, advanced = false): string[] {
  if (kind === "vowel") return ["kind", "stress"];
  if (kind === "consonant") return [
    "kind", "voice", "softness",
    ...(advanced ? ["voicePair", "softPair", "length"] : []),
  ];
  return ["kind"];
}
export function scoreDetails(task: Task, answers: Record<string, Features>, advanced = false) {
  return [...new Set(detailErrors(task, answers, advanced).map(({ id }) => id))];
}
export type DetailError = { id: string; key: string };
export function detailErrors(task: Task, answers: Record<string, Features>, advanced = false): DetailError[] {
  return detailItems(task).flatMap((item) =>
    detailKeys(item.features.kind, advanced)
      .filter((key) => answers[item.id]?.[key] !== item.features[key])
      .map((key) => ({ id: item.id, key })),
  );
}
export function basicErrors(
  task: Task,
  stress: number | null,
  letters: number | null,
  sounds: number | null,
) {
  return [
    ...(stress !== task.stress ? ["stress"] : []),
    ...(letters !== task.letters ? ["letters"] : []),
    ...(sounds !== task.sounds ? ["sounds"] : []),
  ];
}
export function fieldHint(
  task: Task,
  item: { letter: string; symbol: string; features: Features },
  key: string,
  answer?: string,
) {
  const expected = fields[key].options.find(([value]) => value === item.features[key])?.[1] ?? "нужное значение";
  const actual = answer ? fields[key].options.find(([value]) => value === answer)?.[1] : undefined;
  if (!answer) return `${fields[key].label}: выбери «${expected}» для звука [${item.symbol}] в слове «${task.word}».`;
  if (key === "voice") return `У [${item.symbol}] голос ${expected.toLowerCase()}: ${actual?.toLowerCase()} здесь не подходит.`;
  if (key === "softness") return `Звук [${item.symbol}] в «${task.word}» ${expected.toLowerCase()} из-за его произношения.`;
  if (key === "voicePair" || key === "softPair") return `У [${item.symbol}] ${expected.toLowerCase()} по ${key === "voicePair" ? "звонкости" : "мягкости"}: послушай, есть ли у него парный звук.`;
  if (key === "length") return `В [${item.symbol}] слышится ${expected === "Долгий" ? "долгий звук: он тянется дольше обычного" : "обычная, короткая длительность"}.`;
  if (key === "stress") return `В слове «${task.word}» этот гласный ${expected.toLowerCase()}: именно его слог произносится сильнее.`;
  if (key === "kind") return `[${item.symbol}] в слове «${task.word}» — это ${expected?.toLowerCase()}.`;
  return `${fields[key].label}: правильный ответ — «${expected}».`;
}
export function recordMistake(mistakes: string[], word: string): string[] {
  return mistakes.includes(word) ? mistakes : [...mistakes, word];
}
export const fields: Record<
  string,
  { label: string; options: [string, string][] }
> = {
  kind: {
    label: "Это…",
    options: [
      ["none", "Нет звука"],
      ["vowel", "Гласный"],
      ["consonant", "Согласный"],
    ],
  },
  stress: {
    label: "Ударение",
    options: [
      ["stressed", "Ударный"],
      ["unstressed", "Безударный"],
    ],
  },
  voice: {
    label: "Голос",
    options: [
      ["voiced", "Звонкий"],
      ["voiceless", "Глухой"],
    ],
  },
  softness: {
    label: "Мягкость",
    options: [
      ["soft", "Мягкий"],
      ["hard", "Твёрдый"],
    ],
  },
  voicePair: {
    label: "Пара по звонкости",
    options: [
      ["paired", "Есть пара"],
      ["unpaired", "Нет пары"],
    ],
  },
  softPair: {
    label: "Пара по мягкости",
    options: [
      ["paired", "Есть пара"],
      ["unpaired", "Нет пары"],
    ],
  },
  length: {
    label: "Длительность",
    options: [
      ["short", "Обычный"],
      ["long", "Долгий"],
    ],
  },
};
export function describe(features: Features) {
  return Object.entries(features)
    .map(
      ([key, value]) =>
        fields[key].options.find((option) => option[0] === value)?.[1],
    )
    .join(", ");
}
