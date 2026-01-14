
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import HologramRenderer from './HologramRenderer';
import { SimulationState, SimulationParams, SourceType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const Dashboard: React.FC = () => {
  const [state, setState] = useState<SimulationState>(SimulationState.IDLE);
  const [params, setParams] = useState<SimulationParams>({
    concept: '',
    variance: 50,
    mode: 'SINGLE',
    sourceType: 'TEXT'
  });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Camera access is required for live conceptual capture.");
    }
  };

  const captureFrame = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg');
      setParams(p => ({ ...p, mediaData: base64 }));
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setParams(p => ({ 
          ...p, 
          mediaData: event.target?.result as string,
          fileName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInitialize = async () => {
    if (params.sourceType === 'TEXT' && !params.concept.trim()) return;
    if (params.sourceType !== 'TEXT' && !params.mediaData && !params.concept) return;

    setState(SimulationState.LOADING);
    try {
      let finalPrompt = params.concept;

      // Stage 1: Analyze multimodal input if necessary to derive the "concept"
      if (params.sourceType !== 'TEXT' && params.mediaData) {
        const parts: any[] = [{ text: `Analyze this ${params.sourceType} and extract the core scientific concept or mechanical design. Describe its inner workings in detail for a technical blueprint.` }];
        
        if (params.mediaData.startsWith('data:image')) {
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: params.mediaData.split(',')[1]
            }
          });
        } else if (params.mediaData.startsWith('data:application/pdf')) {
           // PDF handling would usually require document processing, for now we treat it as text if possible or assume user provided text context
           parts[0].text += " Context provided in PDF format.";
        }

        const analysisResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: { parts },
        });
        finalPrompt = analysisResponse.text || params.concept;
      }

      // Stage 2: Generate the Hologram Image
      const blueprintPrompt = `Hyper-detailed technical 3D blueprint hologram of: ${finalPrompt}. 
      Style: Luminous cyan wireframes, exploded view showing internal components, floating data annotations, 
      mechanical complexity, pitch black background, 4k digital blueprint aesthetic, geometric precision. 
      Scientific and futuristic look.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: blueprintPrompt }] },
      });

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
        throw new Error("Ontological manifold failed to synchronize.");
      }
    } catch (err) {
      console.error("Initialization Error:", err);
      alert("Synthesis Failure: Signal Interrupted.");
      setState(SimulationState.IDLE);
    }
  };

  if (state === SimulationState.ACTIVE && generatedImage) {
    return (
      <HologramRenderer 
        imageUrl={generatedImage} 
        conceptTitle={params.concept || "Synthesized Entity"} 
        onLeave={() => {
          setState(SimulationState.IDLE);
          setGeneratedImage(null);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center selection:bg-blue-600/30">
      <div className="w-full max-w-4xl px-4 md:px-8 py-12 md:py-20 space-y-12 md:space-y-20">
        
        <header className="text-center space-y-6">
          <div className="inline-block px-4 py-1.5 rounded-full border border-blue-600/20 bg-blue-600/5 text-[10px] font-black text-blue-500 tracking-[0.3em] uppercase">
            Theory Extraction Laboratory
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
            TheoryVerse
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto font-medium">
            Ingest data from any source—text, images, files, or live camera—to synthesize interactive 3D holographic manifolds.
          </p>
        </header>

        <main className="space-y-16">
          {/* Source Input Card */}
          <section className="space-y-8">
            <div className="flex items-center justify-between px-4">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Ontological Sources</h3>
               <div className="flex space-x-2">
                 {(['TEXT', 'IMAGE', 'CAMERA', 'URL', 'FILE'] as SourceType[]).map(type => (
                   <button 
                     key={type}
                     onClick={() => {
                       setParams(p => ({ ...p, sourceType: type, mediaData: undefined }));
                       if (type !== 'CAMERA') stopCamera();
                     }}
                     className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all border ${
                       params.sourceType === type 
                       ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                       : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                     }`}
                   >
                     {type}
                   </button>
                 ))}
               </div>
            </div>
            
            <div className="bg-[#0a0f1e] border border-slate-800/60 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
              {params.sourceType === 'TEXT' && (
                <textarea
                  value={params.concept}
                  onChange={(e) => setParams({ ...params, concept: e.target.value })}
                  placeholder="Input the core theoretical text..."
                  className="w-full bg-transparent border-none outline-none resize-none text-slate-300 placeholder-slate-800 text-lg md:text-2xl font-medium leading-relaxed min-h-[200px]"
                />
              )}

              {params.sourceType === 'IMAGE' && (
                <div className="flex flex-col items-center justify-center min-h-[240px] border-2 border-dashed border-slate-800 rounded-3xl p-8 transition-colors hover:border-blue-900/40">
                  {params.mediaData ? (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-700">
                      <img src={params.mediaData} className="w-full h-full object-cover" alt="Source" />
                      <button onClick={() => setParams(p => ({...p, mediaData: undefined}))} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg"><i className="fas fa-times"></i></button>
                    </div>
                  ) : (
                    <div className="text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <i className="fas fa-image text-4xl text-slate-700 mb-4"></i>
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Upload Concept Imagery</p>
                      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                    </div>
                  )}
                </div>
              )}

              {params.sourceType === 'CAMERA' && (
                <div className="flex flex-col items-center justify-center min-h-[300px] bg-black rounded-3xl relative overflow-hidden border border-slate-800">
                  {!isCameraActive && !params.mediaData && (
                    <button onClick={startCamera} className="flex flex-col items-center group">
                      <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-xl shadow-blue-600/20">
                        <i className="fas fa-video"></i>
                      </div>
                      <span className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Establish Video Link</span>
                    </button>
                  )}
                  {isCameraActive && (
                    <>
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-4">
                        <button onClick={captureFrame} className="px-8 py-3 bg-white text-slate-950 rounded-full font-black text-[10px] uppercase tracking-widest">Capture Specimen</button>
                        <button onClick={stopCamera} className="px-4 py-3 bg-slate-900 text-slate-400 rounded-full font-black text-[10px] uppercase tracking-widest"><i className="fas fa-times"></i></button>
                      </div>
                    </>
                  )}
                  {params.mediaData && !isCameraActive && (
                    <div className="relative w-full h-full">
                       <img src={params.mediaData} className="w-full h-full object-cover" alt="Captured" />
                       <button onClick={() => setParams(p => ({...p, mediaData: undefined}))} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full"><i className="fas fa-times"></i></button>
                       <button onClick={startCamera} className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Retake</button>
                    </div>
                  )}
                </div>
              )}

              {params.sourceType === 'URL' && (
                <div className="flex flex-col items-center justify-center min-h-[200px] space-y-8">
                  <div className="w-full space-y-4">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">Knowledge Link (URL)</label>
                    <input 
                      type="url" 
                      placeholder="https://scientific-portal.org/paper-v2..."
                      className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-4 text-slate-300 focus:border-blue-500/50 outline-none transition-all"
                      onChange={(e) => setParams(p => ({ ...p, mediaData: e.target.value }))}
                    />
                  </div>
                  <p className="text-[9px] text-slate-700 font-mono text-center max-w-xs leading-relaxed">System will crawl the endpoint and derive structural ontological markers.</p>
                </div>
              )}

              {params.sourceType === 'FILE' && (
                <div className="flex flex-col items-center justify-center min-h-[240px] border-2 border-dashed border-slate-800 rounded-3xl p-8 transition-colors hover:border-blue-900/40">
                  {params.mediaData ? (
                    <div className="flex flex-col items-center">
                       <i className="fas fa-file-pdf text-5xl text-red-500 mb-4"></i>
                       <p className="text-slate-300 font-bold mb-1">{params.fileName}</p>
                       <p className="text-[9px] text-slate-600 uppercase tracking-widest">Document Ingested</p>
                       <button onClick={() => setParams(p => ({...p, mediaData: undefined, fileName: undefined}))} className="mt-6 text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline">Discard</button>
                    </div>
                  ) : (
                    <div className="text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <i className="fas fa-file-upload text-4xl text-slate-700 mb-4"></i>
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Ingest PDF / Archive</p>
                      <input type="file" ref={fileInputRef} hidden accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Simulation Parameters */}
          <section className="bg-[#0a0f1e] border border-slate-800/60 rounded-[2.5rem] p-8 md:p-14 shadow-2xl space-y-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Simulation Mode</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {['SINGLE', 'COMPARE', 'COLLISION', 'MERGE'].map(mode => (
                      <button 
                        key={mode}
                        onClick={() => setParams(p => ({ ...p, mode: mode as any }))}
                        className={`py-4 rounded-xl text-[9px] font-black tracking-widest uppercase border transition-all ${
                          params.mode === mode 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/20' 
                          : 'bg-[#020617] border-slate-800 text-slate-600'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Ontological Variance</h4>
                    <span className="text-blue-500 text-xs font-black">{params.variance}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={params.variance} 
                    onChange={e => setParams(p => ({ ...p, variance: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-800 rounded-full appearance-none accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] font-black text-slate-800 uppercase tracking-widest">
                    <span>Literal</span>
                    <span>Conceptual</span>
                  </div>
               </div>
            </div>

            <button
              onClick={handleInitialize}
              disabled={state === SimulationState.LOADING || (params.sourceType === 'TEXT' && !params.concept.trim())}
              className={`w-full py-10 rounded-[2rem] font-black text-sm uppercase tracking-[0.8em] transition-all flex items-center justify-center shadow-2xl relative overflow-hidden group ${
                state === SimulationState.LOADING 
                ? 'bg-slate-800 text-slate-600'
                : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              {state === SimulationState.LOADING ? (
                <span className="flex items-center space-x-4">
                  <i className="fas fa-sync animate-spin"></i>
                  <span>Synchronizing Manifold...</span>
                </span>
              ) : 'Initialize Universe'}
            </button>
          </section>
        </main>

        <footer className="text-center pt-12 pb-8 opacity-20 hover:opacity-100 transition-opacity">
           <p className="text-[9px] font-mono uppercase tracking-[0.5em]">&copy; 2025 TheoryVerse // Multimodal Synthesis v5.1.0</p>
        </footer>
      </div>

      {state === SimulationState.LOADING && (
        <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center z-[500] backdrop-blur-md">
          <div className="relative w-32 h-32 mb-12">
            <div className="absolute inset-0 border-[3px] border-blue-900/10 rounded-full"></div>
            <div className="absolute inset-0 border-t-[3px] border-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-atom text-blue-500 text-2xl animate-pulse"></i>
            </div>
          </div>
          <div className="text-center space-y-3">
             <h2 className="text-blue-500 font-black text-xs uppercase tracking-[0.6em] animate-pulse">Crystallizing Ontology</h2>
             <p className="text-slate-600 text-[10px] font-mono uppercase tracking-widest">Stage 1/2: Multimodal Context Extraction</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
