import React, { useState, useEffect } from 'react';
import { BackendService } from '../services/mockBackend';
import { Token, OrderStatus, Canteen } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { CheckCircle, Clock, Check, Utensils, AlertCircle, MapPin } from 'lucide-react';

interface StaffViewProps {
    canteen: Canteen;
}

export const StaffView: React.FC<StaffViewProps> = ({ canteen }) => {
  const [queue, setQueue] = useState<Token[]>([]);

  const fetchQueue = async () => {
    const tokens = await BackendService.getActiveQueue(canteen.id);
    const sorted = tokens.sort((a, b) => {
      if (a.status === OrderStatus.READY && b.status !== OrderStatus.READY) return -1;
      if (a.status !== OrderStatus.READY && b.status === OrderStatus.READY) return 1;
      return a.timestamp - b.timestamp;
    });
    setQueue(sorted);
  };

  useEffect(() => {
    fetchQueue();
    window.addEventListener('smartqueue-update', fetchQueue);
    const handleStorage = (e: StorageEvent) => {
        if (e.key === 'smartqueue_tokens') fetchQueue();
    };
    window.addEventListener('storage', handleStorage);
    return () => {
        window.removeEventListener('smartqueue-update', fetchQueue);
        window.removeEventListener('storage', handleStorage);
    };
  }, [canteen.id]);

  const handleMarkReady = async (id: string) => {
    await BackendService.markOrderReady(id);
  };

  const handleComplete = async (id: string) => {
    await BackendService.completeOrder(id);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
           <div className="flex items-center gap-2 mb-1">
               <h1 className="text-2xl font-bold text-gray-900">Kitchen Display</h1>
               <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold border border-gray-200">{canteen.name}</span>
           </div>
           <p className="text-gray-500 text-sm">Real-time order management</p>
        </div>
        <div className="flex items-center gap-3">
             <div className="flex flex-col items-end">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active</span>
                <span className="text-2xl font-black text-primary-600 leading-none">{queue.length}</span>
             </div>
             <div className="w-px h-8 bg-gray-200" />
             <div className="p-3 bg-primary-50 rounded-xl text-primary-600">
                <Clock size={20} />
             </div>
        </div>
      </div>

      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 text-center animate-fade-in">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
             <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-500 max-w-sm">There are no active orders in the queue for {canteen.name}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-slide-up">
          {queue.map((token) => (
            <Card 
              key={token.id} 
              className={`relative border-l-4 overflow-hidden ${
                  token.status === OrderStatus.READY 
                  ? 'border-l-green-500 bg-green-50/30' 
                  : 'border-l-indigo-500'
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-4xl font-black text-gray-900 tracking-tight">{token.tokenNumber}</div>
                  <div className="text-[10px] text-gray-400 font-mono mt-1 uppercase tracking-widest">{token.couponCode}</div>
                </div>
                {token.status === OrderStatus.READY && (
                   <span className="bg-green-100 text-green-700 p-1.5 rounded-full">
                      <Check size={16} strokeWidth={3} />
                   </span>
                )}
              </div>

              <div className="mb-6">
                 <div className="flex items-center gap-2 mb-2">
                    <Utensils size={14} className="text-gray-400" />
                    <span className="text-lg font-bold text-gray-800">{token.foodItem}</span>
                 </div>
                 <div className="flex items-center text-xs font-semibold text-gray-500 bg-white/50 w-fit px-2 py-1 rounded-md border border-gray-100/50">
                    <Clock size={12} className="mr-1.5" />
                    Ordered {Math.floor((Date.now() - token.timestamp) / 60000)}m ago
                 </div>
              </div>

              <div className="pt-2">
                {token.status === OrderStatus.WAITING ? (
                  <Button 
                    fullWidth 
                    onClick={() => handleMarkReady(token.id)}
                    className="bg-gray-900 hover:bg-gray-800 shadow-none"
                  >
                    Mark Ready
                  </Button>
                ) : (
                  <Button 
                    fullWidth 
                    variant="outline"
                    className="bg-white border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                    onClick={() => handleComplete(token.id)}
                  >
                    Complete Order
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};