import { Token, OrderStatus, QueueStats, MenuItem, Canteen } from '../types';

// Keys for local storage
const STORAGE_KEY_TOKENS = 'smartqueue_tokens';
const STORAGE_KEY_COUPONS = 'smartqueue_coupons';
const STORAGE_KEY_CANTEENS = 'smartqueue_canteens';

// Helper to generate a random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to generate a readable token number (e.g., A-001)
const generateTokenNumber = (currentCount: number) => {
  const number = (currentCount + 1).toString().padStart(3, '0');
  return `A-${number}`;
};

// Event Dispatcher for Real-time updates
const notifyChange = () => {
  window.dispatchEvent(new Event('smartqueue-update'));
};

export const MENU_ITEMS: MenuItem[] = [
  { 
    id: 'vadapav', 
    name: 'Vada Pav', 
    icon: 'pizza', 
    color: 'bg-orange-100 text-orange-700'
  },
  { 
    id: 'alooparatha', 
    name: 'Aloo Paratha', 
    icon: 'utensils', 
    color: 'bg-yellow-100 text-yellow-700'
  },
  { 
    id: 'samosa', 
    name: 'Samosa', 
    icon: 'pizza', 
    color: 'bg-amber-100 text-amber-700'
  },
  { 
    id: 'masaladosa', 
    name: 'Masala Dosa', 
    icon: 'utensils', 
    color: 'bg-orange-50 text-orange-800'
  },
  { 
    id: 'cholebhature', 
    name: 'Chole Bhature', 
    icon: 'utensils', 
    color: 'bg-red-50 text-red-800'
  },
  { 
    id: 'sandwich', 
    name: 'Veg Sandwich', 
    icon: 'sandwich', 
    color: 'bg-green-100 text-green-700'
  },
  { 
    id: 'coffee', 
    name: 'Cold Coffee', 
    icon: 'coffee', 
    color: 'bg-stone-100 text-stone-700'
  },
];

export const BackendService = {
  
  MENU_ITEMS,

  // --- Canteen Management ---

  registerCanteen: async (name: string, campus: string): Promise<Canteen> => {
    const canteens: Canteen[] = JSON.parse(localStorage.getItem(STORAGE_KEY_CANTEENS) || '[]');
    
    // Assign a random gradient theme
    const themes = [
        'from-blue-500 to-indigo-600',
        'from-amber-600 to-orange-600',
        'from-red-500 to-pink-600', 
        'from-green-500 to-emerald-600',
        'from-purple-500 to-violet-600'
    ];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];

    const newCanteen: Canteen = {
        id: generateId(),
        name,
        campus,
        themeColor: randomTheme
    };

    canteens.push(newCanteen);
    localStorage.setItem(STORAGE_KEY_CANTEENS, JSON.stringify(canteens));
    return newCanteen;
  },

  getCanteen: (id: string): Canteen | undefined => {
    const canteens: Canteen[] = JSON.parse(localStorage.getItem(STORAGE_KEY_CANTEENS) || '[]');
    return canteens.find(c => c.id === id);
  },

  getAllCanteens: (): Canteen[] => {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_CANTEENS) || '[]');
  },

  // --- Student Methods ---

  createToken: async (canteenId: string, couponCode: string, foodItem: string): Promise<Token> => {
    // In the new flow, couponCode is effectively the "Ticket ID" or "User Device ID"
    // We remove the strict coupon one-time-use check to allow easier flow testing, 
    // or we assume a new code is generated per order.
    
    const tokens: Token[] = JSON.parse(localStorage.getItem(STORAGE_KEY_TOKENS) || '[]');
    const today = new Date().setHours(0, 0, 0, 0);
    
    // Filter tokens for THIS canteen and TODAY to generate sequential number
    const canteenTodayTokens = tokens.filter(t => t.canteenId === canteenId && t.timestamp >= today);
    
    const newToken: Token = {
      id: generateId(),
      canteenId,
      couponCode, // This can be treated as a User ID or Order Hash
      tokenNumber: generateTokenNumber(canteenTodayTokens.length),
      foodItem,
      status: OrderStatus.WAITING,
      timestamp: Date.now(),
      estimatedWaitTimeMinutes: 5,
    };

    tokens.push(newToken);
    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
    notifyChange();

    return newToken;
  },

  getTokenStatus: async (tokenId: string): Promise<Token | null> => {
    const tokens: Token[] = JSON.parse(localStorage.getItem(STORAGE_KEY_TOKENS) || '[]');
    return tokens.find(t => t.id === tokenId) || null;
  },

  getQueuePosition: async (canteenId: string, tokenId: string): Promise<number> => {
    const tokens: Token[] = JSON.parse(localStorage.getItem(STORAGE_KEY_TOKENS) || '[]');
    // Filter by canteen
    const activeTokens = tokens.filter(t => t.canteenId === canteenId && t.status === OrderStatus.WAITING);
    const index = activeTokens.findIndex(t => t.id === tokenId);
    return index === -1 ? 0 : index + 1;
  },

  // --- Staff Methods ---

  getActiveQueue: async (canteenId: string): Promise<Token[]> => {
    const tokens: Token[] = JSON.parse(localStorage.getItem(STORAGE_KEY_TOKENS) || '[]');
    return tokens.filter(t => 
        t.canteenId === canteenId && 
        (t.status === OrderStatus.WAITING || t.status === OrderStatus.READY)
    );
  },

  markOrderReady: async (tokenId: string): Promise<void> => {
    const tokens: Token[] = JSON.parse(localStorage.getItem(STORAGE_KEY_TOKENS) || '[]');
    const index = tokens.findIndex(t => t.id === tokenId);
    if (index !== -1) {
      tokens[index].status = OrderStatus.READY;
      localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
      notifyChange();
    }
  },

  completeOrder: async (tokenId: string): Promise<void> => {
    const tokens: Token[] = JSON.parse(localStorage.getItem(STORAGE_KEY_TOKENS) || '[]');
    const index = tokens.findIndex(t => t.id === tokenId);
    if (index !== -1) {
      tokens[index].status = OrderStatus.COMPLETED;
      tokens[index].completedAt = Date.now();
      localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
      notifyChange();
    }
  },

  // --- Admin Methods ---

  getStats: async (canteenId: string): Promise<QueueStats> => {
    const tokens: Token[] = JSON.parse(localStorage.getItem(STORAGE_KEY_TOKENS) || '[]');
    
    // Filter specifically for this canteen
    const canteenTokens = tokens.filter(t => t.canteenId === canteenId);
    const activeTokens = canteenTokens.filter(t => t.status === OrderStatus.WAITING);
    const completedTokens = canteenTokens.filter(t => t.status === OrderStatus.COMPLETED && t.completedAt);
    
    let totalWaitTime = 0;
    completedTokens.forEach(t => {
        if (t.completedAt) {
            totalWaitTime += (t.completedAt - t.timestamp);
        }
    });
    
    const averageWaitTimeMs = completedTokens.length > 0 ? totalWaitTime / completedTokens.length : 0;
    
    return {
      totalOrdersToday: canteenTokens.length,
      averageWaitTime: Math.round(averageWaitTimeMs / 60000),
      peakHour: '12:00 PM - 1:00 PM',
      activeQueueLength: activeTokens.length,
    };
  },

  getHourlyTraffic: async (canteenId: string): Promise<{name: string, orders: number}[]> => {
    const tokens: Token[] = JSON.parse(localStorage.getItem(STORAGE_KEY_TOKENS) || '[]');
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayMs = today.getTime();
    
    // Filter by Canteen ID AND Today
    const todayTokens = tokens.filter(t => t.canteenId === canteenId && t.timestamp >= todayMs);
    
    const trafficMap: Record<number, number> = {};
    todayTokens.forEach(t => {
        const h = new Date(t.timestamp).getHours();
        trafficMap[h] = (trafficMap[h] || 0) + 1;
    });

    const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    Object.keys(trafficMap).forEach(k => {
        if(!hours.includes(Number(k))) hours.push(Number(k));
    });
    hours.sort((a,b) => a - b);

    return hours.map(h => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return {
            name: `${displayH} ${ampm}`,
            orders: trafficMap[h] || 0
        };
    });
  },

  updateTokenEstimation: async (tokenId: string, minutes: number, reasoning?: string) => {
      const tokens: Token[] = JSON.parse(localStorage.getItem(STORAGE_KEY_TOKENS) || '[]');
      const index = tokens.findIndex(t => t.id === tokenId);
      if (index !== -1) {
        tokens[index].estimatedWaitTimeMinutes = minutes;
        if(reasoning) tokens[index].aiReasoning = reasoning;
        localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
        notifyChange();
      }
  }
};