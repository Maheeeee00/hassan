import { useState } from 'react';
import { Eye, X, Printer } from 'lucide-react';
import { useApp } from '../context/useApp';

const invoicePayStatus = {
  Delivered: 'Paid',
  Processing: 'Pending',
  Pending: 'Unpaid',
  Shipped: 'Pending',
};

const invoiceStatusColors = {
  Paid: 'bg-green-900/30 text-green-400 border border-green-800',
  Pending: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800',
  Unpaid: 'bg-red-900/30 text-red-400 border border-red-800',
};

function InvoiceModal({ order, onClose }) {
  const invoiceNum = `INV-${order.id.replace('ORD-', '')}`;
  const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
          <h2 className="font-bold text-white">Invoice Preview</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Brand Header */}
          <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-black border-2 border-[#c9a84c] flex items-center justify-center">
                <span className="text-[#c9a84c] font-bold text-xl" style={{ fontFamily: 'serif' }}>𝒞</span>
              </div>
              <div>
                <p className="text-[#c9a84c] font-bold text-xs tracking-widest uppercase">The</p>
                <p className="text-white font-bold text-base">Customized</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[#c9a84c] font-bold text-lg">{invoiceNum}</p>
              <p className="text-xs text-gray-500">{order.date}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-1">Bill To</p>
              <p className="text-white font-medium">{order.customer}</p>
              <p className="text-gray-400">{order.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Order Reference</p>
              <p className="text-[#c9a84c] font-medium">{order.id}</p>
              <p className="text-gray-400 text-xs">Status: {order.status}</p>
            </div>
          </div>

          {/* Items */}
          <div className="border border-[#2a2a2a] rounded-xl overflow-hidden">
            <div className="grid grid-cols-4 px-4 py-2.5 bg-[#1a1a1a] text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-[#2a2a2a]">
              <span className="col-span-2">Item</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Amount</span>
            </div>
            {order.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-4 px-4 py-3 text-sm border-b border-[#2a2a2a] last:border-0">
                <span className="col-span-2 text-white">{item.name}</span>
                <span className="text-center text-gray-400">{item.qty}</span>
                <span className="text-right text-[#c9a84c] font-medium">Rs. {(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Delivery</span>
              <span>Rs. {(order.total - subtotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-white border-t border-[#2a2a2a] pt-2 mt-1">
              <span>Total</span>
              <span className="text-[#c9a84c] text-lg">Rs. {order.total.toLocaleString()}</span>
            </div>
          </div>

          <p className="text-center text-xs text-gray-600">Thank you for your order · The Customized</p>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] text-black py-2.5 rounded-xl text-sm font-bold hover:bg-[#e8c96a] transition-colors"
          >
            <Printer size={15} />
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Invoices() {
  const { orders } = useApp();
  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-500">{orders.length} invoice{orders.length !== 1 ? 's' : ''}</p>

      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden md:grid md:grid-cols-6 px-5 py-3 border-b border-[#2a2a2a] text-xs text-gray-500 font-medium uppercase tracking-wider">
          <span>Invoice #</span>
          <span className="col-span-2">Customer</span>
          <span>Date</span>
          <span>Amount</span>
          <span>Actions</span>
        </div>

        <div className="divide-y divide-[#2a2a2a]">
          {orders.map(order => {
            const invoiceNum = `INV-${order.id.replace('ORD-', '')}`;
            const payStatus = invoicePayStatus[order.status];
            return (
              <div key={order.id} className="px-5 py-3.5 hover:bg-[#1a1a1a] transition-colors">
                {/* Mobile */}
                <div className="md:hidden">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-[#c9a84c]">{invoiceNum}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${invoiceStatusColors[payStatus]}`}>
                      {payStatus}
                    </span>
                  </div>
                  <p className="text-sm text-white">{order.customer}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <p className="text-xs text-gray-500">{order.date}</p>
                      <p className="text-sm font-bold text-[#c9a84c]">Rs. {order.total.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center gap-1.5 text-xs text-[#c9a84c] border border-[#c9a84c]/30 px-3 py-1.5 rounded-lg hover:bg-[#c9a84c]/10 transition-colors"
                    >
                      <Eye size={12} /> View
                    </button>
                  </div>
                </div>

                {/* Desktop */}
                <div className="hidden md:grid md:grid-cols-6 items-center">
                  <span className="text-sm text-[#c9a84c] font-medium">{invoiceNum}</span>
                  <div className="col-span-2">
                    <p className="text-sm text-white">{order.customer}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${invoiceStatusColors[payStatus]}`}>
                      {payStatus}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">{order.date}</span>
                  <span className="text-sm font-semibold text-[#c9a84c]">Rs. {order.total.toLocaleString()}</span>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center gap-1.5 text-xs text-[#c9a84c] border border-[#c9a84c]/30 px-3 py-1.5 rounded-lg hover:bg-[#c9a84c]/10 transition-colors w-fit"
                  >
                    <Eye size={12} /> View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedOrder && (
        <InvoiceModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
