import React, { useState } from 'react'
import { X, Plus, PackageCheck } from 'lucide-react'

export default function OrderModal({ isOpen, onClose, onAddOrder }) {
  const [productName, setProductName] = useState('')
  const [sku, setSku] = useState('')
  const [quantity, setQuantity] = useState('500')
  const [workCenter, setWorkCenter] = useState('Line A · Welding')
  const [dueDate, setDueDate] = useState('Jun 18')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!productName.trim()) return

    const randomNum = Math.floor(10000 + Math.random() * 90000)
    const newOrder = {
      orderId: `PRD-${randomNum}`,
      productName: productName.trim(),
      sku: sku.trim() || `SKU-GEN-${Math.floor(100 + Math.random() * 900)}`,
      quantity: Number(quantity).toLocaleString(),
      workCenter,
      status: 'Running',
      statusColor: 'blue',
      dueDate,
    }

    onAddOrder(newOrder)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Create New Production Order</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Product Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Copper Earth Rod 16mm x 3m"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                SKU / Part Number
              </label>
              <input
                type="text"
                placeholder="SKU-ER-163"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Batch Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Work Center
              </label>
              <select
                value={workCenter}
                onChange={(e) => setWorkCenter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Line A · Welding">Line A · Welding</option>
                <option value="Line B · Stamping">Line B · Stamping</option>
                <option value="Line C · CNC Turning">Line C · CNC Turning</option>
                <option value="Line D · Galvanizing">Line D · Galvanizing</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Target Due Date
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#141d30] hover:bg-slate-800 text-white font-medium flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
