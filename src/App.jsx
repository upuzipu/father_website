import React, { useState, useEffect } from 'react';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.default?.pdfMake?.vfs || pdfFonts.pdfMake?.vfs || pdfFonts;

const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRuBlm-QRkDKtS9MY9lhapbhc0f7cvmYGVIDSaGiejLiGSZOeBIVU2vbeSWJNKaiX6FBKMKlKYfuFIf/pub?gid=0&single=true&output=csv';

const FALLBACK_PRODUCTS = [
  { id: 1, name: 'UNIGATE PY600 Привод откатных ворот', price: 14000 },
  { id: 2, name: 'UNIGATE PY1000 Привод откатных ворот', price: 20000 },
  { id: 3, name: 'UNIGATE SMART 300 Привод распашных ворот', price: 23000 },
  { id: 4, name: 'Сигнальная лампа', price: 1200 },
  { id: 5, name: 'Фотоэлементы', price: 800 },
  { id: 6, name: 'Пульт UNIGATE', price: 1000 },
  { id: 7, name: 'Т-ПРОФИЛЬ, стенка 2 мм, длина 6м.', price: 3300 },
  { id: 8, name: 'UNIGATE BASIC Комплект 5 м до 500 кг', price: 10000 },
  { id: 9, name: 'UNIGATE BASIC Комплект 6 м до 500 кг', price: 11000 },
  { id: 10, name: 'UNIGATE BASIC Комплект 7 м до 500 кг', price: 12000 },
  { id: 11, name: 'UNIGATE PRO Комплект 5 м до 500 кг', price: 11000 },
  { id: 12, name: 'UNIGATE PRO Комплект 6 м до 500 кг', price: 12000 },
  { id: 13, name: 'UNIGATE PRO Комплект 7 м до 500 кг', price: 13000 },
  { id: 14, name: 'Балка UNIGATE 5 м', price: 7000 },
  { id: 15, name: 'Балка UNIGATE 6 м', price: 8000 },
  { id: 16, name: 'Балка UNIGATE 7 м', price: 9000 },
  { id: 17, name: 'Зубчатая рейка сталь 8мм 1м', price: 600 },
  { id: 18, name: 'Подставка регулировочная, комплект 2шт.', price: 1500 },
  { id: 19, name: 'Роликовая опора UNIGATE', price: 2800 },
  { id: 20, name: 'Ролик верхний усиленный', price: 1500 },
];

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell);
        cell = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && next === '\n') i++;
        row.push(cell);
        if (row.some(c => c.trim() !== '')) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    if (row.some(c => c.trim() !== '')) rows.push(row);
  }

  return rows;
}

export default function App() {
  const [catalog, setCatalog] = useState(() => {
    try {
      const cached = localStorage.getItem('catalog_cache');
      if (cached) return JSON.parse(cached);
    } catch {}
    return FALLBACK_PRODUCTS;
  });

  const [quantities, setQuantities] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('quantities') || '{}');
    } catch {
      return {};
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [lastSync, setLastSync] = useState(() => {
    return localStorage.getItem('catalog_last_sync') || null;
  });
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncMessage, setSyncMessage] = useState('');

  const fetchCatalog = async () => {
    if (!GOOGLE_SHEETS_CSV_URL) {
      setSyncStatus('error');
      setSyncMessage('URL Google Таблицы не настроен — используется каталог из кода');
      return;
    }

    setLoadingCatalog(true);
    setSyncStatus(null);
    setSyncMessage('');

    try {
      const separator = GOOGLE_SHEETS_CSV_URL.includes('?') ? '&' : '?';
      const url = `${GOOGLE_SHEETS_CSV_URL}${separator}t=${Date.now()}`;

      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const csvText = await response.text();
      const rows = parseCSV(csvText);

      if (rows.length === 0) throw new Error('Таблица пуста');

      let dataRows = rows;
      const firstPrice = parseInt(String(rows[0]?.[1] || '').replace(/\D/g, ''), 10);
      if (isNaN(firstPrice)) {
        dataRows = rows.slice(1);
      }

      const products = dataRows
        .map((row, i) => {
          const name = (row[0] || '').trim();
          const priceRaw = (row[1] || '').trim();
          const price = parseInt(priceRaw.replace(/[^\d]/g, ''), 10);
          if (!name || isNaN(price) || price < 0) return null;
          return { id: i + 1, name, price };
        })
        .filter(Boolean);

      if (products.length === 0) throw new Error('В таблице нет валидных строк');

      setCatalog(products);
      localStorage.setItem('catalog_cache', JSON.stringify(products));
      const now = new Date().toISOString();
      localStorage.setItem('catalog_last_sync', now);
      setLastSync(now);
      setSyncStatus('success');
      setSyncMessage(`Загружено товаров: ${products.length}`);
      setTimeout(() => {
        setSyncStatus(null);
        setSyncMessage('');
      }, 3000);
    } catch (err) {
      setSyncStatus('error');
      setSyncMessage(`Не удалось загрузить таблицу: ${err.message}. Использую кеш.`);
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  useEffect(() => {
    localStorage.setItem('quantities', JSON.stringify(quantities));
  }, [quantities]);

  const products = catalog.map(p => ({
    ...p,
    quantity: quantities[p.id] || 0,
  }));

  const updateQuantity = (id, delta) => {
    setQuantities(q => ({ ...q, [id]: Math.max(0, (q[id] || 0) + delta) }));
  };

  const setQuantity = (id, value) => {
    setQuantities(q => ({ ...q, [id]: Math.max(0, isNaN(value) ? 0 : value) }));
  };

  const resetQuantities = () => {
    if (window.confirm('Сбросить все количества?')) {
      setQuantities({});
    }
  };

  const totalSum = products.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = products.reduce((sum, item) => sum + item.quantity, 0);
  const itemsInOrder = products.filter(item => item.quantity > 0);

  const generatePDF = () => {
    if (itemsInOrder.length === 0) return;
    setIsGenerating(true);

    try {
      const tableBody = itemsInOrder.map((item, i) => [
        { text: i + 1, alignment: 'center' },
        { text: item.name, alignment: 'left' },
        { text: item.quantity, alignment: 'right' },
        { text: `${item.price.toLocaleString('ru-RU')} ₽`, alignment: 'right' },
        { text: `${(item.price * item.quantity).toLocaleString('ru-RU')} ₽`, alignment: 'right' },
      ]);

      const docDefinition = {
        defaultStyle: { font: 'Roboto', fontSize: 10, color: '#334155' },
        content: [
          { text: 'ОТГРУЗКА', fontSize: 18, bold: true, color: '#0f172a', margin: [0, 0, 0, 8] },
          { text: `Дата формирования: ${new Date().toLocaleDateString('ru-RU')}`, fontSize: 10, color: '#64748b', margin: [0, 0, 0, 20] },
          {
            table: {
              headerRows: 1,
              widths: [30, '*', 50, 60, 70],
              body: [
                [
                  { text: '№', bold: true, color: '#0f172a', alignment: 'center' },
                  { text: 'Наименование', bold: true, color: '#0f172a', alignment: 'left' },
                  { text: 'Кол-во', bold: true, color: '#0f172a', alignment: 'right' },
                  { text: 'Цена', bold: true, color: '#0f172a', alignment: 'right' },
                  { text: 'Сумма', bold: true, color: '#0f172a', alignment: 'right' }
                ],
                ...tableBody
              ]
            },
            layout: {
              hLineWidth: (i) => (i === 1 ? 0.5 : 0),
              vLineWidth: () => 0,
              hLineColor: (i) => (i === 1 ? '#0f172a' : '#ffffff'),
              paddingLeft: () => 0,
              paddingRight: () => 8,
              paddingTop: () => 4,
              paddingBottom: () => 4
            }
          },
          {
            columns: [
              { text: 'ИТОГО:', fontSize: 12, bold: true, color: '#0f172a', margin: [0, 15, 0, 0] },
              { text: `${totalSum.toLocaleString('ru-RU')} ₽`, fontSize: 14, bold: true, color: '#0f172a', alignment: 'right', margin: [0, 15, 0, 0] }
            ]
          }
        ]
      };

      pdfMake.createPdf(docDefinition).download(`Отгрузка_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const lastSyncText = lastSync
    ? new Date(lastSync).toLocaleString('ru-RU')
    : 'ещё не синхронизировано';

  return (
    // h-screen вместо min-h-screen — фиксируем высоту вьюпорта
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col min-h-0 px-4 sm:px-6 py-6">

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 flex flex-col flex-1 min-h-0 overflow-hidden">

          {/* Шапка */}
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={fetchCatalog}
                disabled={loadingCatalog}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                title="Перечитать таблицу"
              >
                <svg className={`w-3.5 h-3.5 ${loadingCatalog ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M8 16H3v5"/>
                </svg>
                <span className="hidden sm:inline">{loadingCatalog ? 'Загрузка…' : 'Обновить'}</span>
              </button>

              {totalItems > 0 && (
                <button
                  onClick={resetQuantities}
                  className="text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Сбросить
                </button>
              )}
            </div>
          </div>

          {/* Статус синхронизации */}
          <div className={`px-5 py-2 border-b text-[11px] flex items-center gap-2 flex-shrink-0 ${
            syncStatus === 'success' ? 'bg-green-50 border-green-100' :
            syncStatus === 'error' ? 'bg-amber-50 border-amber-100' :
            'bg-blue-50/50 border-blue-100'
          }`}>
            {syncStatus === 'success' ? (
              <svg className="w-3 h-3 text-green-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : syncStatus === 'error' ? (
              <svg className="w-3 h-3 text-amber-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            ) : (
              <svg className="w-3 h-3 text-blue-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            )}
            <span className={
              syncStatus === 'success' ? 'text-green-700' :
              syncStatus === 'error' ? 'text-amber-700' : 'text-slate-500'
            }>
              {syncMessage || `Источник: Google Таблица • Последнее обновление: ${lastSyncText}`}
            </span>
          </div>

          {/* Список товаров — flex-1 + overflow-y-auto = всегда есть внутренний скролл */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
            {products.map((item) => (
              <div key={item.id} className="p-4 hover:bg-slate-50/80 transition-colors group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-slate-800">{item.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{item.price.toLocaleString('ru-RU')} ₽ / шт.</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.quantity === 0}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-blue-600 transition-colors text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                      >−</button>
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => setQuantity(item.id, Number(e.target.value))}
                        className="w-12 text-center text-sm font-semibold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-blue-600 transition-colors text-sm font-bold"
                      >+</button>
                    </div>

                    <span className={`text-sm font-bold min-w-[90px] text-right ${item.quantity > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                      {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Итого + PDF — sticky bottom, всегда прижат к низу */}
          <div className="flex-shrink-0 p-5 bg-slate-50 border-t border-slate-200 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.06)]">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-center sm:text-left">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Итого</p>
                <p className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">{totalSum.toLocaleString('ru-RU')} ₽</p>
                <p className="text-xs text-slate-500 mt-1">{totalItems} шт.</p>
              </div>
              <button
                onClick={generatePDF}
                disabled={isGenerating || itemsInOrder.length === 0}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 ${
                  isGenerating || itemsInOrder.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Генерация...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Скачать PDF
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}