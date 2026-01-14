
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { hologramPipeline } from '../services/hologramPipeline';

interface HologramRendererProps {
  imageUrl: string;
  conceptTitle: string;
  onLeave: () => void;
}

const HologramRenderer: React.FC<HologramRendererProps> = ({ imageUrl, conceptTitle, onLeave }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    material: THREE.ShaderMaterial;
    controls: OrbitControls;
    plane: THREE.Mesh;
    animationId: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.5; // Allow flying into the hologram
    controls.maxDistance = 15;
    
    const isPortrait = height > width;
    camera.position.set(0, 0, isPortrait ? 6 : 3.5);
    controls.update();

    const vertexShader = `
      varying vec2 vUv;
      varying float vDepth;
      uniform sampler2D uDepthMap;
      uniform float uDisplacement;
      uniform float uTime;

      void main() {
        vUv = uv;
        vec4 depthSample = texture2D(uDepthMap, uv);
        float depth = depthSample.r;
        vDepth = depth;
        vec3 pos = position;
        
        // Dynamic displacement creates the 3D 'layering' effect
        pos.z += depth * uDisplacement;
        
        // Subtle rhythmic pulse representing data flow
        float pulse = sin(uTime * 1.5 + depth * 10.0) * 0.015 * depth;
        pos.z += pulse;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec2 vUv;
      varying float vDepth;
      uniform sampler2D uTexture;
      uniform float uTime;
      
      void main() {
        vec4 texColor = texture2D(uTexture, vUv);
        
        // Technical hologram color palette
        vec3 baseCyan = vec3(0.0, 0.8, 1.0);
        vec3 glowBlue = vec3(0.1, 0.3, 1.0);
        
        // Boost brightness based on depth to highlight "inner structures"
        vec3 finalColor = texColor.rgb * baseCyan * (1.8 + vDepth * 1.5);
        
        // Procedural scanlines
        float scanline = sin(vUv.y * 800.0 - uTime * 20.0) * 0.08;
        finalColor += scanline;
        
        // Digital glitch/flicker
        float flicker = 0.97 + 0.03 * sin(uTime * 100.0);
        if (sin(uTime * 5.0) > 0.99) flicker = 0.5; // Occasional data dropout
        finalColor *= flicker;

        // Soft vignetting/edge fade for containerized look
        float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x) *
                     smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);

        // Additive glow factor
        float glow = pow(vDepth, 2.0) * 0.4;
        finalColor += glow * glowBlue;

        gl_FragColor = vec4(finalColor, texColor.a * 0.98 * edge);
        
        // Discard low-luminous pixels for transparency
        if(length(gl_FragColor.rgb) < 0.15) discard;
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: new THREE.Texture() },
        uDepthMap: { value: new THREE.Texture() },
        uDisplacement: { value: 1.2 }, // Higher displacement for better depth
        uTime: { value: 0 }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    const planeWidth = isPortrait ? 4 : 5;
    const planeHeight = planeWidth * 0.75;
    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 320, 240); // Higher vertex count for smoother depth
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (sceneRef.current) {
        sceneRef.current.material.uniforms.uTime.value += 0.016;
        sceneRef.current.controls.update();
        sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
      }
    };
    animate();

    sceneRef.current = { scene, camera, renderer, material, controls, plane, animationId };

    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      sceneRef.current.camera.aspect = w / h;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    hologramPipeline.loadHologram(imageUrl).then(({ originalTexture, depthTexture }) => {
      if (sceneRef.current) {
        sceneRef.current.material.uniforms.uTexture.value = originalTexture;
        sceneRef.current.material.uniforms.uDepthMap.value = depthTexture;
        setIsLoading(false);
      }
    }).catch(err => {
      console.error("Hologram failed to initialize:", err);
      setIsLoading(false);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
    };
  }, [imageUrl]);

  return (
    <div className="fixed inset-0 w-full h-full bg-[#020617] overflow-hidden z-[200]">
      <div ref={containerRef} className="w-full h-full touch-none" />
      
      {/* Simulation UI Overlays */}
      <div className="absolute top-6 md:top-10 left-6 md:right-10 md:left-auto flex flex-col items-start md:items-end space-y-4 max-w-[90%]">
        <button 
          onClick={onLeave}
          className="px-6 py-4 bg-[#0a0f1e]/90 backdrop-blur-xl border border-slate-800/80 rounded-[1.5rem] flex items-center space-x-3 text-slate-300 hover:text-white hover:border-blue-500/30 transition-all group shadow-2xl"
        >
          <i className="fas fa-power-off text-[10px] text-blue-500 group-hover:scale-110 transition-transform"></i>
          <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em]">Terminate Simulation</span>
        </button>
        
        <div className="bg-[#0a0f1e]/90 backdrop-blur-xl border border-slate-800/80 rounded-[1.5rem] p-6 md:p-8 min-w-0 sm:min-w-[320px] shadow-2xl">
          <div className="text-[9px] md:text-[10px] font-black text-blue-500/60 uppercase tracking-[0.4em] mb-3">Target Manifold</div>
          <h2 className="text-xl md:text-3xl font-black text-white leading-tight uppercase mb-2 truncate">{conceptTitle}</h2>
          <div className="flex items-center space-x-3 mt-4">
             <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
             <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Theoretical Observer v4.0.2</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 md:bottom-16 left-1/2 -translate-x-1/2 w-full max-w-xl md:max-w-3xl px-6">
        <div className="bg-[#0a0f1e]/70 backdrop-blur-2xl border border-slate-800/50 rounded-[2rem] md:rounded-[3rem] py-8 md:py-10 px-10 md:px-16 flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 shadow-2xl">
          <div className="flex items-center space-x-6">
             <div className="relative">
                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-ping absolute inset-0 opacity-40"></div>
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full relative shadow-[0_0_15px_#3b82f6]"></div>
             </div>
             <span className="text-[10px] md:text-[12px] font-black text-blue-400 uppercase tracking-[0.4em]">Holographic Manifold Synchronized</span>
          </div>
          <div className="flex items-center space-x-8 text-slate-500">
             <div className="flex flex-col items-center space-y-1">
                <i className="fas fa-arrows-to-circle text-[10px]"></i>
                <span className="text-[8px] font-bold uppercase tracking-tighter">Pan</span>
             </div>
             <div className="flex flex-col items-center space-y-1">
                <i className="fas fa-magnifying-glass-plus text-[10px]"></i>
                <span className="text-[8px] font-bold uppercase tracking-tighter">Zoom</span>
             </div>
             <div className="flex flex-col items-center space-y-1">
                <i className="fas fa-rotate text-[10px]"></i>
                <span className="text-[8px] font-bold uppercase tracking-tighter">Orbit</span>
             </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-[#020617] flex flex-col items-center justify-center z-[250]">
          <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
            <div className="absolute inset-0 border-[4px] border-blue-900/10 rounded-full"></div>
            <div className="absolute inset-0 border-t-[4px] border-blue-500 rounded-full animate-spin"></div>
            <i className="fas fa-atom text-blue-500 text-3xl animate-pulse"></i>
          </div>
          <h3 className="text-blue-500 font-black text-xs md:text-sm uppercase tracking-[0.6em] animate-pulse">Initializing 3D Buffer</h3>
        </div>
      )}
    </div>
  );
};

export default HologramRenderer;
