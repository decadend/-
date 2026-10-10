import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Wifi, Plus, Minus, RotateCcw, SatelliteDish, Trash2, Rocket, RefreshCw, FolderOpen } from 'lucide-react';
import { calculateAzimuth, calculateElevation } from '../utils/geometry';
import { Dish, Satellite } from '../types';

// 声明全局变量以支持 Leaflet 和 Omnivore
declare global {
  interface Window {
    L: any;
    omnivore: any;
  }
}

// === 卫星视觉组件 ===
// === MEMOIZED VISUALS ===

const SatelliteVisual = React.memo(({ color }: { color?: string }) => (
    <div className="relative group cursor-grab active:cursor-grabbing w-20 h-10 flex items-center justify-center">
        <div className={`absolute -inset-4 bg-white/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
        <div className="relative transition-transform duration-200 group-hover:scale-110">
            <svg width="80" height="40" viewBox="0 0 80 40" className="drop-shadow-xl filter saturate-150">
                <rect x="0" y="10" width="30" height="20" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="10" y1="10" x2="10" y2="30" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.3" />
                <line x1="20" y1="10" x2="20" y2="30" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.3" />
                <rect x="50" y="10" width="30" height="20" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="60" y1="10" x2="60" y2="30" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.3" />
                <line x1="70" y1="10" x2="70" y2="30" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.3" />
                {/* Body Color changes based on ID/Prop */}
                <rect x="32" y="8" width="16" height="24" rx="2" fill={color || "#f59e0b"} stroke="#b45309" strokeWidth="1" />
                <circle cx="40" cy="20" r="4" fill="#fff" stroke="#64748b" strokeWidth="1" />
            </svg>
        </div>
    </div>
));

const DishVisual = React.memo(({ id, isActive }: { id: string, isActive: boolean }) => (
    <div className="relative w-40 h-40 group cursor-grab active:cursor-grabbing flex items-center justify-center select-none" style={{ perspective: '1500px' }}>
         
         {/* Interaction Zone */}
         <div className={`absolute inset-0 rounded-full transition-all duration-300 pointer-events-none ${isActive ? 'bg-blue-500/5' : 'bg-transparent group-hover:bg-blue-500/5'}`} />

         {/* === 1. STATIC BASE === */}
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
            {/* Ground Shadow */}
            <div className="absolute w-36 h-6 bg-black/20 rounded-full blur-md" style={{ transform: 'translateZ(-5px) rotateX(90deg) translateY(70px)' }}></div>
            
            {/* Tripod - Enhanced 3D with individual legs */}
            <div className="absolute w-full h-full flex items-center justify-center" style={{ transform: 'translateZ(1px)', transformStyle: 'preserve-3d' }}>
                 {/* Leg 1 - Front */}
                 <div className="absolute w-32 h-5" style={{ transformStyle: 'preserve-3d' }}>
                     <div className="absolute inset-0 bg-gradient-to-r from-slate-500 via-slate-600 to-slate-500 rounded-full shadow-[0_3px_10px_rgba(0,0,0,0.5)] border-t-2 border-slate-400"></div>
                     <div className="absolute inset-x-4 inset-y-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></div>
                     <div className="absolute left-2 top-1 w-2 h-2 bg-slate-700 rounded-full border border-slate-500 shadow-inner"></div>
                     <div className="absolute right-2 top-1 w-2 h-2 bg-slate-700 rounded-full border border-slate-500 shadow-inner"></div>
                 </div>
                 {/* Leg 2 - Right */}
                 <div className="absolute w-32 h-5 rotate-120" style={{ transformStyle: 'preserve-3d' }}>
                     <div className="absolute inset-0 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 rounded-full shadow-[0_3px_10px_rgba(0,0,0,0.5)] border-t-2 border-slate-500"></div>
                     <div className="absolute inset-x-4 inset-y-1 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full"></div>
                 </div>
                 {/* Leg 3 - Left */}
                 <div className="absolute w-32 h-5 -rotate-120" style={{ transformStyle: 'preserve-3d' }}>
                     <div className="absolute inset-0 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 rounded-full shadow-[0_3px_10px_rgba(0,0,0,0.5)] border-t-2 border-slate-500"></div>
                     <div className="absolute inset-x-4 inset-y-1 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full"></div>
                 </div>
            </div>
            
            {/* Central Pole - Multi-segment with realistic metal finish */}
            <div className="absolute w-12 h-12 rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.6)]" style={{ transform: 'translateZ(4px)', transformStyle: 'preserve-3d' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 rounded-full border-2 border-slate-600"></div>
                <div className="absolute inset-1 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-full"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-full"></div>
            </div>
            
            <div className="absolute w-10 h-10 rounded-full" style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 rounded-full shadow-lg"></div>
                <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-transparent to-white/30 rounded-full"></div>
                <div className="absolute top-1 left-1 w-2 h-2 bg-white/40 rounded-full blur-sm"></div>
            </div>
            
            <div className="absolute w-8 h-8 rounded-full border-2 border-slate-400 shadow-xl" style={{ transform: 'translateZ(40px)', transformStyle: 'preserve-3d' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 rounded-full"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/40 rounded-full"></div>
                <div className="absolute inset-2 bg-gradient-to-br from-slate-500 to-slate-700 rounded-full shadow-inner"></div>
            </div>
         </div>

         {/* === 2. AZIMUTH ROTATION (Z-Axis) === */}
         <div 
            id={`dish-azimuth-${id}`} 
            className="absolute inset-0 flex items-center justify-center will-change-transform" 
            style={{ transformStyle: 'preserve-3d', transition: 'transform 0.1s linear' }}
         >
            {/* Yoke Bracket - Enhanced 3D mount */}
            <div className="absolute w-24 h-20" style={{ transform: 'translateZ(40px)', transformStyle: 'preserve-3d' }}>
                {/* Main horizontal bar */}
                <div className="absolute left-0 right-0 top-1/2 h-7 -mt-3.5 rounded-lg border-2 border-slate-400 shadow-[0_4px_12px_rgba(0,0,0,0.4)]" style={{ transformStyle: 'preserve-3d' }}>
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-400 via-slate-500 to-slate-600 rounded-lg"></div>
                    <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-white/30 to-transparent rounded-t-lg"></div>
                    <div className="absolute left-2 top-1/2 -mt-1.5 w-3 h-3 bg-slate-700 rounded-full border border-slate-500 shadow-inner"></div>
                    <div className="absolute right-2 top-1/2 -mt-1.5 w-3 h-3 bg-slate-700 rounded-full border border-slate-500 shadow-inner"></div>
                </div>
                
                {/* Left support arm */}
                <div className="absolute left-2 bottom-2 h-24 w-4 origin-bottom shadow-[0_3px_10px_rgba(0,0,0,0.5)]" style={{ transform: 'rotateX(-12deg)', transformStyle: 'preserve-3d' }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600 rounded-full"></div>
                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-white/40 to-transparent rounded-l-full"></div>
                    <div className="absolute top-2 left-1/2 -ml-1 w-2 h-2 bg-slate-700 rounded-full border border-slate-500 shadow-inner"></div>
                    <div className="absolute bottom-3 left-1/2 -ml-1 w-2 h-2 bg-slate-700 rounded-full border border-slate-500 shadow-inner"></div>
                </div>
                
                {/* Right support arm */}
                <div className="absolute right-2 bottom-2 h-24 w-4 origin-bottom shadow-[0_3px_10px_rgba(0,0,0,0.5)]" style={{ transform: 'rotateX(-12deg)', transformStyle: 'preserve-3d' }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-400 rounded-full"></div>
                    <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-white/40 to-transparent rounded-r-full"></div>
                    <div className="absolute top-2 left-1/2 -ml-1 w-2 h-2 bg-slate-700 rounded-full border border-slate-500 shadow-inner"></div>
                    <div className="absolute bottom-3 left-1/2 -ml-1 w-2 h-2 bg-slate-700 rounded-full border border-slate-500 shadow-inner"></div>
                </div>
            </div>

            {/* === 3. ELEVATION ROTATION (X-Axis) === */}
            <div 
                id={`dish-elevation-${id}`}
                className="absolute inset-0 flex items-center justify-center will-change-transform"
                style={{ transformStyle: 'preserve-3d', transition: 'transform 0.1s linear' }}
            >
                {/* DISH ASSEMBLY */}
                <div className="relative w-32 h-32 flex items-center justify-center" style={{ transform: 'translateZ(90px)', transformStyle: 'preserve-3d' }}>
                    
                    {/* Rear Housing - Deep back panel */}
                    <div className="absolute inset-0 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.7)] border-4 border-slate-800" 
                         style={{ transform: 'translateZ(-20px)', transformStyle: 'preserve-3d' }}>
                         <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-full"></div>
                         
                         {/* Structural rings */}
                         <div className="absolute inset-0 border-[8px] border-slate-600/50 rounded-full"></div>
                         <div className="absolute inset-3 border-[4px] border-slate-500/40 rounded-full"></div>
                         <div className="absolute inset-6 border-[2px] border-slate-400/30 rounded-full"></div>
                         
                         {/* Cross bracing */}
                         <div className="absolute w-full h-1.5 bg-gradient-to-r from-transparent via-slate-600 to-transparent top-1/2 -mt-0.5 shadow-md"></div>
                         <div className="absolute h-full w-1.5 bg-gradient-to-b from-transparent via-slate-600 to-transparent left-1/2 -ml-0.5 shadow-md"></div>
                         
                         {/* Mounting bolts */}
                         <div className="absolute top-3 left-3 w-3 h-3 bg-slate-700 rounded-full border-2 border-slate-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
                             <div className="absolute inset-0.5 border-t border-slate-400 rounded-full"></div>
                         </div>
                         <div className="absolute top-3 right-3 w-3 h-3 bg-slate-700 rounded-full border-2 border-slate-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
                             <div className="absolute inset-0.5 border-t border-slate-400 rounded-full"></div>
                         </div>
                         <div className="absolute bottom-3 left-3 w-3 h-3 bg-slate-700 rounded-full border-2 border-slate-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
                             <div className="absolute inset-0.5 border-t border-slate-400 rounded-full"></div>
                         </div>
                         <div className="absolute bottom-3 right-3 w-3 h-3 bg-slate-700 rounded-full border-2 border-slate-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
                             <div className="absolute inset-0.5 border-t border-slate-400 rounded-full"></div>
                         </div>
                    </div>
                    
                    {/* Middle layer - Creates depth */}
                    <div className="absolute inset-0 rounded-full shadow-lg" style={{ transform: 'translateZ(-12px)', transformStyle: 'preserve-3d' }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 rounded-full"></div>
                    </div>
                    
                    {/* Rim - Thick outer edge */}
                    <div className="absolute inset-0 rounded-full shadow-xl" style={{ transform: 'translateZ(-6px)', transformStyle: 'preserve-3d' }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 rounded-full border-2 border-slate-500"></div>
                        <div className="absolute inset-0 bg-gradient-to-tl from-transparent to-white/20 rounded-full"></div>
                    </div>

                    {/* Front Face - Reflective dish surface */}
                    <div className="absolute inset-1 rounded-full border-[5px] border-gray-400 overflow-hidden shadow-[inset_0_-6px_20px_rgba(0,0,0,0.3),inset_0_6px_20px_rgba(255,255,255,0.5),0_5px_15px_rgba(0,0,0,0.3)]"
                         style={{ transform: 'translateZ(2px)', transformStyle: 'preserve-3d' }}>
                        
                        {/* Base metallic surface */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 rounded-full"></div>
                        
                        {/* Mesh texture overlay */}
                        <div className="absolute inset-0 opacity-12 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-repeat"></div>
                        
                        {/* Realistic light reflection - Top left highlight */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/20 to-transparent rounded-full"></div>
                        <div className="absolute -top-2 -left-2 w-20 h-20 bg-white/40 rounded-full blur-xl"></div>
                        
                        {/* Specular highlight */}
                        <div className="absolute top-4 left-8 w-16 h-8 bg-gradient-to-b from-white/50 to-transparent rounded-full blur-md rotate-[-25deg]"></div>
                        
                        {/* Concentric measurement rings */}
                        <div className="absolute inset-5 border-[2px] border-gray-400/60 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]"></div>
                        <div className="absolute inset-8 border-[2px] border-gray-400/60 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]"></div>
                        <div className="absolute inset-11 border-[1.5px] border-gray-400/50 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]"></div>
                        <div className="absolute inset-14 border border-gray-400/40 rounded-full"></div>
                        
                        {/* Radial pattern */}
                        <div className="absolute inset-0 opacity-10" style={{
                            background: 'repeating-conic-gradient(from 0deg, transparent 0deg, gray 1deg, transparent 2deg)'
                        }}></div>
                        
                        {/* Central hub - Enhanced 3D */}
                        <div className="absolute top-1/2 left-1/2 w-10 h-10 -ml-5 -mt-5 z-20" style={{ transformStyle: 'preserve-3d' }}>
                            {/* Hub base */}
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-400 rounded-full shadow-[0_3px_10px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.6)]"></div>
                            
                            {/* Hub inner ring */}
                            <div className="absolute inset-1 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-500 rounded-full shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]"></div>
                            
                            {/* Central screw */}
                            <div className="absolute inset-3 bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                                <div className="absolute inset-1 bg-slate-800 rounded-full"></div>
                                <div className="absolute top-1/2 left-1/2 w-3 h-0.5 bg-slate-900 -ml-1.5 -mt-0.5"></div>
                            </div>
                            
                            {/* Top highlight */}
                            <div className="absolute top-1 left-1 w-3 h-3 bg-white/60 rounded-full blur-sm"></div>
                        </div>
                    </div>

                    {/* LNB Boom */}
                    <div className="absolute bottom-1 left-1/2 w-4 h-32 -ml-2 origin-bottom rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
                         style={{ 
                             transform: 'translateZ(2px) rotateX(60deg)',
                             background: 'linear-gradient(to top, #475569 0%, #64748b 50%, #94a3b8 100%)'
                         }}>
                         <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-white/40 to-transparent rounded-full"></div>
                         <div className="absolute bottom-0 left-1/2 -ml-3 w-6 h-3 bg-slate-600 rounded-sm border border-slate-500"></div>
                    </div>

                    {/* LNB Head */}
                    <div className={`absolute top-1/2 left-1/2 w-4 h-14 -ml-5 -mt-5 rounded-lg border-2 shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-all duration-200 z-50 ${isActive ? 'bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600 border-cyan-300 shadow-[0_0_40px_rgba(6,182,212,0.9)]' : 'bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 border-rose-300'}`}
                         style={{ transform: 'translateZ(85px)', transformStyle: 'preserve-3d' }}>
                         
                         <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent rounded-lg"></div>
                         
                         <div className="absolute inset-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-md border border-slate-700 shadow-inner flex items-center justify-center">
                             <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-rose-900'}`}></div>
                         </div>
                         
                         <div className="absolute -left-1 top-1/2 -mt-1 w-1 h-2 bg-slate-600 rounded-full"></div>
                         <div className="absolute -right-1 top-1/2 -mt-1 w-1 h-2 bg-slate-600 rounded-full"></div>
                         
                         <div className={`absolute bottom-full left-1/2 -ml-[100px] w-[200px] h-[400px] origin-bottom transition-opacity duration-300 pointer-events-none ${isActive ? 'opacity-40' : 'opacity-0'}`}
                              style={{ 
                                  background: 'linear-gradient(to top, rgba(6,182,212,0.5), rgba(6,182,212,0.2) 40%, transparent 80%)',
                                  transform: 'rotateX(-90deg)', 
                                  clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
                                  filter: 'blur(2px)'
                              }}>
                         </div>
                    </div>

                </div>
            </div>
         </div>
    </div>
));


export const SimulationCanvas: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kmlLayersRef = useRef<any[]>([]); // 存储多个 KML 图层
  
  // 渲染相关 Refs
  const satMarkersRef = useRef<Map<string, any>>(new Map());
  const satPortalRootsRef = useRef<Map<string, HTMLElement>>(new Map());
  const dishMarkersRef = useRef<Map<string, any>>(new Map());
  const dishPortalRootsRef = useRef<Map<string, HTMLElement>>(new Map());
  const beamLinesRef = useRef<Map<string, SVGLineElement>>(new Map());
  const beamGradientsRef = useRef<Map<string, SVGLinearGradientElement>>(new Map());
  const beamPolygonsRef = useRef<Map<string, SVGPolygonElement>>(new Map());

  const visualStateRef = useRef<Map<string, { accumulatedAz: number }>>(new Map());
  const animationFrameRef = useRef<number>(0);
  
  // 状态
  const [satellites, setSatellites] = useState<Satellite[]>([
      { id: 'sat-a', pos: { lat: 0, lng: 110 }, color: '#f59e0b' },
      { id: 'sat-b', pos: { lat: 0, lng: 130 }, color: '#8b5cf6' }
  ]);
  const [dishes, setDishes] = useState<Dish[]>([
    { id: 'dish-1', pos: { lat: 31.23, lng: 121.47 }, targetSatelliteId: 'sat-a' },
  ]);
  const [activeDishId, setActiveDishId] = useState<string>('dish-1');
  const [activeDishInfo, setActiveDishInfo] = useState({ az: 0, el: 0, targetSatIndex: -1 });
  const [kmlCount, setKmlCount] = useState(0);

  // Refs 同步
  const satellitesRef = useRef(satellites);
  const dishesRef = useRef(dishes);
  const activeDishIdRef = useRef(activeDishId);
  useEffect(() => { satellitesRef.current = satellites; }, [satellites]);
  useEffect(() => { dishesRef.current = dishes; }, [dishes]);
  useEffect(() => { activeDishIdRef.current = activeDishId; }, [activeDishId]);

  const [portalTick, setPortalTick] = useState(0); 

  // --- 动画循环 ---
  const updateVisuals = useCallback(() => {
    if (!mapInstanceRef.current) {
        animationFrameRef.current = requestAnimationFrame(updateVisuals);
        return;
    }
    const currentZoom = mapInstanceRef.current.getZoom();
    const scale = Math.pow(1.4, currentZoom - 3);
    const currentSatellites = satellitesRef.current;
    const currentDishes = dishesRef.current;
    const currentActiveId = activeDishIdRef.current;

    const satRealtimePos = new Map<string, { latLng: any, pt: any, color?: string }>();
    satMarkersRef.current.forEach((marker, id) => {
        const latLng = marker.getLatLng();
        const pt = mapInstanceRef.current.latLngToContainerPoint(latLng);
        const satDef = currentSatellites.find(s => s.id === id);
        if (satDef) satRealtimePos.set(id, { latLng, pt, color: satDef.color });
    });

    let activeAz = 0, activeEl = 0, activeTargetIndex = -1;

    dishMarkersRef.current.forEach((marker, dishId) => {
        const dishLatLng = marker.getLatLng();
        const dishPt = mapInstanceRef.current.latLngToContainerPoint(dishLatLng);
        const dishState = currentDishes.find(d => d.id === dishId);
        if (!dishState) return;
        const targetSatId = dishState.targetSatelliteId;
        const targetSatData = satRealtimePos.get(targetSatId);

        if (targetSatData) {
            const az = calculateAzimuth({ lat: dishLatLng.lat, lng: dishLatLng.lng }, { lat: targetSatData.latLng.lat, lng: targetSatData.latLng.lng });
            const el = calculateElevation({ lat: dishLatLng.lat, lng: dishLatLng.lng }, { lat: targetSatData.latLng.lat, lng: targetSatData.latLng.lng });
            if (dishId === currentActiveId) { activeAz = az; activeEl = el; activeTargetIndex = currentSatellites.findIndex(s => s.id === targetSatId); }

            let visual = visualStateRef.current.get(dishId) || { accumulatedAz: az };
            const delta = (az - visual.accumulatedAz + 540) % 360 - 180;
            visual.accumulatedAz += delta;
            visualStateRef.current.set(dishId, visual);

            const azEl = document.getElementById(`dish-azimuth-${dishId}`);
            const elEl = document.getElementById(`dish-elevation-${dishId}`);
            if (azEl) azEl.style.transform = `rotateZ(${visual.accumulatedAz}deg)`;
            if (elEl) elEl.style.transform = `rotateX(${Math.min(75, (90-el)*1.5)}deg)`;

            const beamLine = beamLinesRef.current.get(dishId);
            const beamPoly = beamPolygonsRef.current.get(dishId);
            if (beamLine && beamPoly) {
                const sx = targetSatData.pt.x, sy = targetSatData.pt.y, dx = dishPt.x, dy = dishPt.y;
                beamLine.setAttribute('x1', String(dx)); beamLine.setAttribute('y1', String(dy));
                beamLine.setAttribute('x2', String(sx)); beamLine.setAttribute('y2', String(sy));
                beamLine.style.display = 'block';

                const angleRad = Math.atan2(dy - sy, dx - sx);
                const dist = Math.hypot(dx - sx, dy - sy);
                const spread = 5 * (Math.PI / 180); 
                const len = dist * 1.05;
                const x1 = sx + len * Math.cos(angleRad - spread), y1 = sy + len * Math.sin(angleRad - spread);
                const x2 = sx + len * Math.cos(angleRad + spread), y2 = sy + len * Math.sin(angleRad + spread);
                beamPoly.setAttribute('points', `${sx},${sy} ${x1},${y1} ${x2},${y2}`);
                beamPoly.setAttribute('fill', targetSatData.color || '#f59e0b');
                beamPoly.setAttribute('opacity', dishId === currentActiveId ? '0.25' : '0.05');
                beamPoly.style.display = 'block';
            }
        }
    });

    if (animationFrameRef.current % 5 === 0) setActiveDishInfo({ az: activeAz, el: activeEl, targetSatIndex: activeTargetIndex });
    animationFrameRef.current = requestAnimationFrame(updateVisuals);
  }, []);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(updateVisuals);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [updateVisuals]);

  // --- 地图初始化 ---
  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;
    if (!mapInstanceRef.current) {
        const map = window.L.map(mapContainerRef.current, { center: [30, 115], zoom: 4, zoomControl: false, attributionControl: false });
        mapInstanceRef.current = map;
        window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { className: 'map-tiles' }).addTo(map);
    }
    const map = mapInstanceRef.current;

    // 更新卫星标记
    satellites.forEach(sat => {
        if (!satMarkersRef.current.has(sat.id)) {
            const marker = window.L.marker([sat.pos.lat, sat.pos.lng], { draggable: true, icon: window.L.divIcon({ className: 'custom-icon', html: `<div id="sat-portal-root-${sat.id}"></div>`, iconSize: [80, 40], iconAnchor: [40, 20] }) }).addTo(map);
            marker.on('drag', (e: any) => { const ll = e.target.getLatLng(); if (Math.abs(ll.lat) > 0.1) e.target.setLatLng([0, ll.lng]); });
            satMarkersRef.current.set(sat.id, marker);
            const root = marker.getElement()?.querySelector(`#sat-portal-root-${sat.id}`);
            if (root) satPortalRootsRef.current.set(sat.id, root);
        }
    });

    // 更新地面站标记
    dishes.forEach(dish => {
        if (!dishMarkersRef.current.has(dish.id)) {
            const marker = window.L.marker([dish.pos.lat, dish.pos.lng], { draggable: true, icon: window.L.divIcon({ className: 'custom-icon', html: `<div id="dish-portal-root-${dish.id}"></div>`, iconSize: [160, 160], iconAnchor: [80, 80] }) }).addTo(map);
            marker.on('dragstart', () => { activeDishIdRef.current = dish.id; setActiveDishId(dish.id); });
            marker.on('click', () => { activeDishIdRef.current = dish.id; setActiveDishId(dish.id); });
            dishMarkersRef.current.set(dish.id, marker);
            const root = marker.getElement()?.querySelector(`#dish-portal-root-${dish.id}`);
            if (root) dishPortalRootsRef.current.set(dish.id, root);
        }
    });
    setPortalTick(p => p + 1);
  }, [dishes, satellites]);

  // --- 操作处理器 ---
  const addSatellite = () => { if (satellites.length >= 10) return; const id = `sat-${Date.now()}`; const colors = ['#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981']; setSatellites(prev => [...prev, { id, pos: { lat: 0, lng: 110 + (prev.length * 10) }, color: colors[prev.length % colors.length] }]); };
  const removeSatellite = () => { if (satellites.length === 0) return; const last = satellites[satellites.length - 1]; const next = satellites.slice(0, -1); if (next.length > 0) setDishes(prev => prev.map(d => d.targetSatelliteId === last.id ? { ...d, targetSatelliteId: next[0].id } : d)); setSatellites(next); };
  const addDish = () => { const center = mapInstanceRef.current?.getCenter() || { lat: 35, lng: 110 }; const id = `dish-${Date.now()}`; setDishes(prev => [...prev, { id, pos: { lat: center.lat + (Math.random()-0.5)*5, lng: center.lng + (Math.random()-0.5)*5 }, targetSatelliteId: satellites.length > 0 ? satellites[0].id : '' }]); setActiveDishId(id); };
  const removeDish = () => { if (dishes.length === 0) return; const next = dishes.slice(0, -1); setDishes(next); setActiveDishId(next.length > 0 ? next[next.length - 1].id : ''); };
  const switchTarget = useCallback(() => { const active = dishesRef.current.find(d => d.id === activeDishIdRef.current); if (!active || satellitesRef.current.length === 0) return; const idx = (satellitesRef.current.findIndex(s => s.id === active.targetSatelliteId) + 1) % satellitesRef.current.length; setDishes(prev => prev.map(d => d.id === activeDishIdRef.current ? { ...d, targetSatelliteId: satellitesRef.current[idx].id } : d)); }, []);

  // --- KML 处理：多文件支持与颜色区分 ---
  const handleKmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !window.omnivore) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const kmlText = event.target?.result as string;
      const map = mapInstanceRef.current;
      
      // 预设颜色池
      const colors = ['#00F0FF', '#FF00FF', '#00FF00', '#FFA500', '#FFFF00', '#FF4500', '#00BFFF'];
      const chosenColor = colors[kmlLayersRef.current.length % colors.length];

      // 解析并创建新图层
      const newLayer = window.omnivore.kml.parse(kmlText);
      newLayer.setStyle({
        color: chosenColor,
        weight: 3,
        opacity: 0.8,
        fillColor: chosenColor,
        fillOpacity: 0.1
      });
      
      newLayer.addTo(map);
      kmlLayersRef.current.push(newLayer);
      setKmlCount(kmlLayersRef.current.length);
      
      // 缩放到新导入的图层
      try {
          map.fitBounds(newLayer.getBounds());
      } catch(err) { console.warn('KML contains no bounds'); }
    };
    reader.readAsText(file);
    e.target.value = ''; // 重置以允许重复上传同一文件
  };

  const clearAllKml = () => {
    kmlLayersRef.current.forEach(layer => mapInstanceRef.current.removeLayer(layer));
    kmlLayersRef.current = [];
    setKmlCount(0);
  };

  return (
    <div className="relative w-full h-full bg-[#AAD3DF] overflow-hidden">
      <div ref={mapContainerRef} className="absolute inset-0 z-0 outline-none" />
      {satellites.map(sat => { const root = satPortalRootsRef.current.get(sat.id); return root ? createPortal(<SatelliteVisual color={sat.color} />, root) : null; })}
      {dishes.map(dish => { const root = dishPortalRootsRef.current.get(dish.id); return root ? createPortal(<DishVisual id={dish.id} isActive={activeDishId === dish.id} />, root) : null; })}
      
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
          <defs>
             {dishes.map(dish => (
                 <linearGradient key={dish.id} id={`beamGradient-${dish.id}`} gradientUnits="userSpaceOnUse" ref={el => { if(el) beamGradientsRef.current.set(dish.id, el) }}>
                    <stop offset="0%" stopColor={activeDishId === dish.id ? "#2563EB" : "#1e293b"} stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
                 </linearGradient>
             ))}
             <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          {dishes.map(dish => (
              <React.Fragment key={dish.id}>
                  <polygon ref={el => { if(el) beamPolygonsRef.current.set(dish.id, el) }} className="transition-opacity duration-300" stroke="none" />
                  <line ref={el => { if(el) beamLinesRef.current.set(dish.id, el) }} stroke={`url(#beamGradient-${dish.id})`} strokeWidth="3" strokeDasharray="12 6" className="animate-[dash_0.6s_linear_infinite]" strokeLinecap="round" filter="url(#glow)" />
              </React.Fragment>
          ))}
      </svg>

      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-4 z-20">
        <div className="flex flex-col bg-white/90 backdrop-blur shadow-xl border border-slate-200 rounded-lg overflow-hidden pointer-events-auto">
            <button onClick={() => mapInstanceRef.current?.zoomIn()} className="p-2 hover:bg-slate-100"><Plus className="w-5 h-5" /></button>
            <button onClick={() => mapInstanceRef.current?.setView([30, 115], 4)} className="p-2 hover:bg-slate-100"><RotateCcw className="w-4 h-4" /></button>
            <button onClick={() => mapInstanceRef.current?.zoomOut()} className="p-2 hover:bg-slate-100"><Minus className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-2 pointer-events-auto">
            <div className="flex items-center gap-1 bg-white/90 backdrop-blur shadow-xl border border-slate-200 rounded-lg p-1">
                <input type="file" ref={fileInputRef} onChange={handleKmlUpload} accept=".kml" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className={`p-2 rounded-md flex items-center gap-1 transition-colors ${kmlCount > 0 ? 'text-cyan-600 bg-cyan-50' : 'text-slate-600 hover:text-cyan-600'}`} title="导入 KML 图层">
                    <FolderOpen className="w-5 h-5" />
                    {kmlCount > 0 && <span className="text-[10px] font-bold">{kmlCount}</span>}
                </button>
                {kmlCount > 0 && <button onClick={clearAllKml} className="p-2 text-red-600 hover:bg-red-50 rounded-md" title="清除所有 KML 图层"><Trash2 className="w-4 h-4" /></button>}
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button onClick={removeSatellite} disabled={satellites.length === 0} className="p-2 text-slate-600 hover:text-red-600 disabled:opacity-30"><Trash2 className="w-5 h-5" /></button>
                <div className="flex flex-col items-center px-1"><Rocket className="w-4 h-4 text-purple-600" /><span className="text-[10px] font-bold text-slate-500">{satellites.length}</span></div>
                <button onClick={addSatellite} disabled={satellites.length >= 10} className="p-2 text-slate-600 hover:text-purple-600"><Plus className="w-5 h-5" /></button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button onClick={removeDish} disabled={dishes.length === 0} className="p-2 text-slate-600 hover:text-red-600 disabled:opacity-30"><Trash2 className="w-5 h-5" /></button>
                <div className="flex flex-col items-center px-1"><SatelliteDish className="w-4 h-4 text-blue-600" /><span className="text-[10px] font-bold text-slate-500">{dishes.length}</span></div>
                <button onClick={addDish} className="p-2 text-slate-600 hover:text-blue-600"><Plus className="w-5 h-5" /></button>
            </div>
        </div>

        <div className="flex flex-col gap-2 pointer-events-auto">
            <div className="group cursor-pointer" onClick={switchTarget}><DataReadout label="锁定卫星" value={activeDishInfo.targetSatIndex >= 0 ? `SAT ${activeDishInfo.targetSatIndex + 1}` : 'N/A'} unit="点击切换" active={true} icon={<RefreshCw className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />} /></div>
            <DataReadout label="方位角" value={`${activeDishInfo.az.toFixed(1)}°`} unit="度" />
            <DataReadout label="仰角" value={`${activeDishInfo.el.toFixed(1)}°`} unit="度" />
        </div>
      </div>
      <style>{` .map-tiles { filter: grayscale(10%) contrast(105%); } .custom-icon { background: transparent !important; border: none !important; } @keyframes dash { to { stroke-dashoffset: -18px; } } `}</style>
    </div>
  );
};

const DataReadout: React.FC<{ label: string; value: string; unit: string; active?: boolean; icon?: React.ReactNode }> = ({ label, value, unit, active, icon }) => (
    <div className={`bg-white/80 backdrop-blur border border-slate-200 p-3 rounded-lg w-52 shadow-lg flex justify-between items-center ${active ? 'border-blue-500/50' : ''}`}>
        <div className="flex flex-col"><span className="text-[10px] text-slate-500 font-mono tracking-widest font-semibold">{label}</span><span className="text-lg font-mono font-bold text-slate-900 mt-1">{value}</span></div>
        <div className="flex flex-col items-end">{icon || (active && <Wifi className="w-3 h-3 text-blue-600 animate-pulse mb-1" />)}<span className="text-[9px] text-blue-600 font-bold">{unit}</span></div>
    </div>
);