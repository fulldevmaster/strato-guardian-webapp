'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Wallet, ArrowUpRight, RefreshCw, Layers } from 'lucide-react';
import { createPublicClient, http, formatEther } from 'viem';

// Настройка прямого RPC-клиента сети STRATO
const publicClient = createPublicClient({
  transport: http('https://rpc.strato.net'),
});

export default function Home() {
  const [wallet, setWallet] = useState<string>('');
  const [rawBalance, setRawBalance] = useState<string>('0.00');
  const [healthFactor, setHealthFactor] = useState<number>(2.0);
  const [collateral, setCollateral] = useState<string>('0.00');
  const [debt, setDebt] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Функция получения 100% реального баланса из сети STRATO
  const fetchRealOnChainBalance = async (address: string) => {
    setIsLoading(true);
    try {
      // Прямой запрос к RPC блокчейна STRATO
      const balanceWei = await publicClient.getBalance({
        address: address as `0x${string}`,
      });

      // Переводим Wei в понятные токены STRATO
      const formattedBalance = Number(formatEther(balanceWei));
      setRawBalance(formattedBalance.toFixed(4));

      // Автоматический расчет залога и долга на основе РЕАЛЬНОГО баланса
      // Допустим: весь баланс — это залог, а 30% от него — условный заем
      const calcCollateral = formattedBalance;
      const calcDebt = formattedBalance * 0.3;
      
      // Health Factor = Залог / Долг (если долг > 0)
      const calcHF = calcDebt > 0 ? Number((calcCollateral / calcDebt).toFixed(2)) : 999;

      setCollateral(calcCollateral.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }));
      setDebt(calcDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }));
      setHealthFactor(calcHF > 10 ? 9.99 : calcHF);
    } catch (error) {
      console.error('Ошибка чтения реального баланса из RPC STRATO:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const walletParam = params.get('wallet');
      if (walletParam) {
        setWallet(walletParam);
        fetchRealOnChainBalance(walletParam);
      } else {
        const defaultWallet = '0x5d2E0D29437cFD44cAE3cBC5f81384622ce391f2';
        setWallet(defaultWallet);
        fetchRealOnChainBalance(defaultWallet);
      }
    }
  }, []);

  const getStatus = (hf: number) => {
    if (hf >= 1.5) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Безопасно' };
    if (hf >= 1.15) return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Предупреждение' };
    return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', label: 'Опасность!' };
  };

  const status = getStatus(healthFactor);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans max-w-md mx-auto">
      {/* Шапка */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-indigo-400" />
          <h1 className="text-xl font-bold">StratoGuard</h1>
        </div>
        <button 
          onClick={() => wallet && fetchRealOnChainBalance(wallet)} 
          className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30 flex items-center gap-1 active:scale-95 transition-all"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      {/* Адрес кошелька */}
      <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 mb-4">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Отслеживаемый кошелек</span>
          <Wallet className="w-4 h-4 text-slate-500" />
        </div>
        <p className="font-mono text-sm font-semibold text-slate-200 truncate">
          {wallet ? wallet : 'Кошелек не привязан'}
        </p>
      </div>

      {/* Реальный On-Chain Баланс */}
      <div className="bg-indigo-950/40 rounded-2xl p-4 border border-indigo-800/40 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-indigo-400" />
          <div>
            <span className="text-xs text-indigo-300/80 block font-medium">Реальный баланс STRATO</span>
            <span className="text-base font-bold text-slate-100 font-mono">
              {isLoading ? '...' : `${rawBalance} STRATO`}
            </span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">On-Chain</span>
      </div>

      {/* Индикатор Health Factor */}
      <div className={`rounded-2xl p-5 border ${status.border} ${status.bg} mb-6`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase text-slate-400">Health Factor</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${status.color} bg-slate-950/40`}>
            {status.label}
          </span>
        </div>
        
        <div className="flex items-baseline justify-between my-2">
          <span className={`text-4xl font-extrabold ${status.color}`}>
            {isLoading ? '...' : healthFactor.toFixed(2)}
          </span>
          <span className="text-xs text-slate-400">Порог: 1.15</span>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden mt-3">
          <div 
            className={`h-2.5 rounded-full transition-all duration-500 ${
              healthFactor >= 1.5 ? 'bg-emerald-500' : healthFactor >= 1.15 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${Math.min((healthFactor / 3) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Залог и Долг (На основе реального баланса) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-800/80">
          <span className="text-xs text-slate-400 block mb-1">Залог (STRATO)</span>
          <span className="text-lg font-bold text-slate-100">
            {isLoading ? '...' : `${collateral}`}
          </span>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-800/80">
          <span className="text-xs text-slate-400 block mb-1">Расчетный долг</span>
          <span className="text-lg font-bold text-slate-100">
            {isLoading ? '...' : `${debt}`}
          </span>
        </div>
      </div>

      {/* Кнопка */}
      <button
        onClick={() => alert(`Пополнение залога для ${wallet}...`)}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <ArrowUpRight className="w-5 h-5" />
        Пополнить залог (Top Up)
      </button>
    </main>
  );
}