import { createContext, useState } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext();

const sampleProducts = [
  { id: 1, name: 'Custom Embroidered Hoodie', category: 'Clothing', price: 2500, stock: 15, image: null, description: 'Premium quality hoodie with custom embroidery' },
  { id: 2, name: 'Personalized Mug', category: 'Accessories', price: 450, stock: 42, image: null, description: 'Ceramic mug with custom print' },
  { id: 3, name: 'Custom T-Shirt', category: 'Clothing', price: 1200, stock: 30, image: null, description: 'Cotton t-shirt with personalized design' },
  { id: 4, name: 'Engraved Keychain', category: 'Accessories', price: 350, stock: 80, image: null, description: 'Metal keychain with laser engraving' },
];

const sampleOrders = [
  { id: 'ORD-001', customer: 'Ahmed Hassan', phone: '03001234567', date: '2026-04-10', status: 'Delivered', total: 3200, items: [{ productId: 1, name: 'Custom Embroidered Hoodie', qty: 1, price: 2500 }, { productId: 2, name: 'Personalized Mug', qty: 1, price: 450 }, { productId: 4, name: 'Engraved Keychain', qty: 1, price: 350 }] },
  { id: 'ORD-002', customer: 'Sara Malik', phone: '03111234567', date: '2026-04-12', status: 'Processing', total: 2400, items: [{ productId: 3, name: 'Custom T-Shirt', qty: 2, price: 1200 }] },
  { id: 'ORD-003', customer: 'Usman Ali', phone: '03211234567', date: '2026-04-14', status: 'Pending', total: 1800, items: [{ productId: 1, name: 'Custom Embroidered Hoodie', qty: 1, price: 2500 }] },
  { id: 'ORD-004', customer: 'Fatima Khan', phone: '03451234567', date: '2026-04-15', status: 'Shipped', total: 900, items: [{ productId: 2, name: 'Personalized Mug', qty: 2, price: 450 }] },
];

export function AppProvider({ children }) {
  const [products, setProducts] = useState(sampleProducts);
  const [orders, setOrders] = useState(sampleOrders);

  const addProduct = (product) => {
    setProducts(prev => [...prev, { ...product, id: Date.now() }]);
  };

  const updateProduct = (id, updates) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateOrderStatus = (id, status) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  return (
    <AppContext.Provider value={{ products, orders, addProduct, updateProduct, deleteProduct, updateOrderStatus }}>
      {children}
    </AppContext.Provider>
  );
}
