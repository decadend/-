import React from 'react';
import { SimulationCanvas } from './components/SimulationCanvas';
import { Radio, Activity } from 'lucide-react';

function App() {
  return (
    <div className="h-screen w-screen bg-[#AAD3DF] text-slate-800 flex flex-col font-sans overflow-hidden">
      
      {/* Floating HUD Header - Day Mode */}
      <div className="absolute top-0 left-0 w-full z-50 pointer-events-none p-6">
        <div className="flex items-start justify-between">
          <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-xl pointer-events-auto flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight leading-none text-slate-900">Orbital<span className="text-blue-600">Link</span></h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-semibold">卫星追踪仿真系统</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-full shadow-xl pointer-events-auto flex items-center gap-3">
             <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
             <span className="text-xs font-mono text-emerald-600 font-bold tracking-wider">实时信号</span>
          </div>
        </div>
      </div>

      {/* Main Content - Full Screen Canvas */}
      <main className="flex-1 relative w-full h-full">
        <SimulationCanvas />
      </main>

      {/* Footer / Instructions Overlay */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] bg-white/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/40 shadow-lg">
          沿赤道拖动卫星 • 拖动地面站调整位置
        </p>
      </div>
    </div>
  );
}

export default App;