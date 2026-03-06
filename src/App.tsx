import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Crown, Sparkles, ChevronRight, RotateCcw, Info, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// --- Types & Data ---
type SceneId = 'intro' | 'meeting' | 'discussion' | 'gift' | 'ending_good' | 'ending_bad';

interface Choice {
  text: string;
  nextScene: SceneId;
  points: number;
}

interface Scene {
  id: SceneId;
  text: string;
  characterExpression: string;
  choices: Choice[];
}

const SCENES: Record<SceneId, Scene> = {
  intro: {
    id: 'intro',
    text: "あなたは「豚の国」の外交官として、いじっぱりでプライドが高いことで有名なシャルロット王女の元を訪れました。彼女を攻略し、その心を開くことができるでしょうか？",
    characterExpression: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?auto=format&fit=crop&q=80&w=1000", // 王女らしいポートレート
    choices: [
      { text: "謁見の間へ進む", nextScene: 'meeting', points: 0 }
    ]
  },
  meeting: {
    id: 'meeting',
    text: "「ふん、また新しい外交官かしら？ 私の時間を無駄にしないことね。挨拶くらい、まともにできるのかしら？」",
    characterExpression: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?auto=format&fit=crop&q=80&w=1000",
    choices: [
      { text: "深々と頭を下げ、敬意を表す", nextScene: 'discussion', points: 10 },
      { text: "堂々と目を見て挨拶する", nextScene: 'discussion', points: 5 },
      { text: "「お美しいですね」と見惚れる", nextScene: 'discussion', points: -5 }
    ]
  },
  discussion: {
    id: 'discussion',
    text: "「我が国の豚肉料理は世界一よ。当然、あなたもそう思うでしょう？ 否定なんて許さないわよ。」",
    characterExpression: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?auto=format&fit=crop&q=80&w=1000",
    choices: [
      { text: "「その通りです、至高の味わいでした」", nextScene: 'gift', points: 10 },
      { text: "「王女の美しさの方が勝っています」", nextScene: 'gift', points: -10 },
      { text: "「他国の料理も興味深いですよ」", nextScene: 'gift', points: 0 }
    ]
  },
  gift: {
    id: 'gift',
    text: "「……ふん。少しは話がわかるようね。最後に聞くわ。あなたは、私の何に惹かれてここへ来たの？」",
    characterExpression: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?auto=format&fit=crop&q=80&w=1000",
    choices: [
      { text: "「王女の気高い精神に惹かれました」", nextScene: 'ending_good', points: 20 },
      { text: "「その可愛らしい素顔が見たくて」", nextScene: 'ending_good', points: 10 },
      { text: "「仕事ですから」", nextScene: 'ending_bad', points: -20 }
    ]
  },
  ending_good: {
    id: 'ending_good',
    text: "「……変な人。でも、嫌いじゃないわ。これからも私のそばで、その言葉を証明し続けなさい。いいわね？」",
    characterExpression: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?auto=format&fit=crop&q=80&w=1000",
    choices: []
  },
  ending_bad: {
    id: 'ending_bad',
    text: "「期待外れね。衛兵！ この無礼者を外へ連れ出しなさい！ 二度と私の前に現れないで！」",
    characterExpression: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?auto=format&fit=crop&q=80&w=1000",
    choices: []
  }
};

// --- App Component ---
export default function App() {
  const [currentSceneId, setCurrentSceneId] = useState<SceneId>('intro');
  const [lovePoints, setLovePoints] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    const generateCharacter = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
        // The user's image is provided in the prompt context, but for the app to work 
        // we'll use a prompt that describes the character based on the user's request.
        // In a real scenario, we might pass the original image as base64 if we had it stored.
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: 'Create a 2D anime-style illustration of a princess that captures the realistic facial features of a woman with a round face, a wide and cheerful smile showing her teeth, and slightly plump cheeks. She has black hair tied back with some loose strands. She is wearing a professional black suit over a white collared shirt. Her expression should be stubborn and proud, yet maintain the charming likeness of the original person. Avoid over-beautifying; focus on a realistic anime style that reflects her unique facial structure and personality. "Princess of the Pig Kingdom" theme.',
              },
            ],
          },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            setCharacterImage(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      } catch (error) {
        console.error("Error generating character image:", error);
        // Fallback to a relevant placeholder if generation fails
        setCharacterImage("https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?auto=format&fit=crop&q=80&w=1000");
      } finally {
        setIsGenerating(false);
      }
    };

    generateCharacter();
  }, []);

  const currentScene = SCENES[currentSceneId];

  const handleChoice = (choice: Choice) => {
    setLovePoints(prev => prev + choice.points);
    setHistory(prev => [...prev, choice.text]);
    
    // Check for final ending based on points if it's the last choice
    if (choice.nextScene === 'ending_good' && lovePoints + choice.points < 20) {
      setCurrentSceneId('ending_bad');
    } else {
      setCurrentSceneId(choice.nextScene);
    }
  };

  const resetGame = () => {
    setCurrentSceneId('intro');
    setLovePoints(0);
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-[#fdfaf6] text-[#2d2d2d] font-serif overflow-hidden flex flex-col">
      {/* Header / Status */}
      <header className="p-6 flex justify-between items-center border-b border-[#e5e0d8] bg-white/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <Crown className="text-[#d4af37] w-6 h-6" />
          <h1 className="text-xl font-bold tracking-widest uppercase">Princess of Swine</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-pink-50 px-4 py-1.5 rounded-full border border-pink-100">
            <Heart className={`w-4 h-4 ${lovePoints > 0 ? 'text-pink-500 fill-pink-500' : 'text-gray-300'}`} />
            <span className="text-sm font-bold font-sans">{lovePoints}</span>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 relative flex flex-col md:flex-row items-center justify-center p-4 md:p-12 gap-8">
        {/* Character Visual */}
        <div className="relative w-full max-w-md aspect-[3/4] md:h-[70vh] rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white group bg-[#f0e6d2] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <Loader2 className="w-12 h-12 animate-spin text-[#d4af37]" />
                <p className="text-sm font-sans text-[#d4af37] animate-pulse">王女様をお呼びしています...</p>
              </motion.div>
            ) : (
              <motion.img
                key={currentSceneId}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8 }}
                src={characterImage || ""}
                alt="Princess"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          
          {/* Floating Accents */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute top-8 right-8 bg-white/90 p-3 rounded-full shadow-lg"
          >
            <Sparkles className="text-[#d4af37] w-5 h-5" />
          </motion.div>
        </div>

        {/* Dialogue Box */}
        <div className="w-full max-w-xl flex flex-col gap-6">
          <motion.div 
            key={currentSceneId + "_text"}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-[#e5e0d8] relative"
          >
            <div className="absolute -top-4 left-10 bg-[#d4af37] text-white px-6 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
              シャルロット王女
            </div>
            <p className="text-lg md:text-xl leading-relaxed italic text-[#4a4a4a]">
              {currentScene.text}
            </p>
          </motion.div>

          {/* Choices */}
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="wait">
              {currentScene.choices.length > 0 ? (
                currentScene.choices.map((choice, idx) => (
                  <motion.button
                    key={choice.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleChoice(choice)}
                    className="group flex items-center justify-between w-full p-5 bg-white hover:bg-[#2d2d2d] hover:text-white border border-[#e5e0d8] rounded-2xl transition-all duration-300 text-left shadow-sm hover:shadow-lg"
                  >
                    <span className="font-medium">{choice.text}</span>
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                ))
              ) : (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={resetGame}
                  className="flex items-center justify-center gap-3 w-full p-5 bg-[#2d2d2d] text-white rounded-2xl hover:bg-black transition-all shadow-lg"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>もう一度最初から</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="p-6 flex justify-between items-center opacity-40 text-[10px] uppercase tracking-[0.2em] font-sans">
        <div className="flex items-center gap-2">
          <Info className="w-3 h-3" />
          <span>Pig Kingdom Embassy | Diplomatic Mission</span>
        </div>
        <div>© 2026 Swine Royal Family</div>
      </footer>

      {/* Background Decoration */}
      <div className="fixed -bottom-20 -left-20 w-80 h-80 bg-pink-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -top-20 -right-20 w-80 h-80 bg-yellow-100/30 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
