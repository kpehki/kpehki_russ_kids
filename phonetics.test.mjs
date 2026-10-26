import test from "node:test";
import assert from "node:assert/strict";
import {
  tasks,
  detailItems,
  detailKeys,
  scoreBasic,
  scoreDetails,
  recordMistake,
  fields,
  basicErrors,
  detailErrors,
  fieldHint,
  topics,
  topicIds,
  selectTasks,
  sessionSize,
  createSession,
  sourceWords,
} from "./phonetics.ts";

test("all literal mappings preserve letters, sounds, syllables and stress", () => {
  assert.equal(tasks.length, 87);
  assert.equal(new Set(tasks.map((task) => task.word)).size, tasks.length);
  for (const task of tasks) {
    assert.ok(task.topics.length > 0, task.word);
    assert.equal(new Set(task.topics).size, task.topics.length);
    assert.ok(task.topics.every((topic) => topic in topics));
    assert.equal(task.rows.map((row) => row.letter).join(""), task.word);
    assert.equal([...task.word].length, task.letters);
    assert.equal(task.rows.flatMap((row) => row.sounds).length, task.sounds);
    assert.equal(task.syllables.join(""), task.word);
    assert.ok(task.stress >= 0 && task.stress < task.syllables.length);
    const sounds = task.rows.flatMap((row) => row.sounds);
    assert.equal(
      sounds.filter((sound) => sound.features.kind === "vowel").length,
      task.syllables.length,
    );
    assert.equal(
      sounds.filter((sound) => sound.features.stress === "stressed").length,
      1,
    );
    const vowelsBeforeStress = sounds
      .filter((sound) => sound.features.kind === "vowel")
      .findIndex((sound) => sound.features.stress === "stressed");
    assert.equal(vowelsBeforeStress, task.stress);
    for (const item of detailItems(task)) {
      for (const [key, value] of Object.entries(item.features)) {
        assert.ok(fields[key].options.some((option) => option[0] === value));
      }
      const keys = Object.keys(item.features);
      assert.equal(
        keys.length,
        item.features.kind === "none"
          ? 1
          : item.features.kind === "vowel"
            ? 2
            : 6,
      );
    }
  }
});

for (const topic of topicIds) {
  test(`${topic} has at least 10 unique words verified on the original site`, () => {
    const verified = selectTasks([topic]).filter((task) => task.sourceUrls.length);
    assert.ok(new Set(verified.map((task) => task.word)).size >= 10,
      `${topic}: only ${verified.length} sourced words`);
  });
}

test("provenance lists only bank words and original-site URLs", () => {
  for (const task of tasks.slice(64)) assert.ok(task.sourceUrls.length, task.word);
  for (const [url, words] of Object.entries(sourceWords)) {
    assert.match(url, /^https:\/\/russkiy-na-5\.ru\/(articles\/\d+|rules\/\d+(\/test)?)$/);
    for (const word of words.split(" ")) {
      assert.ok(tasks.some((task) => task.word === word && task.sourceUrls.includes(url)), word);
    }
  }
});

test("curated topic members exhibit the advertised phonetic phenomenon", () => {
  for (const task of selectTasks(["softSign"])) assert.ok(task.word.includes("ь"), task.word);
  for (const task of selectTasks(["twoSounds"])) {
    assert.ok(task.rows.some((row) => /^[еёюя]$/.test(row.letter)
      && row.sounds.length === 2 && row.sounds[0].symbol === "й'"), task.word);
  }
  for (const task of selectTasks(["devoicing"])) {
    assert.ok(task.rows.some((row) => /^[бвгдзж]$/.test(row.letter)
      && row.sounds.some((sound) => sound.features.voice === "voiceless")), task.word);
  }
  for (const task of selectTasks(["silent"])) {
    assert.ok(task.rows.some((row) => row.sounds.length === 0 && !/[ьъ]/.test(row.letter)), task.word);
  }
  for (const task of selectTasks(["combined"])) {
    assert.ok(task.rows.some((row) => /^(зж|сш|зч|сж|сч)$/.test(row.letter)
      && row.sounds.length === 1 && row.sounds[0].features.length === "long"), task.word);
  }
  for (const task of selectTasks(["voicing"])) {
    assert.ok(task.rows.some((row) => /^[пфктсш]$/.test(row.letter)
      && row.sounds.some((sound) => sound.features.voice === "voiced"))
      || task.rows.some((row) => row.letter === "сж" && row.sounds[0].symbol === "ж:"), task.word);
  }
});

test("new literal analyses retain silent consonants, long sibilants and reflexive assimilation", () => {
  for (const [name, transcription] of [
    ["праздный", "[пра́зный']"],
    ["сердце", "[с'э́рцэ]"],
    ["счастливый", "[ш':исл'и́вый']"],
    ["чувствовать", "[ч'у́ствават']"],
    ["здравствуй", "[здра́ствуй']"],
    ["косьба", "[каз'ба́]"],
    ["просьба", "[про́з'ба]"],
    ["экзамен", "[эгза́м'ин]"],
    ["сговориться", "[згавар'и́ц:а]"],
    ["перевозчик", "[п'ир'иво́ш':ик]"],
    ["загрузчик", "[загру́ш':ик]"],
    ["сжалиться", "[ж:а́л'иц:а]"],
    ["счастье", "[ш':а́с'т'й'э]"],
  ]) {
    assert.equal(tasks.find((task) => task.word === name)?.transcription, transcription, name);
  }
});

test("topic selection is a deduplicated union and all topics cover the bank", () => {
  assert.deepEqual(selectTasks([]), []);
  assert.deepEqual(selectTasks(topicIds), tasks);
  for (const topic of topicIds) assert.ok(selectTasks([topic]).length > 0);
  const union = selectTasks(["softSign", "combined"]);
  assert.equal(new Set(union.map((task) => task.word)).size, union.length);
  assert.ok(union.some((task) => task.word === "разжечь"));
  assert.deepEqual(new Set(union), new Set([...selectTasks(["softSign"]), ...selectTasks(["combined"])]));
  assert.ok(selectTasks(["twoSounds"]).some((task) => task.word === "ёж"));
  assert.ok(selectTasks(["voicing"]).some((task) => task.word === "сдача"));
});

test("session limits clamp, sample without replacement, and never mutate the bank", () => {
  const original = tasks.map((task) => task.word);
  for (const limit of [5, 10, 15, 30, "all"]) {
    const session = createSession(topicIds, limit, () => 0);
    assert.equal(session.length, sessionSize(tasks.length, limit));
    assert.equal(new Set(session).size, session.length);
    assert.ok(session.every((task) => tasks.includes(task)));
    assert.equal(createSession(["combined"], limit).length, sessionSize(selectTasks(["combined"]).length, limit));
    assert.deepEqual(createSession([], limit), []);
  }
  assert.notDeepEqual(createSession(topicIds, "all", () => 0).map((task) => task.word), original);
  assert.deepEqual(tasks.map((task) => task.word), original);
  assert.equal(sessionSize(0, 5), 0);
  const round = createSession(["devoicing"], 5, () => 0);
  const mistakes = [round[0].word, "еда"];
  assert.deepEqual(round.filter((task) => mistakes.includes(task.word)), [round[0]]);
});

test("source-specific edge cases stay literal", () => {
  const word = (name) => tasks.find((task) => task.word === name);
  assert.deepEqual(
    word("еда").rows[0].sounds.map((sound) => sound.symbol),
    ["й'", "и"],
  );
  assert.deepEqual(
    word("ателье").rows[5].sounds.map((sound) => sound.symbol),
    ["й'", "э́"],
  );
  assert.equal(word("ателье").rows[4].sounds.length, 0);
  assert.equal(word("поезд").transcription, "[по́ист]");
  assert.equal(word("поезд").sounds, 5);
  for (const [name, letters, symbol] of [
    ["грузчик", "зч", "ш':"],
    ["разжечь", "зж", "ж:"],
    ["сшить", "сш", "ш:"],
  ]) {
    const row = word(name).rows.find((row) => row.letter === letters);
    assert.equal(row.sounds.length, 1);
    assert.equal(row.sounds[0].symbol, symbol);
    assert.equal(row.sounds[0].features.length, "long");
  }
  for (const name of ["солнце", "местный", "властный"])
    assert.ok(word(name).rows.some((row) => row.sounds.length === 0));
});

test("basic checks require every correct answer and allow corrected retries", () => {
  for (const task of tasks) {
    assert.equal(scoreBasic(task, null, null, null), false);
    assert.equal(
      scoreBasic(task, task.stress, task.letters, task.sounds + 1),
      false,
    );
    assert.equal(
      scoreBasic(task, task.stress + 1, task.letters, task.sounds),
      false,
    );
    assert.equal(
      scoreBasic(task, task.stress, task.letters + 1, task.sounds),
      false,
    );
    assert.equal(
      scoreBasic(task, task.stress, task.letters, task.sounds),
      true,
    );
  }
});

test("detail scoring checks every applicable feature, including silent rows", () => {
  for (const task of tasks) {
    const items = detailItems(task);
    const answers = Object.fromEntries(
      items.map((item) => [item.id, { ...item.features }]),
    );
    assert.deepEqual(scoreDetails(task, answers, true), []);
    assert.equal(scoreDetails(task, {}, true).length, items.length);
    for (const item of items) {
      for (const key of Object.keys(item.features)) {
        const changed = {
          ...answers,
          [item.id]: { ...answers[item.id], [key]: "wrong" },
        };
        assert.deepEqual(scoreDetails(task, changed, true), [item.id]);
        assert.deepEqual(detailErrors(task, changed, true), [{ id: item.id, key }]);
        const missing = { ...answers, [item.id]: { ...item.features } };
        delete missing[item.id][key];
        assert.deepEqual(detailErrors(task, missing, true), [{ id: item.id, key }]);
      }
    }
  }
});

test("default detail validation ignores advanced fields but requires all core fields", () => {
  assert.deepEqual(detailKeys("consonant"), ["kind", "voice", "softness"]);
  assert.deepEqual(detailKeys("consonant", true), ["kind", "voice", "softness", "voicePair", "softPair", "length"]);
  for (const task of tasks) {
    const items = detailItems(task);
    const answers = Object.fromEntries(items.map((item) => [item.id,
      Object.fromEntries(detailKeys(item.features.kind).map((key) => [key, item.features[key]])),
    ]));
    assert.deepEqual(detailErrors(task, answers), []);
    assert.deepEqual(scoreDetails(task, answers, false), []);
    for (const item of items) {
      for (const key of detailKeys(item.features.kind)) {
        for (const value of [undefined, "wrong"]) {
          const changed = { ...answers, [item.id]: { ...answers[item.id], [key]: value } };
          assert.deepEqual(detailErrors(task, changed, false), [{ id: item.id, key }]);
          assert.deepEqual(scoreDetails(task, changed), [item.id]);
        }
      }
      if (item.features.kind === "consonant") {
        for (const key of ["voicePair", "softPair", "length"]) {
          answers[item.id][key] = "wrong";
        }
      }
    }
    assert.deepEqual(detailErrors(task, answers, false), []);
    assert.deepEqual(scoreDetails(task, answers), []);
  }
});

test("feedback validation identifies only submitted fields and explains missing answers", () => {
  const task = tasks.find((item) => item.word === "разжечь");
  const item = detailItems(task).find((entry) => entry.symbol === "ж:");
  assert.deepEqual(basicErrors(task, task.stress + 1, task.letters, task.sounds), ["stress"]);
  const answers = Object.fromEntries(
    detailItems(task).map((entry) => [entry.id, { ...entry.features }]),
  );
  answers[item.id].length = "short";
  assert.deepEqual(detailErrors(task, answers, true), [{ id: item.id, key: "length" }]);
  assert.match(fieldHint(task, item, "length"), /выбери/);
});

test("mistakes are unique per word and repeat rounds can start fresh", () => {
  const mistakes = recordMistake(recordMistake([], "еда"), "еда");
  assert.deepEqual(mistakes, ["еда"]);
  assert.deepEqual(recordMistake(mistakes, "поезд"), ["еда", "поезд"]);
  assert.deepEqual(mistakes, ["еда"]);
  const repeat = tasks.filter((task) => mistakes.includes(task.word));
  assert.deepEqual(
    repeat.map((task) => task.word),
    ["еда"],
  );
  assert.deepEqual(recordMistake([], repeat[0].word), ["еда"]);
});
