import React, { useEffect, useState } from 'react';
import { BackendService } from '../services/mockBackend';
import { GeminiService } from '../services/geminiService';
import { QueueStats, Canteen } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { TrendingUp, Clock, Users, Activity, Sparkles, MoreHorizontal, Download } from 'lucide-react';
import QRCode from 'react-qr-code';

interface AdminViewProps {
    canteen: Canteen;
}

export const AdminView: React.FC<AdminViewProps> = ({ canteen }) => {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [chartData, setChartData] = useState<{name: string, orders: number}[]>([]);
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  const loadData = async () => {
    const statsData = await BackendService.getStats(canteen.id);
    setStats(statsData);
    const trafficData = await BackendService.getHourlyTraffic(canteen.id);
    setChartData(trafficData);
  };

  useEffect(() => {
    // Construct the unique URL for this canteen
    const url = new URL(window.location.origin);
    url.searchParams.set('canteenId', canteen.id);
    setQrUrl(url.toString());

    loadData();
    window.addEventListener('smartqueue-update', loadData);
    const handleStorage = (e: StorageEvent) => {
        if (e.key === 'smartqueue_tokens') loadData();
    };
    window.addEventListener('storage', handleStorage);
    return () => {
        window.removeEventListener('smartqueue-update', loadData);
        window.removeEventListener('storage', handleStorage);
    };
  }, [canteen.id]);

  const handleGenerateInsights = async () => {
      if(!stats) return;
      setLoadingInsights(true);
      const text = await GeminiService.generateQueueInsights(stats);
      setInsights(text);
      setLoadingInsights(false);
  };

  if (!stats) return <div className="p-20 text-center text-gray-400 animate-pulse">Loading dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-4">
         <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{canteen.name} Dashboard</h1>
            <p className="text-gray-500">Overview of performance for {canteen.campus}</p>
         </div>
         <div className="flex items-center gap-2 text-xs font-semibold bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm text-green-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live Updates
         </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Orders" value={stats.totalOrdersToday} icon={<TrendingUp size={20} className="text-white" />} gradient="from-blue-500 to-blue-600" />
        <StatCard title="Avg Wait Time" value={`${stats.averageWaitTime}m`} icon={<Clock size={20} className="text-white" />} gradient="from-purple-500 to-purple-600" />
        <StatCard title="Active Queue" value={stats.activeQueueLength} icon={<Users size={20} className="text-white" />} gradient="from-green-500 to-green-600" />
        <StatCard title="Peak Hour" value="12 PM" icon={<Activity size={20} className="text-white" />} gradient="from-orange-500 to-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart */}
        <Card className="lg:col-span-2 min-h-[400px]" title="Traffic Volume">
          <div className="h-80 w-full mt-4">
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 12}} 
                        dy={10} 
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        allowDecimals={false} 
                        tick={{fill: '#94a3b8', fontSize: 12}} 
                    />
                    <Tooltip 
                        cursor={{fill: '#f8fafc'}} 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }} 
                        itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                    />
                    <Bar dataKey="orders" radius={[6, 6, 0, 0]} barSize={32} animationDuration={800}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4f46e5' : '#6366f1'} />
                        ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Activity size={48} className="mb-4 opacity-20" />
                    <p>No traffic data available yet.</p>
                </div>
            )}
          </div>
        </Card>

        {/* Sidebar Column */}
        <div className="space-y-6">
            
            {/* QR Code Asset Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-purple-600" />
                 
                 <h3 className="text-gray-900 font-bold mb-1">Canteen QR Code</h3>
                 <p className="text-xs text-gray-400 mb-6">Scan to join {canteen.name} queue</p>
                 
                 <div className="bg-white p-4 rounded-xl border-4 border-gray-900 inline-block shadow-sm mb-4">
                     {qrUrl && <QRCode value={qrUrl} size={140} />}
                 </div>
                 
                 <div className="text-[10px] font-mono text-gray-400 bg-gray-50 p-2 rounded break-all mb-4 border border-gray-100">
                    ID: {canteen.id}
                 </div>

                 <Button variant="outline" size="sm" fullWidth className="text-xs">
                     <Download size={14} className="mr-2" /> Download Sticker
                 </Button>
            </div>

            {/* AI Insights */}
            <Card title="Gemini Intelligence" className="bg-gradient-to-b from-white to-indigo-50/30">
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">Queue Analysis</h4>
                            <p className="text-sm text-gray-500 mt-1">Get AI-driven insights on staff allocation and wait times.</p>
                        </div>
                    </div>
                    
                    {insights ? (
                        <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm text-sm text-gray-700 space-y-3 relative animate-fade-in">
                           <div className="font-semibold text-indigo-700 flex items-center gap-2">
                                <Sparkles size={14}/> Report Generated
                           </div>
                           <div className="whitespace-pre-wrap leading-relaxed">{insights}</div>
                           <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setInsights('')} 
                                className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600"
                            >
                                Clear Report
                            </Button>
                        </div>
                    ) : (
                        <Button fullWidth onClick={handleGenerateInsights} disabled={loadingInsights} className="bg-gray-900 hover:bg-black text-white shadow-lg shadow-gray-200">
                            {loadingInsights ? 'Analyzing Data...' : 'Generate Report'}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, gradient }: { title: string, value: string | number, icon: React.ReactNode, gradient: string }) => (
    <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 hover:-translate-y-1 transition-transform duration-300">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg shadow-gray-200`}>
                {icon}
            </div>
            <button className="text-gray-300 hover:text-gray-500"><MoreHorizontal size={20} /></button>
        </div>
        <div>
            <h3 className="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wide">{title}</h3>
            <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
        </div>
    </div>
);