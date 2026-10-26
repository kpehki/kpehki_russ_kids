import { useEffect, useRef, useState } from "react";

export default function Pronunciation({ word }: { word: string }) {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [message, setMessage] = useState("");
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const update = () => setVoices(synth.getVoices());
    update();
    synth.addEventListener("voiceschanged", update);
    return () => {
      synth.removeEventListener("voiceschanged", update);
      if (utterance.current) {
        utterance.current.onend = null;
        utterance.current.onerror = null;
      }
      synth.cancel();
    };
  }, [supported]);

  function speak() {
    if (!supported || speaking) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const speech = new SpeechSynthesisUtterance(word);
    speech.lang = "ru-RU";
    const voice = voices.find((item) => /^ru(?:[-_]|$)/i.test(item.lang));
    if (voice) speech.voice = voice;
    speech.rate = 0.85;
    speech.onend = () => setSpeaking(false);
    speech.onerror = () => {
      setSpeaking(false);
      setMessage("Не удалось озвучить слово. Попробуй ещё раз или проверь голоса в настройках устройства.");
    };
    utterance.current = speech;
    setMessage("");
    setSpeaking(true);
    try {
      synth.speak(speech);
    } catch {
      setSpeaking(false);
      setMessage("Озвучивание сейчас недоступно. Можно продолжить без него.");
    }
  }

  return <div className="pronunciation">
    <button className="audio-button" disabled={!supported || speaking} onClick={speak} aria-label={`Послушать слово «${word}»`} aria-busy={speaking}>
      {speaking ? "Произношу…" : "Послушать слово"}
    </button>
    <small role="status">{!supported ? "В этом браузере нет озвучивания. Можно заниматься без него." : message || "Голос устройства: произношение и ударение могут отличаться от эталона; русский голос доступен не везде."}</small>
  </div>;
}
