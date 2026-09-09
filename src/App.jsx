import React, { useState, useEffect } from 'react';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// Подключаем встроенные шрифты (включают Roboto с кириллицей)
pdfMake.vfs = pdfFonts.default?.pdfMake?.vfs || pdfFonts.pdfMake?.vfs || pdfFonts;

const availableProducts = [
  { id: 1, name: 'Привод откатных ворот UNIGATE PY600', price: 12000 },
  { id: 2, name: 'Привод откатных ворот UNIGATE PY1000', price: 19000 },
  { id: 3, name: 'Привод распашных ворот UNIGATE SMART 300', price: 22000 },
  { id: 4, name: 'Комплект UNIGATE BASIC 5 м до 500 кг', price: 9000 },
  { id: 5, name: 'Комплект UNIGATE PRO 5 м до 500 кг (с пласт накл)', price: 10000 },
  { id: 6, name: 'Комплект UNIGATE BASIC 6 м до 500 кг', price: 10000 },
  { id: 7, name: 'Комплект UNIGATE PRO 6 м до 500 кг (с пласт накл)', price: 11000 },
  { id: 8, name: 'Комплект UNIGATE BASIC 7 м до 500 кг', price: 11000 },
  { id: 9, name: 'Комплект UNIGATE PRO 7 м до 500 кг (с пласт накл)', price: 12000 },
  { id: 10, name: 'Роликовая опора UNIGATE', price: 2800 },
  { id: 11, name: 'Заготовка для самостоятельной сварки (под балку 6м)', price: 20000 },
  { id: 12, name: 'Заготовка для самостоятельной сварки (под балку 7м)', price: 23000 },
  { id: 13, name: 'Балка направляющая 5 метров', price: 7000 },
  { id: 14, name: 'Балка направляющая 6 метров', price: 8000 },
  { id: 15, name: 'Балка направляющая 7 метров', price: 9000 },
  { id: 16, name: 'Комплект удерживающих роликов верхний', price: 1500 },
  { id: 17, name: 'Подставка регулировочная, комплект 2шт.', price: 1500 },
  { id: 18, name: 'Т-профиль, стенка 2 мм, длина 6м.', price: 3000 },
  { id: 19, name: 'Зубчатая рейка 1м (металл, 8мм, крепеж в комплекте)', price: 600 },
  { id: 20, name: 'Сигнальная лампа + Фотоэлементы (комплект)', price: 2000 },
  { id: 21, name: 'Сигнальная лампа', price: 1 },
  { id: 22, name: 'Фотоэлементы', price: 1 },
  { id: 23, name: 'Пульт, 1шт.', price: 1000 },
];

export default function App() {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedProduct, setSelectedProduct] = useState(availableProducts[0]);
  const [quantity, setQuantity] = useState(1);
  const [notification, setNotification] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2500);
  };

  const addToCart = () => {
    if (quantity <= 0) return showNotification('Количество должно быть больше 0', 'error');
    const existingItem = cart.find((item) => item.id === selectedProduct.id);
    if (existingItem) {
      setCart(cart.map((item) => item.id === selectedProduct.id ? { ...item, quantity: item.quantity + quantity } : item));
    } else {
      setCart([...cart, { ...selectedProduct, quantity }]);
    }
    showNotification(`Добавлено: ${selectedProduct.name}`, 'success');
    setQuantity(1);
  };

  const removeFromCart = (id) => {
    const item = cart.find((i) => i.id === id);
    setCart(cart.filter((item) => item.id !== id));
    showNotification(`Удалено: ${item?.name}`, 'error');
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) return removeFromCart(id);
    setCart(cart.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Очистить весь список?')) {
      setCart([]);
      showNotification('Список очищен', 'error');
    }
  };

  const totalSum = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const generatePDF = () => {
    if (cart.length === 0) return showNotification('Список пуст!', 'error');
    setIsGenerating(true);

    try {
      const tableBody = cart.map((item, i) => [
        i + 1,
        item.name,
        item.quantity,
        `${item.price.toLocaleString()} ₽`,
        `${(item.price * item.quantity).toLocaleString()} ₽`,
      ]);

      const docDefinition = {
        defaultStyle: {
          font: 'Roboto',
          fontSize: 10,
          color: '#334155'
        },
        content: [
          {
            text: 'ОТГРУЗКА',
            fontSize: 18,
            bold: true,
            color: '#0f172a',
            margin: [0, 0, 0, 8]
          },
          {
            text: `Дата формирования: ${new Date().toLocaleDateString('ru-RU')}`,
            fontSize: 10,
            color: '#64748b',
            margin: [0, 0, 0, 20]
          },
          {
            table: {
              headerRows: 1,
              widths: [30, '*', 40, 50, 50],
              body: [
                [
                  { text: '№', bold: true, color: '#0f172a' },
                  { text: 'Наименование', bold: true, color: '#0f172a' },
                  { text: 'Кол-во', bold: true, color: '#0f172a' },
                  { text: 'Цена', bold: true, color: '#0f172a', alignment: 'right' },
                  { text: 'Сумма', bold: true, color: '#0f172a', alignment: 'right' }
                ],
                ...tableBody
              ]
            },
            layout: {
              hLineWidth: (i, node) => (i === 1 ? 0.5 : 0),
              vLineWidth: () => 0,
              hLineColor: (i) => (i === 1 ? '#0f172a' : '#ffffff'),
              paddingLeft: () => 0,
              paddingRight: () => 0,
              paddingTop: () => 4,
              paddingBottom: () => 4
            }
          },
          {
            columns: [
              { text: 'ИТОГО:', fontSize: 12, bold: true, color: '#0f172a', margin: [0, 15, 0, 0] },
              {
                text: `${totalSum.toLocaleString()} ₽`,
                fontSize: 14,
                bold: true,
                color: '#2563eb',
                alignment: 'right',
                margin: [0, 15, 0, 0]
              }
            ]
          }
        ]
      };

      pdfMake.createPdf(docDefinition).download(`Отгрузка_${new Date().toISOString().slice(0, 10)}.pdf`);
      showNotification('PDF успешно создан!', 'success');
    } catch (error) {
      console.error('PDF Error:', error);
      showNotification('Ошибка при создании PDF', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {notification && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
            <div className={`px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 border ${
              notification.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              <span>{notification.type === 'error' ? '️' : '✅'}</span>
              {notification.message}
            </div>
          </div>
        )}

        {/* Форма добавления */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Добавить позицию</h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Товар</label>
              <select
                value={selectedProduct.id}
                onChange={(e) => setSelectedProduct(availableProducts.find((p) => p.id === Number(e.target.value)))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer hover:bg-slate-100"
              >
                {availableProducts.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Кол-во</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-center hover:bg-slate-100"
              />
            </div>
            <div className="md:col-span-3 flex items-end">
              <button onClick={addToCart} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
                Добавить
              </button>
            </div>
          </div>
          <div className="mt-3 text-right">
            <span className="text-xs text-slate-400">Цена за ед.: </span>
            <span className="text-sm font-semibold text-slate-700">{selectedProduct.price.toLocaleString()} ₽</span>
          </div>
        </div>

        {/* Корзина */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Состав заказа</h2>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                Очистить всё
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="p-12 text-center animate-fade-in">
              <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-100">
                <div className="absolute inset-0 rounded-full bg-blue-500/5 animate-pulse" />
                <svg className="relative h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Список отгрузки пуст</h3>
              <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                Добавьте товары из каталога выше, чтобы сформировать документ и скачать PDF-файл
              </p>
            </div>
          ) : (
            <>
              <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                {cart.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50/80 transition-colors group animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-slate-800 truncate">{item.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{item.price.toLocaleString()} ₽ / шт.</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-blue-600 transition-colors text-sm font-bold">−</button>
                          <span className="w-8 text-center text-sm font-semibold text-slate-800">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-blue-600 transition-colors text-sm font-bold">+</button>
                        </div>
                        <span className="text-sm font-bold text-slate-800 min-w-[90px] text-right">{(item.price * item.quantity).toLocaleString()} ₽</span>
                        <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100" title="Удалить">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 bg-slate-50 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Итого к оплате</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">{totalSum.toLocaleString()} ₽</p>
                  </div>
                  <button
                    onClick={generatePDF}
                    disabled={isGenerating}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 ${
                      isGenerating ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5'
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Скачать PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Данные автоматически сохраняются в браузере
        </p>
      </div>
    </div>
  );
}