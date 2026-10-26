import { useState } from "react";
import Pronunciation from "./Pronunciation";
import {
  tasks,
  detailItems,
  detailKeys,
  scoreBasic,
  recordMistake,
  fields,
  describe,
  basicErrors,
  detailErrors,
  fieldHint,
  topics,
  topicIds,
  selectTasks,
  sessionSize,
  createSession,
} from "./phonetics";
import type { Features, Topic, SessionLimit } from "./phonetics";

export default function App() {
  const [mode, setMode] = useState<"basic" | "full">("basic");
  const [advanced, setAdvanced] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([...topicIds]);
  const [limit, setLimit] = useState<SessionLimit>(10);
  const available = selectTasks(selectedTopics).length;
  const count = sessionSize(available, limit);
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(tasks);
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [stage, setStage] = useState<"basic" | "details">("basic");
  const [stress, setStress] = useState<number | null>(null);
  const [letters, setLetters] = useState<number | null>(null);
  const [sounds, setSounds] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, Features>>({});
  const [passed, setPassed] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [wrongFields, setWrongFields] = useState<string[]>([]);
  const [reference, setReference] = useState(false);
  const task = round[index];

  function clearWord() {
    setStage("basic");
    setStress(null);
    setLetters(null);
    setSounds(null);
    setAnswers({});
    setPassed(false);
    setFeedback("");
    setWrongFields([]);
    setReference(false);
  }
  function start(words = createSession(selectedTopics, limit)) {
    if (!words.length) return;
    setRound(words);
    setIndex(0);
    setMistakes([]);
    clearWord();
    setStarted(true);
  }
  function check() {
    if (!task || passed) return;
    const wrong = stage === "details" ? detailErrors(task, answers, advanced) : [];
    const basicWrong = stage === "basic" ? basicErrors(task, stress, letters, sounds) : [];
    const success =
      stage === "basic"
        ? scoreBasic(task, stress, letters, sounds)
        : wrong.length === 0;
    setWrongFields(stage === "details" ? wrong.map(({ id, key }) => `${id}:${key}`) : basicWrong);
    if (!success) {
      setMistakes((previous) => recordMistake(previous, task.word));
      setFeedback(
        stage === "basic"
          ? "Проверь подсказки рядом с ошибочными ответами. Можно попробовать ещё!"
          : "Проверь выделенные строки. Ответы можно исправить и проверить снова.",
      );
    } else if (stage === "basic" && mode === "full") {
      setStage("details");
      setFeedback("Первый шаг пройден! Теперь опиши каждый звук.");
    } else {
      setPassed(true);
      setFeedback("Всё верно! Можно переходить к следующему слову.");
    }
  }

  const header = (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">А</span>
        <span>
          Слово<span className="brand-accent">Лёт</span>
        </span>
      </div>
      <span className="top-link">Фонетика · 2–5 класс</span>
      {started && (
        <span>
          {Math.min(index + 1, round.length)} / {round.length}
        </span>
      )}
    </header>
  );

  if (!started)
    return (
      <main className="app">
        {header}
        <section className="welcome">
          <div className="welcome-copy">
            <p className="kicker">МИНИ-ТРЕНАЖЁР</p>
            <h1>
              Слушай слово.
              <br />
              <em>Разбирай</em> легко.
            </h1>
            <p className="intro">
              {tasks.length} слова, маленькие шаги и сколько угодно попыток. Ошибки помогут
              выбрать слова для повторения.
            </p>
            <fieldset className="mode-picker">
              <legend>Выбери тренировку</legend>
              {(["basic", "full"] as const).map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === value}
                    onChange={() => setMode(value)}
                  />
                  <span>
                    <b>{value === "basic" ? "Основы" : "Полный разбор"}</b>
                    <small>
                      {value === "basic"
                        ? "Ударение, буквы и звуки"
                        : "Основы, затем характеристики каждого звука"}
                    </small>
                  </span>
                </label>
              ))}
            </fieldset>
            <label className="advanced-option">
              <input type="checkbox" checked={advanced}
                aria-describedby="advanced-description"
                onChange={(event) => setAdvanced(event.target.checked)} />
              <span>
                <b>Расширенные характеристики согласных</b>
                <small id="advanced-description">Парность по звонкости и мягкости, долгота</small>
              </span>
            </label>
            <fieldset className="topic-picker">
              <legend>Какие темы потренируем?</legend>
              <label className="all-topics">
                <input type="checkbox" checked={selectedTopics.length === topicIds.length}
                  ref={(node) => { if (node) node.indeterminate = selectedTopics.length > 0 && selectedTopics.length < topicIds.length; }}
                  onChange={(event) => setSelectedTopics(event.target.checked ? [...topicIds] : [])} />
                Все темы
              </label>
              {topicIds.map((topic) => <label key={topic}>
                <input type="checkbox" checked={selectedTopics.includes(topic)} onChange={(event) => setSelectedTopics((previous) => event.target.checked ? [...previous, topic] : previous.filter((item) => item !== topic))} />
                {topics[topic]}
              </label>)}
            </fieldset>
            <label className="session-limit">Слов за один подход
              <select value={limit} onChange={(event) => setLimit(event.target.value === "all" ? "all" : Number(event.target.value) as SessionLimit)}>
                {[5, 10, 15, 30, "all"].map((value) => <option key={value} value={value}>{value === "all" ? "Все доступные" : value}</option>)}
              </select>
            </label>
            <p className="session-note" role="status">Доступно: {available}. В подходе: {count}. {available ? "Слова из разных тем не повторяются; порядок случайный." : "Выбери хотя бы одну тему."}</p>
            <button className="primary" disabled={!count} onClick={() => start()}>
              Начать игру · {count} →
            </button>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="sun">✦</div>
            <div className="cloud cloud-one" />
            <div className="cloud cloud-two" />
            <div className="hill hill-back" />
            <div className="hill hill-front" />
            <div className="card-word">ФО-НЕ-ТИ-КА</div>
            <div className="doodle">
              звуки
              <br />
              вокруг нас
            </div>
          </div>
        </section>
        <footer className="welcome-foot">
          <a
            href="https://russkiy-na-5.ru/articles/230"
            target="_blank"
            rel="noreferrer"
          >
            Слова и школьная звуковая запись: «Русский на 5»
          </a>
        </footer>
      </main>
    );

  // Guard the finished round before reading any task properties.
  if (!task)
    return (
      <main className="app">
        {header}
        <section className="result">
          <p className="kicker">КРУГ ЗАВЕРШЁН</p>
          <h1>
            Каждый шаг —<br />
            <em>новое умение!</em>
          </h1>
          <p>
            Пройдено слов: {round.length}. Без ошибок:{" "}
            {round.length - mistakes.length}.
          </p>
          <p>
            {mistakes.length
              ? `Повторим: ${mistakes.join(", ")}.`
              : "Все слова пройдены без ошибок в этом круге!"}
          </p>
          <div className="summary-actions">
            {mistakes.length > 0 && (
              <button
                className="primary"
                onClick={() =>
                  start(round.filter((word) => mistakes.includes(word.word)))
                }
              >
                Повторить слова с ошибками ({mistakes.length})
              </button>
            )}
            <button className="hint" onClick={() => start()}>
              Новый подход · {count} слов
            </button>
            <button
              className="hint"
              onClick={() => {
                clearWord();
                setStarted(false);
              }}
            >
              Изменить темы и режим
            </button>
          </div>
          <p className="result-note">
            В новом круге ошибки считаются заново. Ошибкой считается любая
            неудачная проверка, даже если потом всё исправлено.
          </p>
        </section>
      </main>
    );

  return (
    <main className="app">
      {header}
      <section className="game">
        <div className="game-head">
          <div>
            <p className="kicker">
              {mode === "basic"
                ? "ОСНОВЫ"
                : `ПОЛНЫЙ РАЗБОР · ШАГ ${stage === "basic" ? "1" : "2"} ИЗ 2`}
            </p>
            <h1>
              Разложи слово
              <br />
              <em>на звуки</em>
            </h1>
          </div>
        </div>
        <progress aria-label="Пройдено слов" value={index} max={round.length} />
        <div className="word-card">
          <span>Слово для разбора</span>
          <strong>{task.word}</strong>
          <Pronunciation key={`${index}-${task.word}`} word={task.word} />
          {stage === "basic" ? (
            <>
              <div className="syllables">
                {task.syllables.map((part, i) => (
                  <button
                    key={i}
                    disabled={passed}
                    aria-pressed={stress === i}
                    aria-invalid={wrongFields.includes("stress")}
                    aria-describedby={wrongFields.includes("stress") ? "stress-hint" : undefined}
                    className={`syllable ${stress === i ? "selected" : ""} ${wrongFields.includes("stress") ? "choice-error" : ""}`}
                    onClick={() => {
                      setStress(i);
                     setFeedback("");
                      setWrongFields((previous) => previous.filter((key) => key !== "stress"));
                    }}
                  >
                    {part}
                  </button>
                ))}
              </div>
              {wrongFields.includes("stress") && (
                <small id="stress-hint" className="field-hint">Правильный ударный слог: {task.stress + 1}. В слове «{task.word}» он произносится сильнее.</small>
              )}
              <small>Нажми на ударный слог</small>
            </>
          ) : (
            <>
              <div className="whole-transcription">{task.transcription}</div>
              <small>
                Штрих ' — мягкость, : — долгота, знак над гласной — ударение.
              </small>
            </>
          )}
        </div>
        {stage === "basic" ? (
          <div className="questions">
            {(["letters", "sounds"] as const).map((kind) => (
              <label className="question" key={kind}>
                <span>
                  {kind === "letters" ? "Сколько букв?" : "Сколько звуков?"}
                </span>
                <select
                  disabled={passed}
                  value={(kind === "letters" ? letters : sounds) ?? ""}
                  aria-invalid={wrongFields.includes(kind)}
                  aria-describedby={wrongFields.includes(kind) ? `${kind}-hint` : undefined}
                  onChange={(event) => {
                    const value =
                      event.target.value === ""
                        ? null
                        : Number(event.target.value);
                    if (kind === "letters") setLetters(value);
                    else setSounds(value);
                    setFeedback("");
                    setWrongFields((previous) => previous.filter((key) => key !== kind));
                  }}
                >
                  <option value="">Выбери число</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                {wrongFields.includes(kind) && (
                  <small id={`${kind}-hint`} className="field-hint">
                    Правильный ответ: {kind === "letters" ? task.letters : task.sounds}.
                    {kind === "letters" ? " Считаем все буквы слова." : " Считаем звуки, включая два звука у некоторых букв и не считая немые."}
                  </small>
                )}
              </label>
            ))}
          </div>
        ) : (
          <div className="detail-exercise">
            <p>
              Для каждой строки выбери тип звука, затем его признаки. У одной
              буквы бывает два звука, а у двух букв — один.
            </p>
            {detailItems(task).map((item) => {
              const answer = answers[item.id] ?? {};
              const keys = detailKeys(answer.kind, advanced);
              return (
                <fieldset
                  key={item.id}
                    className={`sound-row ${wrongFields.some((key) => key.startsWith(`${item.id}:`)) ? "row-error" : ""}`}
                  disabled={passed}
                >
                  <legend>
                    {item.letter} → [{item.symbol}]{" "}
                    {wrongFields.some((key) => key.startsWith(`${item.id}:`)) && "· Проверь выделенные поля"}
                  </legend>
                  <div className="feature-grid">
                    {keys.map((key) => (
                      <fieldset className="feature-group" key={key}
                        aria-invalid={wrongFields.includes(`${item.id}:${key}`)}
                        aria-describedby={wrongFields.includes(`${item.id}:${key}`) ? `${item.id}-${key}-hint` : undefined}
                      >
                        <legend>{fields[key].label}</legend>
                        <div className="feature-choices">
                          {fields[key].options.map(([value, label]) => (
                            <label className="feature-choice" key={value}>
                              <input
                                type="radio"
                                name={`${item.id}-${key}`}
                                value={value}
                                checked={answer[key] === value}
                                aria-invalid={wrongFields.includes(`${item.id}:${key}`)}
                                aria-describedby={wrongFields.includes(`${item.id}:${key}`) ? `${item.id}-${key}-hint` : undefined}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setAnswers((previous) => ({
                                    ...previous,
                                    [item.id]:
                                      key === "kind"
                                        ? { kind: value }
                                        : { ...previous[item.id], [key]: value },
                                  }));
                                  setFeedback("");
                                  setWrongFields((previous) => previous.filter((error) =>
                                    key === "kind" ? !error.startsWith(`${item.id}:`) : error !== `${item.id}:${key}`,
                                  ));
                                }}
                              />
                              <span>{label}</span>
                            </label>
                          ))}
                        </div>
                        {wrongFields.includes(`${item.id}:${key}`) && (
                          <small id={`${item.id}-${key}-hint`} className="field-hint">
                            {fieldHint(task, item, key, answer[key])}
                          </small>
                        )}
                      </fieldset>
                    ))}
                  </div>
                </fieldset>
              );
            })}
          </div>
        )}
        {feedback && <div className={`feedback ${passed ? "good" : ""}`} role="status">{feedback}</div>}
        <div className="bottom-actions">
          {!passed ? (
            <button
              className="primary"
              onClick={check}
              disabled={
                stage === "basic" &&
                (stress === null || letters === null || sounds === null)
              }
            >
              Проверить {stage === "details" ? "характеристики" : "ответы"}
            </button>
          ) : (
            <button
              className="primary"
              onClick={() => {
                setIndex((value) => value + 1);
                clearWord();
              }}
            >
              {index + 1 === round.length
                ? "Завершить круг"
                : "Следующее слово →"}
            </button>
          )}
          {mode === "basic" && (
            <button
              className="hint"
              onClick={() => setReference((value) => !value)}
            >
              {reference ? "Скрыть" : "Показать"} эталонный разбор
            </button>
          )}
        </div>
        {reference && mode === "basic" && (
          <aside className="transcription">
            <b>{task.transcription}</b>
            <p>
              Ударный слог: {task.stress + 1}. Букв: {task.letters}, звуков:{" "}
              {task.sounds}.
            </p>
            {detailItems(task).map((item) => (
              <div key={item.id} className="reference-row">
                <strong>
                  {item.letter} → [{item.symbol}]
                </strong>
                <span>{describe(item.features)}</span>
              </div>
            ))}
            <p>
              Школьная упрощённая запись. В слове «поезд» е обозначает [и],
              без отдельного [й’]. Озвучивание устройства может отличаться от этой записи.
            </p>
          </aside>
        )}
      </section>
    </main>
  );
}
