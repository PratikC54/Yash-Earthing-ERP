import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Search,
  Sparkles,
  UserCheck,
  Plus,
  Menu,
  Building2,
  X,
  ChevronRight,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Clock,
  Layers,
  Wrench,
  Loader2,
  FolderKanban,
  CheckCircle2,
  Boxes
} from 'lucide-react'
import { initialNavSections } from '../../data/navigationModules'
import { engineeringService } from '../../services/engineeringService'
import { module1Service } from '../../services/dataServices'
import authService from '../../services/authService'

export default function Navbar({
  activeModule = 'Dashboard',
  activeSubModule,
  onSearch,
  onScopeChange,
  isAdmin = false,
  user,
  onOpenAdminApprovals,
  onOpenTrace,
  onQuickAdd,
  onToggleSidebar,
  onToggleMobileSidebar,
  onNavigate,
}) {
  const [searchScope, setSearchScope] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0)

  useEffect(() => {
    if (!isAdmin) return
    let isMounted = true
    const checkPending = async () => {
      try {
        const res = await authService.getPendingUsers()
        if (isMounted && res?.data) {
          setPendingApprovalsCount(Array.isArray(res.data) ? res.data.length : 0)
        }
      } catch (err) {
        // silent
      }
    }
    checkPending()
    const interval = setInterval(checkPending, 30000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [isAdmin])

  const [liveResults, setLiveResults] = useState({
    products: [],
    leads: [],
    orders: [],
    loading: false
  })

  const searchContainerRef = useRef(null)
  const inputRef = useRef(null)

  const handleToggle = onToggleSidebar || onToggleMobileSidebar

  const handleScopeChange = (e) => {
    const val = e.target.value
    setSearchScope(val)
    if (onScopeChange) onScopeChange(val)
  }

  // Flatten all navigation module items for fast instant matching
  const allNavItems = useMemo(() => {
    const list = []
    ;(initialNavSections || []).forEach((sec) => {
      ;(sec.items || []).forEach((it) => {
        list.push({
          id: it.id,
          name: it.name,
          desc: it.desc || '',
          sectionTitle: sec.title,
          sectionId: sec.id,
        })
      })
    })
    return list
  }, [])

  const scopeSectionMap = {
    M1: 'module-1',
    M2: 'procurement',
    M3: 'module-3',
    M4: 'module-4',
    M5: 'module-5',
    M6: 'module-6',
    M7: 'hrms',
  }

  // Instant matching navigation items
  const matchedNavItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return []

    return allNavItems.filter((it) => {
      const matchScope =
        searchScope === 'ALL' ||
        it.sectionId === scopeSectionMap[searchScope] ||
        it.sectionTitle.toLowerCase().includes(searchScope.toLowerCase())

      if (!matchScope) return false

      return (
        it.name.toLowerCase().includes(term) ||
        it.desc.toLowerCase().includes(term) ||
        it.sectionTitle.toLowerCase().includes(term)
      )
    }).slice(0, 5)
  }, [searchTerm, searchScope, allNavItems])

  // Debounced search across Products, Leads, and Orders
  useEffect(() => {
    const term = searchTerm.trim()
    if (term.length < 2) {
      setLiveResults({ products: [], leads: [], orders: [], loading: false })
      return
    }

    let isMounted = true
    setLiveResults((prev) => ({ ...prev, loading: true }))

    const timer = setTimeout(async () => {
      try {
        const promises = []

        // Products (M3)
        if (searchScope === 'ALL' || searchScope === 'M3') {
          promises.push(
            engineeringService
              .getProducts({ search: term })
              .then((res) => ({
                type: 'products',
                data: Array.isArray(res?.data) ? res.data.slice(0, 5) : [],
              }))
              .catch(() => ({ type: 'products', data: [] }))
          )
        }

        // Leads (M1)
        if (searchScope === 'ALL' || searchScope === 'M1') {
          promises.push(
            module1Service
              .getLeads({ search: term, limit: 5 })
              .then((res) => ({
                type: 'leads',
                data: Array.isArray(res?.data?.leads)
                  ? res.data.leads.slice(0, 5)
                  : Array.isArray(res?.leads)
                  ? res.leads.slice(0, 5)
                  : [],
              }))
              .catch(() => ({ type: 'leads', data: [] }))
          )
        }

        // Orders (M1)
        if (searchScope === 'ALL' || searchScope === 'M1') {
          promises.push(
            module1Service
              .getOrders({ search: term, limit: 5 })
              .then((res) => {
                const raw =
                  res?.orders ||
                  res?.data?.orders ||
                  res?.data ||
                  (Array.isArray(res) ? res : [])
                return {
                  type: 'orders',
                  data: Array.isArray(raw) ? raw.slice(0, 5) : [],
                }
              })
              .catch(() => ({ type: 'orders', data: [] }))
          )
        }

        const resolved = await Promise.all(promises)
        if (!isMounted) return

        const next = { products: [], leads: [], orders: [], loading: false }
        resolved.forEach((r) => {
          if (r.type === 'products') next.products = r.data
          if (r.type === 'leads') next.leads = r.data
          if (r.type === 'orders') next.orders = r.data
        })

        setLiveResults(next)
      } catch (err) {
        if (isMounted) setLiveResults((prev) => ({ ...prev, loading: false }))
      }
    }, 220)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [searchTerm, searchScope])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    const val = e.target.value
    setSearchTerm(val)
    setIsDropdownOpen(true)
    if (onSearch) onSearch(val)
  }

  const handleClear = () => {
    setSearchTerm('')
    setIsDropdownOpen(false)
    if (onSearch) onSearch('')
    if (inputRef.current) inputRef.current.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false)
    } else if (e.key === 'Enter') {
      setIsDropdownOpen(false)
      if (onSearch) onSearch(searchTerm)
    }
  }

  const handleNavigateTo = (targetModuleId) => {
    setIsDropdownOpen(false)
    if (onNavigate) {
      onNavigate(targetModuleId)
    }
  }

  const totalResultsCount =
    matchedNavItems.length +
    liveResults.products.length +
    liveResults.leads.length +
    liveResults.orders.length

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-xs shrink-0 gap-2">
      {/* Mobile Menu Button + Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        {handleToggle && (
          <button
            type="button"
            onClick={handleToggle}
            className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition cursor-pointer shrink-0 active:scale-95"
            aria-label="Toggle Navigation"
            title="Open Navigation Drawer"
          >
            <Menu className="w-4 h-4 text-slate-800" />
          </button>
        )}

        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm truncate">
          <span className="hidden sm:inline text-slate-500 font-bold">
            Yash Group ERP
          </span>
          <span className="hidden sm:inline text-slate-300 font-bold">/</span>
          <span className="text-slate-900 font-black tracking-tight truncate">
            {activeModule}
          </span>
          {activeSubModule && activeSubModule !== activeModule && (
            <>
              <span className="text-slate-300 hidden sm:inline font-bold">/</span>
              <span className="text-emerald-700 font-extrabold truncate hidden sm:inline">
                {activeSubModule}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right Controls: Acid Theme Accurate Controls */}
      <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
        {/* Company & Management Role Badge */}
        <div className="hidden 2xl:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs shadow-xs">
          <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="font-extrabold text-slate-700">Management</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-[#d4ff00] text-black border border-lime-400 uppercase">
            {user?.role || 'ADMIN'}
          </span>
        </div>

        {/* Trace Job Action */}
        {onOpenTrace && (
          <button
            type="button"
            onClick={onOpenTrace}
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            title="Trace any job or customer order across ERP"
          >
            <Search className="w-3.5 h-3.5 text-slate-700 stroke-[2.5]" />
            <span className="hidden lg:inline">Trace Job</span>
          </button>
        )}

        {/* Quick Add (Acid Highlight Button) */}
        {onQuickAdd && (
          <button
            type="button"
            onClick={onQuickAdd}
            className="flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-[#d4ff00] hover:bg-[#bfe600] text-black text-xs font-black transition shadow-xs border border-lime-400 cursor-pointer active:scale-95 shrink-0"
            title="Quickly add customer lead or requirement"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Quick Add</span>
          </button>
        )}

        {/* Admin Approvals Quick Access with Live Pending Badge & Visible on Mobile */}
        {isAdmin && onOpenAdminApprovals && (
          <button
            type="button"
            onClick={onOpenAdminApprovals}
            className="relative flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-extrabold transition cursor-pointer active:scale-95 shadow-xs"
            title={pendingApprovalsCount > 0 ? `${pendingApprovalsCount} user(s) awaiting approval` : "Review pending user registrations"}
          >
            <UserCheck className="w-3.5 h-3.5 text-sky-700" />
            <span className="hidden sm:inline">Approvals</span>
            {pendingApprovalsCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-black bg-rose-600 text-white rounded-full ring-2 ring-white animate-pulse">
                {pendingApprovalsCount}
              </span>
            )}
          </button>
        )}

        {/* Search Bar with Integrated Module Scope Filter & Live Dropdown */}
        <div ref={searchContainerRef} className="relative">
          <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 shadow-inner w-44 sm:w-60 md:w-72 lg:w-80 focus-within:ring-2 focus-within:ring-[#d4ff00] focus-within:border-slate-400 transition-all">
            <select
              value={searchScope}
              onChange={handleScopeChange}
              className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-1.5 border-r border-slate-200 focus:outline-none cursor-pointer shrink-0 hidden md:block rounded-l-xl"
            >
              <option value="ALL">All Modules</option>
              <option value="M1">M1 · Sales</option>
              <option value="M2">M2 · Procurement</option>
              <option value="M3">M3 · Product</option>
              <option value="M4">M4 · Production</option>
              <option value="M5">M5 · Service</option>
              <option value="M6">M6 · Finance</option>
              <option value="M7">M7 · HRMS</option>
            </select>

            <div className="relative flex-1 flex items-center min-w-0 pr-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={() => setIsDropdownOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search SKU, Lead, Order, Module..."
                className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-xs pl-8 pr-6 py-1.5 focus:outline-none transition min-w-0 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-0.5 text-slate-400 hover:text-slate-700 rounded-md transition"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Floating Live Global Search Dropdown */}
          {isDropdownOpen && searchTerm.trim().length > 0 && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 md:w-[460px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[82vh] flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-100">
              {/* Header Info */}
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600 shrink-0">
                <span className="flex items-center space-x-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Search Results for "{searchTerm}"</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-700">
                  {searchScope}
                </span>
              </div>

              {/* Scrollable Results List */}
              <div className="overflow-y-auto divide-y divide-slate-100 p-2 space-y-2 text-xs">
                {/* 1. Module Navigation Shortcuts */}
                {matchedNavItems.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>ERP Module Shortcuts</span>
                      <span>Go to screen</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {matchedNavItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNavigateTo(item.id)}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center justify-between transition group cursor-pointer"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                              <Layers className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 truncate">
                              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                                {item.name}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {item.sectionTitle} {item.desc ? `· ${item.desc}` : ''}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Products & Master SKUs (M3) */}
                {liveResults.products.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-600 flex items-center justify-between">
                      <span>Products & SKUs (Module 3)</span>
                      <span>Product Master</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {liveResults.products.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleNavigateTo('m3-products')}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50/60 flex items-center justify-between transition group cursor-pointer"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                              <Package className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 truncate">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-blue-700 text-xs">
                                  {p.sku}
                                </span>
                                <span className="text-[11px] text-slate-800 font-semibold truncate">
                                  {p.name}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {p.material || p.categoryName || 'Product Master'} · ₹{Number(p.rate || 0).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 ml-2">
                            {p.status || 'ACTIVE'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Customers & Leads (M1) */}
                {liveResults.leads.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center justify-between">
                      <span>Customers & Leads (Module 1)</span>
                      <span>Sales & CRM</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {liveResults.leads.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => handleNavigateTo('leads')}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50/60 flex items-center justify-between transition group cursor-pointer"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                              <Users className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 truncate">
                              <div className="font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                                {l.customerName || l.contactPerson}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {l.phone || ''} {l.city ? `· ${l.city}` : ''} {l.leadCode ? `· ${l.leadCode}` : ''}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0 ml-2">
                            {l.stage || l.status || 'LEAD'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Sales Orders (M1) */}
                {liveResults.orders.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-purple-700 flex items-center justify-between">
                      <span>Sales Orders (Module 1)</span>
                      <span>Orders & Dispatch</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {liveResults.orders.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => handleNavigateTo('orders')}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-50/60 flex items-center justify-between transition group cursor-pointer"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 truncate">
                              <div className="font-mono font-bold text-purple-800">
                                {o.orderNo || o.customerPoNumber || `Order #${o.id}`}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {o.customerName || o.customer?.name || 'Customer Order'} · ₹{Number(o.totalAmount || 0).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0 ml-2">
                            {o.status || 'CONFIRMED'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading state indicator */}
                {liveResults.loading && (
                  <div className="p-3 text-center text-slate-500 flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    <span>Searching database records across ERP...</span>
                  </div>
                )}

                {/* Empty State */}
                {!liveResults.loading && totalResultsCount === 0 && (
                  <div className="p-6 text-center text-slate-500">
                    <Search className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No records found for "{searchTerm}"</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Try searching by SKU (e.g. ABC-7), customer name (e.g. Tata), or module name (e.g. BOM, Attendance, Inventory).
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Quick Action */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
                <span>Press <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Enter</kbd> to filter active page</span>
                <span>Press <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Esc</kbd> to close</span>
              </div>
            </div>
          )}
        </div>

        {/* System Active Indicator */}
        <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 shadow-xs font-black">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Active</span>
        </div>
      </div>
    </header>
  )
}
