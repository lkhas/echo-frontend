import { useEffect, useRef, useState, useMemo } from "react";
import { Howl } from "howler";
import { motion } from "framer-motion";

interface Segment {
  index: number;
  start: number;
  end: number;
  text: string;
}

interface Props {
  audioUrl: string;
  detectedLanguage: string;
  originalSegments: Segment[];
  englishSegments: Segment[];
}

export default function TranscriptViewer({
  audioUrl,
  detectedLanguage,
  originalSegments,
  englishSegments,
}: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<"original" | "english">("original");
  const [search, setSearch] = useState("");
  const [rate, setRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const soundRef = useRef<Howl | null>(null);

  const segments = mode === "original" ? originalSegments : englishSegments;

  const filteredSegments = useMemo(() => {
    if (!search) return segments;
    return segments.filter((s) =>
      s.text.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, segments]);

  useEffect(() => {
    soundRef.current = new Howl({
      src: [audioUrl],
      html5: true,
      rate,
      onplay: () => {
        setIsPlaying(true);
        requestAnimationFrame(trackPlayback);
      },
      onpause: () => setIsPlaying(false),
      onstop: () => setIsPlaying(false),
    });

    return () => {
      soundRef.current?.unload();
    };
  }, [audioUrl]);

  useEffect(() => {
    soundRef.current?.rate(rate);
  }, [rate]);

  const trackPlayback = () => {
    if (!soundRef.current) return;

    const currentTime = soundRef.current.seek() as number;

    const active = segments.find(
      (seg) => currentTime >= seg.start && currentTime <= seg.end
    );

    if (active) {
      setActiveIndex(active.index);
      const el = document.getElementById(`seg-${active.index}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (soundRef.current.playing()) {
      requestAnimationFrame(trackPlayback);
    }
  };

  const handleSeek = (time: number) => {
    soundRef.current?.seek(time);
    soundRef.current?.play();
  };

  const handleCopy = () => {
    const fullText = segments.map((s) => s.text).join(" ");
    navigator.clipboard.writeText(fullText);
    alert("Transcript copied!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 bg-gray-50 p-5 rounded-xl shadow-sm"
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-semibold">Transcript</h3>
          <p className="text-sm text-gray-500">
            Detected Language: <strong>{detectedLanguage}</strong>
          </p>
        </div>

        <div className="space-x-2">
          <button
            onClick={() => setMode("original")}
            className={`px-3 py-1 rounded ${
              mode === "original"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            Original
          </button>
          <button
            onClick={() => setMode("english")}
            className={`px-3 py-1 rounded ${
              mode === "english"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() =>
            isPlaying ? soundRef.current?.pause() : soundRef.current?.play()
          }
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>

        <select
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          <option value={0.75}>0.75x</option>
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
        </select>

        <button
          onClick={handleCopy}
          className="px-3 py-2 bg-gray-300 rounded"
        >
          Copy
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search transcript..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />

      {/* Transcript List */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredSegments.map((seg) => (
          <div
            key={seg.index}
            id={`seg-${seg.index}`}
            onClick={() => handleSeek(seg.start)}
            className={`p-3 rounded cursor-pointer transition-all duration-300 ${
              activeIndex === seg.index
                ? "bg-yellow-300 scale-105 shadow-md"
                : "bg-white"
            }`}
          >
            <span className="text-xs text-gray-500">
              [{seg.start.toFixed(2)}s]
            </span>{" "}
            {seg.text}
          </div>
        ))}
      </div>
    </motion.div>
  );
}