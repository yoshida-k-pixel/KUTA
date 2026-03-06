import { useEffect, useState } from 'react';
import { analyzeSloRepo, StoreAnalysis } from './services/geminiService';
import { Search, TrendingUp, ShieldCheck, Info, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [data, setData] = useState<StoreAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeSloRepo();
      if (result && result.length > 0) {
        setData(result);
      } else {
        setError("データが見つかりませんでした。しばらくしてからもう一度お試しください。");
      }
    } catch (err) {
      setError("データの取得中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-12 border-b-4 border-black pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">
            SloRepo <span className="italic font-serif font-light text-3xl lowercase">Analysis</span>
          </h1>
          <p className="text-sm opacity-60 font-mono uppercase tracking-widest">
            Real-time store trends & machine characteristics
          </p>
        </div>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
          <span className="font-mono text-xs font-bold uppercase">Refresh Data</span>
        </button>
      </header>

      <main>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-12 h-12 animate-spin" />
            <p className="font-mono text-sm animate-pulse">Analyzing SloRepo data via Gemini Search...</p>
          </div>
        ) : error ? (
          <div className="border-2 border-red-500 p-8 bg-red-50 text-red-900 font-mono">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Info className="w-5 h-5" /> ERROR_LOG
            </h2>
            <p>{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[2fr_3fr_2fr_3fr] gap-4 mb-4 px-4">
              <div className="col-header">店舗名 / Store Name</div>
              <div className="col-header">特徴 / Characteristics</div>
              <div className="col-header">推奨機種 / Recommended</div>
              <div className="col-header">傾向と対策 / Trends & Strategy</div>
            </div>

            <AnimatePresence>
              {data.map((store, idx) => (
                <motion.div
                  key={store.storeName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="data-row group"
                >
                  <div className="pr-4">
                    <div className="font-bold text-lg mb-1">{store.storeName}</div>
                    <div className="flex gap-1">
                      <ShieldCheck className="w-3 h-3 opacity-30" />
                      <TrendingUp className="w-3 h-3 opacity-30" />
                    </div>
                  </div>

                  <div className="pr-4">
                    <ul className="list-none p-0">
                      {store.characteristics.map((char, i) => (
                        <li key={i} className="data-value mb-1 flex items-start gap-2">
                          <span className="opacity-30">/</span> {char}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pr-4">
                    <div className="flex flex-wrap gap-2">
                      {store.recommendedMachines.map((machine, i) => (
                        <span key={i} className="bg-black/5 px-2 py-1 text-[10px] font-mono uppercase border border-black/10">
                          {machine}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="data-value opacity-80 leading-relaxed">
                    {store.trends}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <footer className="mt-24 pt-8 border-t border-black/20 flex flex-col md:flex-row justify-between gap-4">
        <div className="font-mono text-[10px] opacity-40 uppercase tracking-widest">
          Data source: slorepo.com | Analysis by Gemini 3.1 Pro
        </div>
        <div className="flex gap-6 font-mono text-[10px] opacity-40 uppercase tracking-widest">
          <span>Status: Operational</span>
          <span>Region: Japan / Kanto / Kansai</span>
        </div>
      </footer>
    </div>
  );
}
