import React, { useState } from 'react';
import { BackendService } from '../services/mockBackend';
import { Canteen } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { MapPin, ChefHat, Sparkles } from 'lucide-react';

interface CanteenSetupProps {
  onComplete: (canteen: Canteen) => void;
}

export const CanteenSetup: React.FC<CanteenSetupProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [campus, setCampus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !campus) return;
    setLoading(true);
    // Simulate slight network delay for effect
    await new Promise(r => setTimeout(r, 800));
    const newCanteen = await BackendService.registerCanteen(name, campus);
    setLoading(false);
    onComplete(newCanteen);
  };

  return (
    <div className="max-w-xl mx-auto mt-16 px-4 animate-slide-up">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-4 bg-primary-100 rounded-full text-primary-600 mb-6 shadow-sm">
            <ChefHat size={32} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Register New Canteen</h1>
        <p className="text-gray-500">Set up a smart queue system for your campus location.</p>
      </div>

      <Card className="p-8">
        <div className="space-y-6">
           <Input 
              label="Canteen Name" 
              placeholder="e.g. North Side Cafeteria" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
           />
           
           <Input 
              label="Campus / Location" 
              placeholder="e.g. Engineering Block A" 
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
           />

           <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-3 text-sm text-indigo-800">
              <Sparkles className="shrink-0 text-indigo-500" size={20} />
              <p>Once registered, you will get a unique QR code. Students must scan this code to access your specific menu and queue.</p>
           </div>

           <Button 
              fullWidth 
              size="lg" 
              onClick={handleRegister} 
              disabled={!name || !campus || loading}
              className="shadow-lg shadow-primary-600/20"
           >
              {loading ? 'Setting up Environment...' : 'Create Canteen Portal'}
           </Button>
        </div>
      </Card>
    </div>
  );
};