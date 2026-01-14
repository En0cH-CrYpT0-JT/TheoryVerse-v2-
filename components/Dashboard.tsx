
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import HologramRenderer from './HologramRenderer';
import { SimulationState, SimulationParams } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const Dashboard: React.FC = () => {
  const [state, setState] = useState<SimulationState>(SimulationState.IDLE);
  const [params, setParams] = useState<SimulationParams>({
    concept: '',
    variance: 50,
    mode: 'SINGLE'
  });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleInitialize = async () => {
    if (!params.concept.trim()) return;

    setState(SimulationState.LOADING);
    try {
      // Prompt specifically tuned for a technical blueprint "inner workings" look
      const prompt = `Extreme detail technical blueprint hologram of "${params.concept}" internal structure. 
      Visual elements: Exploded view, complex mechanisms, glowing cyan wireframes, floating UI annotations, 
      deep perspective lines, electric blue highlights on a pure black background. 
      Cinematic holographic projection, 4k digital art style. No human figures or realistic textures. 
      Only luminous geometric and mechanical data structures.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
      });

      if (!response || !response.candidates?.[0]?.content?.parts) {
        throw new Error("Ontological manifold failed to synchronize.");
      }

      let base64 = '';
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64 = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (base64) {
        setGeneratedImage(base64);
        setState(SimulationState.ACTIVE);
      } else {
        throw new Error("Could not crystallize data manifold.");
      }
    } catch (err) {
      console.error("Initialization Error:", err);
      alert(err instanceof Error ? err.message : "Uplink failure.");
      setState(SimulationState.IDLE);
    }
  };

  if (state === SimulationState.ACTIVE && generatedImage) {
    return (
      <HologramRenderer 
        imageUrl={generatedImage} 
        conceptTitle={params.concept} 
        onLeave={() => {
          setState(SimulationState.IDLE);
          setGeneratedImage(null);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center selection:bg-blue-600/30">
      <div className="w-full max-w-4xl px-4 md:px-8 py-12 md:py-24 space-y-16 md:space-y-24">
        
        {/* Header Section */}
        <header className="text-center space-y-8 md:space-y-12">
          <div className="inline-block px-4 py-2 rounded-full border border-blue-600/20 bg-blue-600/5 text-[10px] md:text-[11px] font-black text-blue-500 tracking-[0.3em] uppercase">
            Theory Extraction Laboratory
          </div>
          <div className="space-y-4 md:space-y-6">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              TheoryVerse
            </h1>
            <p className="text-slate-500 text-sm md:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto font-medium px-4">
              Synthesize immersive ontological universes from complex scientific papers and abstract theories. 
              Uncover the hidden structure of knowledge through 3D manifolds.
            </p>
          </div>
        </header>

        {/* Main Interface */}
        <main className="space-y-12 md:space-y-20">
          
          {/* Input Section */}
          <section className="space-y-6 md:space-y-8">
            <div className="flex items-center justify-between px-4">
               <h3 className="text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Ontological Sources</h3>
               <button className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] px-4 md:px-6 py-2 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors">+ Add Source</button>
            </div>
            
            <div className="bg-[#0a0f1e] border border-slate-800/60 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group hover:border-blue-900/40 transition-colors">
              <div className="mb-8">
                <div className="bg-[#020617] border border-blue-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between w-40 md:w-48">
                  <span className="text-[9px] md:text-[10px] font-black text-blue-400 uppercase tracking-widest">Text Context</span>
                  <i className="fas fa-chevron-down text-[8px] text-blue-500"></i>
                </div>
              </div>
              
              <textarea
                value={params.concept}
                onChange={(e) => setParams({ ...params, concept: e.target.value })}
                placeholder="Input the core theoretical text or abstract framework..."
                className="w-full bg-transparent border-none outline-none resize-none text-slate-300 placeholder-slate-800 text-lg md:text-2xl font-medium leading-relaxed min-h-[160px] md:min-h-[220px]"
              />
            </div>
          </section>

          {/* Simulation Controls */}
          <section className="space-y-10 md:space-y-12">
            <h3 className="text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] px-4">World Simulation</h3>
            <div className="bg-[#0a0f1e] border border-slate-800/60 rounded-[2.5rem] p-8 md:p-14 shadow-2xl space-y-16 md:space-y-24">
              
              <div className="space-y-10">
                <h4 className="text-[9px] md:text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] px-2">Initialization Mode</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  {['SINGLE WORLD', 'COMPARE', 'COLLISION', 'MERGE'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setParams({ ...params, mode: mode.split(' ')[0] as any })}
                      className={`py-6 md:py-10 rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] border transition-all duration-500 ${
                        params.mode === mode.split(' ')[0]
                        ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_50px_rgba(37,99,235,0.25)]'
                        : 'bg-[#020617]/40 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-12">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[9px] md:text-[11px] font-black text-slate-600 uppercase tracking-[0.3em]">Ontological Variance</h4>
                  <div className="px-4 py-1.5 bg-blue-600/10 border border-blue-600/30 rounded-lg text-blue-500 text-[10px] font-black">{params.variance}%</div>
                </div>
                <div className="px-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={params.variance}
                    onChange={(e) => setParams({ ...params, variance: parseInt(e.target.value) })}
                    className="w-full h-1.5 md:h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between mt-6 md:mt-8">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Literal Depth</span>
                    <span className="text-[8px] md:text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Conceptual Reach</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleInitialize}
                  disabled={state === SimulationState.LOADING || !params.concept.trim()}
                  className={`w-full py-8 md:py-14 rounded-[2rem] md:rounded-[3rem] font-black text-sm md:text-base uppercase tracking-[0.5em] md:tracking-[0.8em] transition-all flex items-center justify-center shadow-2xl relative overflow-hidden group ${
                    state === SimulationState.LOADING 
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                    : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-[1.01] active:scale-[0.99] shadow-blue-600/20'
                  }`}
                >
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  {state === SimulationState.LOADING ? (
                    <span className="flex items-center space-x-4">
                      <i className="fas fa-circle-notch animate-spin"></i>
                      <span>Synthesizing Universe...</span>
                    </span>
                  ) : 'Initialize Universe'}
                </button>
              </div>

              <div className="text-center">
                <span className="text-[9px] md:text-[10px] font-black text-slate-800 uppercase tracking-[0.4em]">Engine: Gemini 3 Flash & Pro Synthesis v4</span>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="pt-12 pb-8 text-center">
           <p className="text-slate-800 font-mono text-[9px] uppercase tracking-widest">&copy; 2025 TheoryVerse Protocol // All Rights Reserved</p>
        </footer>
      </div>

      {/* Loading Overlay */}
      {state === SimulationState.LOADING && (
        <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center z-[100] px-8 backdrop-blur-sm">
          <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
            <div className="absolute inset-0 border-[3px] border-blue-900/20 rounded-full"></div>
            <div className="absolute inset-0 border-t-[3px] border-blue-500 rounded-full animate-spin"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
          </div>
          <div className="text-center space-y-4">
            <h3 className="text-blue-500 font-black text-xs md:text-sm uppercase tracking-[0.5em] animate-pulse">Synthesizing Local Physics</h3>
            <p className="text-slate-600 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.2em] max-w-[240px] leading-relaxed mx-auto">
              Mapping conceptual nodes to topological manifold coordinates...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
