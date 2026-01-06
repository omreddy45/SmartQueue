import React, { useState, useEffect } from 'react';
import { BackendService, MENU_ITEMS } from '../services/mockBackend';
import { GeminiService } from '../services/geminiService';
import { Token, OrderStatus, Canteen } from '../types';
import { Button } from './ui/Button';
import { QrCode, Clock, Users, ArrowRight, RefreshCw, AlertCircle, Utensils, Coffee, Sandwich, Pizza, Sparkles, Check, MapPin, ScanLine, Camera } from 'lucide-react';
import { Card } from './ui/Card';

const ICON_MAP: Record<string, any> = {
    'coffee': <Coffee className="w-6 h-6" />,
    'sandwich': <Sandwich className="w-6 h-6" />,
    'utensils': <Utensils className="w-6 h-6" />,
    'pizza': <Pizza className="w-6 h-6" />
};

interface StudentViewProps {
    canteen?: Canteen; // Optional: If undefined, user must scan QR to find canteen
}

export const StudentView: React.FC<StudentViewProps> = ({ canteen: initialCanteen }) => {
  const [activeCanteen, setActiveCanteen] = useState<Canteen | undefined>(initialCanteen);
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number>(0);
  
  // Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [availableCanteens, setAvailableCanteens] = useState<Canteen[]>([]);

  // Real-time Status Update Listener
  useEffect(() => {
    if (!token || !activeCanteen || token.status === OrderStatus.COMPLETED || token.status === OrderStatus.CANCELLED) return;

    const updateStatus = async () => {
        try {
            const updatedToken = await BackendService.getTokenStatus(token.id);
            const pos = await BackendService.getQueuePosition(activeCanteen.id, token.id);
            if (updatedToken) {
               setToken(updatedToken);
               setQueuePosition(pos);
            }
        } catch (err) { console.error(err); }
    };

    updateStatus();
    const handleLocalUpdate = () => updateStatus();
    window.addEventListener('smartqueue-update', handleLocalUpdate);
    const handleStorageUpdate = (e: StorageEvent) => {
        if (e.key === 'smartqueue_tokens') updateStatus();
    };
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
        window.removeEventListener('smartqueue-update', handleLocalUpdate);
        window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [token?.id, activeCanteen?.id]);

  // Load available canteens for scanner simulation
  useEffect(() => {
      setAvailableCanteens(BackendService.getAllCanteens());
  }, []);

  const handleStartScan = () => {
      if (!selectedFood) { setError("Select food item first"); return; }
      
      // If canteen is already known, just confirm
      if (activeCanteen) {
          placeOrder(activeCanteen.id);
      } else {
          // Open mock scanner
          setIsScanning(true);
      }
  };

  const handleSimulatedScan = (canteen: Canteen) => {
      setIsScanning(false);
      setActiveCanteen(canteen);
      // Automatically place order for the scanned canteen
      placeOrder(canteen.id);
  };

  const placeOrder = async (canteenId: string) => {
      if (!selectedFood) return;
      setLoading(true);
      setError(null);
      
      // Generate a random ticket hash
      const ticketHash = `TKT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      try {
        // Simulate network/processing delay of scan
        await new Promise(r => setTimeout(r, 1000));

        const newToken = await BackendService.createToken(canteenId, ticketHash, selectedFood);
        setToken(newToken);
        const pos = await BackendService.getQueuePosition(canteenId, newToken.id);
        setQueuePosition(pos);
  
        if (newToken.status === OrderStatus.WAITING) {
          const activeQueue = await BackendService.getActiveQueue(canteenId);
          GeminiService.predictWaitTime(canteenId, activeQueue.length, selectedFood).then(({ estimatedMinutes, reasoning }) => {
              BackendService.updateTokenEstimation(newToken.id, estimatedMinutes, reasoning);
          });
        }
      } catch (err: any) {
        setError(err.message || "Error placing order");
      } finally {
        setLoading(false);
      }
  };

  // 1. Scanning UI Overlay
  if (isScanning) {
      return (
          <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4 animate-fade-in">
              <div className="text-white text-center mb-8">
                  <Camera size={48} className="mx-auto mb-4 animate-pulse" />
                  <h2 className="text-2xl font-bold">Scan Canteen QR</h2>
                  <p className="text-gray-400">Point your camera at the specific canteen code</p>
              </div>
              
              {/* Mock Viewfinder */}
              <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative overflow-hidden mb-8">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent animate-slide-up duration-1000" />
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-xl" />
              </div>

              <div className="bg-gray-900 p-4 rounded-xl max-w-sm w-full border border-gray-800">
                  <div className="text-xs font-bold text-gray-500 uppercase mb-3">Simulate Scanning:</div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availableCanteens.length === 0 ? (
                          <div className="text-gray-500 text-sm text-center py-4">No registered canteens found.<br/>Admin must register one first.</div>
                      ) : availableCanteens.map(c => (
                          <button 
                            key={c.id}
                            onClick={() => handleSimulatedScan(c)}
                            className="w-full text-left p-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-between group transition-colors"
                          >
                              <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${c.themeColor}`} />
                                  <span className="font-medium">{c.name}</span>
                              </div>
                              <span className="text-xs bg-white/10 px-2 py-1 rounded">Scan</span>
                          </button>
                      ))}
                  </div>
              </div>
              
              <Button variant="ghost" className="mt-8 text-white hover:bg-white/10" onClick={() => setIsScanning(false)}>
                  Cancel Scan
              </Button>
          </div>
      );
  }

  // 2. Token / Queue View
  if (token && activeCanteen) {
    const item = MENU_ITEMS.find(i => i.name === token.foodItem);
    
    return (
      <div className="max-w-md mx-auto animate-slide-up">
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden relative">
          <div className="bg-gradient-to-br from-primary-600 to-indigo-700 p-8 text-white text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
             
             {token.status === OrderStatus.READY && (
                <div className="absolute top-4 right-4 animate-bounce-soft">
                    <span className="bg-green-400 text-green-900 text-[10px] font-black px-2 py-1 rounded shadow-lg uppercase tracking-wider">Ready for Pickup</span>
                </div>
             )}

             <div className="mb-2 opacity-80 text-xs font-bold uppercase tracking-[0.2em]">{activeCanteen.name}</div>
             <div className="text-7xl font-black tracking-tighter mb-2 drop-shadow-lg">{token.tokenNumber}</div>
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-sm font-medium border border-white/10">
                {ICON_MAP[item?.icon || 'utensils']}
                <span>{token.foodItem}</span>
             </div>
          </div>

          <div className="relative bg-white p-8 pt-10">
             {/* Notches */}
             <div className="absolute -top-3 -left-3 w-6 h-6 bg-gray-50 rounded-full" />
             <div className="absolute -top-3 -right-3 w-6 h-6 bg-gray-50 rounded-full" />
             <div className="absolute top-0 left-8 right-8 border-t-2 border-dashed border-gray-200" />

             <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center justify-center group hover:bg-blue-50 transition-colors">
                 <div className="text-blue-600 mb-2"><Users size={24} /></div>
                 <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Position</div>
                 <div className="text-3xl font-black text-gray-900">{queuePosition}</div>
               </div>
               <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 flex flex-col items-center justify-center group hover:bg-purple-50 transition-colors">
                 <div className="text-purple-600 mb-2"><Clock size={24} /></div>
                 <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Est. Wait</div>
                 <div className="text-3xl font-black text-gray-900">
                   {token.status === OrderStatus.READY ? '0' : token.estimatedWaitTimeMinutes}<span className="text-sm font-bold text-gray-400 ml-0.5">m</span>
                 </div>
               </div>
             </div>

             {/* AI Reasoning */}
             {token.status === OrderStatus.WAITING && (
                <div className="mb-8 relative">
                   {token.aiReasoning ? (
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100 text-sm text-indigo-900 flex gap-3 shadow-sm">
                          <Sparkles size={18} className="mt-0.5 shrink-0 text-indigo-500 animate-pulse-slow" />
                          <p className="leading-relaxed font-medium">"{token.aiReasoning}"</p>
                      </div>
                   ) : (
                      <div className="flex justify-center items-center gap-3 text-gray-400 py-4">
                         <RefreshCw size={16} className="animate-spin" />
                         <span className="text-sm font-medium">AI is analyzing queue...</span>
                      </div>
                   )}
                </div>
             )}

             <div className="flex justify-center">
                 <Button variant="outline" onClick={() => { setToken(null); setSelectedFood(null); setActiveCanteen(initialCanteen); }}>
                    Order Another Item
                 </Button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Selection View
  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-24">
      <div className="text-center mb-8">
        {activeCanteen ? (
             <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full mb-3 shadow-sm">
                <MapPin size={12} />
                {activeCanteen.name}
            </div>
        ) : (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-3 shadow-sm animate-pulse">
                <ScanLine size={12} />
                Scan Pending
            </div>
        )}
       
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Order & Join Queue</h1>
        <p className="text-gray-500">Step 1: Select your meal.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        {MENU_ITEMS.map((item) => {
           const isSelected = selectedFood === item.name;
           return (
            <button
                key={item.id}
                onClick={() => {
                    setSelectedFood(item.name);
                    setError(null);
                }}
                className={`relative group p-4 rounded-2xl border-2 text-center transition-all duration-200 ${
                isSelected 
                    ? 'border-primary-500 bg-primary-50 ring-4 ring-primary-100' 
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg hover:-translate-y-1'
                }`}
            >
                {isSelected && (
                    <div className="absolute top-2 right-2 bg-primary-600 text-white p-1 rounded-full shadow-sm animate-fade-in">
                        <Check size={12} strokeWidth={4} />
                    </div>
                )}
                <div className={`w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-white text-primary-600 shadow-sm' : `${item.color} group-hover:scale-110 duration-300`
                }`}>
                    {ICON_MAP[item.icon] || <Utensils size={24}/>}
                </div>
                <div className={`text-sm font-bold leading-tight ${isSelected ? 'text-primary-900' : 'text-gray-700'}`}>
                    {item.name}
                </div>
            </button>
        )})}
      </div>

      {/* Action Footer / Scan Section */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
         <div className="max-w-md mx-auto">
             {error && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium flex items-center gap-3 animate-slide-up">
                  <AlertCircle size={20} className="shrink-0" />
                  {error}
                </div>
              )}
             
             {!selectedFood ? (
                 <div className="text-center text-gray-400 text-sm font-medium py-3">
                    Select a food item above to proceed
                 </div>
             ) : (
                 <div className="space-y-4 animate-slide-up">
                    <Button 
                        onClick={handleStartScan} 
                        fullWidth 
                        size="lg" 
                        disabled={loading}
                        className="bg-gray-900 hover:bg-black text-white h-16 text-lg shadow-xl shadow-gray-900/20"
                    >
                        {loading ? <RefreshCw className="animate-spin" /> : ( 
                            <div className="flex items-center gap-3">
                                {activeCanteen ? <Check size={24} /> : <ScanLine size={24} />}
                                <span>{activeCanteen ? 'Confirm Order' : 'Scan QR to Join Queue'}</span>
                            </div>
                        )}
                    </Button>
                 </div>
             )}
         </div>
      </div>
      
      {/* Spacer for fixed footer */}
      <div className="h-32" />
    </div>
  );
};