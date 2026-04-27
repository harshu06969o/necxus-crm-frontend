import { useEffect, useMemo, useState } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { jwtDecode } from 'jwt-decode'
import {
  BarChart3,
  CircleUser,
  FileText,
  Grip,
  LayoutDashboard,
  Mail,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  LogOut,
  Search,
  Settings,
  Tag,
  TicketPlus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import {
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  addCustomer,
  addTicket,
  deleteCustomer,
  getCustomers,
  loginUser,
  updateCustomer,
} from './api'

const STATUS_OPTIONS = ['LEAD', 'ACTIVE', 'CHURNED']

function cx(...xs) {
  return xs.filter(Boolean).join(' ')
}

function safeBusinessMessage(err) {
  if (err?.status === 400) return err.message
  return err?.message || 'Something went wrong'
}

function extractRoleFromToken(token) {
  if (!token) return null
  try {
    const decoded = jwtDecode(token)
    const directRole = decoded?.role ?? decoded?.roles ?? decoded?.authorities
    const nestedRole =
      decoded?.user?.role ?? decoded?.user?.roles ?? decoded?.user?.authorities
    const roleSource = directRole ?? nestedRole

    if (Array.isArray(roleSource)) return roleSource[0] ?? null
    if (typeof roleSource === 'string') return roleSource
    return null
  } catch {
    return null
  }
}

function extractUsernameFromToken(token) {
  if (!token) return null
  try {
    const decoded = jwtDecode(token)
    return (
      decoded?.username ??
      decoded?.sub ??
      decoded?.email ??
      decoded?.user?.username ??
      decoded?.user?.email ??
      null
    )
  } catch {
    return null
  }
}

function normalizeRole(role) {
  if (!role) return ''
  return String(role).toUpperCase()
}

function getCustomerTimestamp(customer) {
  const raw =
    customer?.createdAt ??
    customer?.created_at ??
    customer?.createdDate ??
    customer?.dateCreated ??
    customer?.createdOn
  if (!raw) return null
  const ts = new Date(raw).getTime()
  return Number.isNaN(ts) ? null : ts
}

function relativeTime(ts) {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'Just now'
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))}h ago`
  return new Date(ts).toLocaleString()
}

function Card({ className, ...props }) {
  return (
    <div
      {...props}
      className={cx(
        'rounded-2xl border border-zinc-800/70 bg-zinc-950/40 shadow-xl shadow-black/20 backdrop-blur',
        className,
      )}
    />
  )
}

function IconButton({ title, tone = 'zinc', className, ...props }) {
  const tones = {
    zinc: 'text-zinc-300 hover:text-zinc-100',
    blue: 'text-sky-300 hover:text-sky-200',
    red: 'text-rose-300 hover:text-rose-200',
  }
  return (
    <button
      type="button"
      title={title}
      {...props}
      className={cx(
        'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800/70 bg-zinc-950/30 transition hover:bg-zinc-900/50',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70',
        tones[tone] ?? tones.zinc,
        className,
      )}
    />
  )
}

function Button({ variant = 'primary', className, ...props }) {
  const variants = {
    primary:
      'bg-sky-500 text-white hover:bg-sky-400 active:bg-sky-500/90 shadow-sm shadow-sky-500/20',
    secondary:
      'bg-zinc-950/30 text-zinc-100 hover:bg-zinc-900/50 border border-zinc-800/70',
    ghost:
      'bg-transparent text-zinc-200 hover:bg-zinc-900/40 border border-zinc-800/70',
  }
  return (
    <button
      {...props}
      className={cx(
        'inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
    />
  )
}

function Input({ hasIcon, className, ...props }) {
  return (
    <input
      {...props}
      className={cx(
        'h-10 w-full rounded-xl border border-zinc-800/70 bg-zinc-950/35 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition',
        'focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20',
        hasIcon ? 'pl-10' : '',
        className,
      )}
    />
  )
}

function Select({ className, ...props }) {
  return (
    <select
      {...props}
      className={cx(
        'h-10 w-full rounded-xl border border-zinc-800/70 bg-zinc-950/35 px-3 text-sm text-zinc-100 outline-none transition',
        'focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20',
        className,
      )}
    />
  )
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-200">
        {label}
      </span>
      <div className="relative">
        {Icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <Icon size={16} />
          </span>
        ) : null}
        {children}
      </div>
    </label>
  )
}

function StatusPill({ status }) {
  const s = String(status ?? 'UNKNOWN').toUpperCase()
  const styles = {
    LEAD: 'border-sky-500/25 bg-sky-500/15 text-sky-100',
    ACTIVE: 'border-emerald-500/25 bg-emerald-500/15 text-emerald-100',
    CHURNED: 'border-rose-500/25 bg-rose-500/15 text-rose-100',
    UNKNOWN: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-200',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        styles[s] ?? styles.UNKNOWN,
      )}
    >
      {s}
    </span>
  )
}

function Modal({ open, title, subtitle, children, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-950/85 shadow-2xl shadow-black/60 backdrop-blur">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800/70 px-6 py-5">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-extrabold text-zinc-100">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
            ) : null}
          </div>
          <IconButton title="Close" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, trend }) {
  const trendPill =
    trend === 'up'
      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
      : trend === 'down'
        ? 'border-rose-500/20 bg-rose-500/10 text-rose-200'
        : 'border-zinc-500/20 bg-zinc-500/10 text-zinc-200'
  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Tag

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-200">{title}</div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-950/30 ring-1 ring-zinc-800/70">
          <Icon size={18} className="text-sky-300" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-extrabold text-zinc-100">{value}</div>
      <div className="mt-3">
        <span
          className={cx(
            'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold',
            trendPill,
          )}
        >
          <TrendIcon size={14} />
          Stable
        </span>
      </div>
    </Card>
  )
}

function EmptyState({ onCreate }) {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4">
        <svg
          width="260"
          height="160"
          viewBox="0 0 260 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-95"
          aria-hidden="true"
        >
          <path
            d="M34 122c0-25 20-45 45-45h102c25 0 45 20 45 45v10H34v-10Z"
            stroke="rgba(161,161,170,0.55)"
            strokeWidth="2"
          />
          <path
            d="M91 77c0-21 17-38 38-38s38 17 38 38"
            stroke="rgba(56,189,248,0.55)"
            strokeWidth="2"
          />
          <path d="M18 140h224" stroke="rgba(63,63,70,0.9)" strokeWidth="2" />
          <circle cx="129" cy="42" r="7" fill="rgba(56,189,248,0.7)" />
          <circle cx="182" cy="96" r="5" fill="rgba(99,102,241,0.6)" />
          <circle cx="78" cy="102" r="5" fill="rgba(52,211,153,0.35)" />
        </svg>
        <div className="text-lg font-extrabold text-zinc-100">
          No records found
        </div>
        <div className="text-sm text-zinc-500">
          Create your first customer or refine your search filters.
        </div>
        <Button onClick={onCreate}>
          <Plus size={16} />
          New Customer
        </Button>
      </div>
    </div>
  )
}

function ActivityTitle({ type }) {
  const title =
    type === 'customer.create'
      ? 'New Customer Added'
      : type === 'customer.update'
        ? 'Customer Updated'
        : type === 'customer.delete'
          ? 'Customer Deleted'
          : type === 'ticket.create'
            ? 'Ticket Created'
            : 'Activity'
  return <span className="text-sm font-semibold text-zinc-100">{title}</span>
}

function Login({ onLogin, loading }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    await onLogin(username.trim(), password)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_15%_-10%,rgba(56,189,248,0.2),transparent_60%),radial-gradient(1200px_600px_at_85%_-15%,rgba(99,102,241,0.18),transparent_58%)] p-4">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4200,
          style: {
            background: 'rgba(9,9,11,0.95)',
            color: '#fafafa',
            border: '1px solid rgba(39,39,42,1)',
          },
        }}
      />

      <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center">
        <Card className="w-full p-7 md:p-8">
          <div className="mb-6">
            <div className="text-2xl font-extrabold text-zinc-100">Nexus CRM</div>
            <p className="mt-1 text-sm text-zinc-400">
              Secure access to your enterprise workspace.
            </p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <Field label="Username" icon={CircleUser}>
              <Input
                hasIcon
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </Field>

            <Field label="Password" icon={Tag}>
              <Input
                hasIcon
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </Field>

            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function App() {
  const initialToken = localStorage.getItem('token')
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialToken))
  const [userRole, setUserRole] = useState(() => extractRoleFromToken(initialToken))
  const [username, setUsername] = useState(() => extractUsernameFromToken(initialToken))
  const [authLoading, setAuthLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [customers, setCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 10

  const [globalQuery, setGlobalQuery] = useState('')
  const [tableQuery, setTableQuery] = useState('')

  const [activity, setActivity] = useState([])

  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [editingCustomerId, setEditingCustomerId] = useState(null)
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'ACTIVE',
  })
  const [savingCustomer, setSavingCustomer] = useState(false)

  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [ticketCustomer, setTicketCustomer] = useState(null)
  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    priority: 'NORMAL',
  })
  const [savingTicket, setSavingTicket] = useState(false)

  const [openMenuFor, setOpenMenuFor] = useState(null)
  const normalizedUserRole = normalizeRole(userRole)
  const canDeleteCustomer =
    normalizedUserRole === 'ROLE_ADMIN' || normalizedUserRole === 'ADMIN'
  const roleBadgeLabel = normalizedUserRole.startsWith('ROLE_')
    ? normalizedUserRole.slice(5)
    : normalizedUserRole || 'UNKNOWN'

  function pushActivity(type, message) {
    setActivity((prev) => {
      const item = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ts: Date.now(),
        type,
        message,
      }
      return [item, ...prev].slice(0, 25)
    })
  }

  async function refreshCustomers({ silent = false, page = currentPage } = {}) {
    setLoadingCustomers(true)
    try {
      const data = await getCustomers(page, pageSize)
      const content = Array.isArray(data?.content) ? data.content : []
      const pageInfo = data?.page ?? {}
      const safeTotalPages = Math.max(1, Number(pageInfo?.totalPages ?? 1))
      const safePageNumber = Number.isFinite(Number(pageInfo?.number))
        ? Number(pageInfo.number)
        : page

      setCustomers(content)
      setCurrentPage(safePageNumber)
      setTotalPages(safeTotalPages)
      pushActivity('customer.update', 'Customer list refreshed')
      if (!silent) toast.success('Customers loaded')
    } catch (e) {
      toast.error(safeBusinessMessage(e))
    } finally {
      setLoadingCustomers(false)
    }
  }

  async function fetchCustomers(options) {
    await refreshCustomers(options)
  }

  useEffect(() => {
    if (!isAuthenticated) return
    refreshCustomers({ silent: true, page: currentPage })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, isAuthenticated])

  useEffect(() => {
    const onDown = (e) => {
      if (!openMenuFor) return
      if (e.target?.closest?.('[data-menu-root="true"]')) return
      setOpenMenuFor(null)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [openMenuFor])

  const summary = useMemo(() => {
    const total = customers.length
    const active = customers.filter((c) => String(c?.status ?? '').toUpperCase() === 'ACTIVE').length
    const churned = customers.filter((c) => String(c?.status ?? '').toUpperCase() === 'CHURNED').length
    const leads = customers.filter((c) => String(c?.status ?? '').toUpperCase() === 'LEAD').length
    return { total, active, churned, leads }
  }, [customers])

  const filteredCustomers = useMemo(() => {
    const q = `${globalQuery} ${tableQuery}`.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => {
      const hay =
        `${c?.name ?? ''} ${c?.email ?? ''} ${c?.phone ?? ''} ${c?.status ?? ''} ${c?.id ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [customers, globalQuery, tableQuery])

  const chartGrowth = useMemo(() => {
    const now = new Date()
    const currentWeekStart = new Date(now)
    currentWeekStart.setDate(now.getDate() - now.getDay())
    currentWeekStart.setHours(0, 0, 0, 0)

    const points = Array.from({ length: 12 }).map((_, i) => {
      const weekStart = new Date(currentWeekStart)
      weekStart.setDate(currentWeekStart.getDate() - (11 - i) * 7)
      return {
        period: `W${i + 1}`,
        start: weekStart.getTime(),
        customers: 0,
      }
    })

    customers.forEach((customer) => {
      const ts = getCustomerTimestamp(customer)
      if (!ts) return
      const idx = Math.floor((ts - points[0].start) / (7 * 24 * 60 * 60 * 1000))
      if (idx >= 0 && idx < points.length) {
        points[idx].customers += 1
      }
    })

    // Fallback when backend does not provide creation timestamps.
    if (points.every((p) => p.customers === 0)) {
      points[points.length - 1].customers = customers.length
    }

    return points.map(({ period, customers: value }) => ({
      period,
      customers: value,
    }))
  }, [customers])

  const chartStatus = useMemo(() => {
    return [
      { name: 'LEAD', value: summary.leads, color: '#38bdf8' },
      { name: 'ACTIVE', value: summary.active, color: '#34d399' },
      { name: 'CHURNED', value: summary.churned, color: '#fb7185' },
    ]
  }, [summary])

  const reportBars = useMemo(
    () => [
      { month: 'Jan', value: 18 },
      { month: 'Feb', value: 26 },
      { month: 'Mar', value: 21 },
      { month: 'Apr', value: 33 },
      { month: 'May', value: 29 },
      { month: 'Jun', value: 37 },
    ],
    [],
  )

  function openNewCustomer() {
    setEditingCustomerId(null)
    setCustomerForm({ name: '', email: '', phone: '', status: 'ACTIVE' })
    setCustomerModalOpen(true)
  }

  function openEditCustomer(c) {
    setEditingCustomerId(c?.id ?? null)
    setCustomerForm({
      name: c?.name ?? '',
      email: c?.email ?? '',
      phone: c?.phone ?? '',
      status: String(c?.status ?? 'ACTIVE').toUpperCase(),
    })
    setCustomerModalOpen(true)
  }

  async function onSaveCustomer(e) {
    e.preventDefault()
    setSavingCustomer(true)
    try {
      const payload = {
        name: customerForm.name.trim(),
        email: customerForm.email.trim(),
        phone: customerForm.phone.trim(),
        status: customerForm.status.toUpperCase(),
      }

      if (editingCustomerId != null) {
        await updateCustomer(editingCustomerId, payload)
        toast.success('Customer updated')
        pushActivity('customer.update', `${payload.name} updated`)
      } else {
        try {
          await addCustomer(payload)
        } catch (err) {
          window.alert(safeBusinessMessage(err))
          return
        }
        toast.success('Customer created')
        pushActivity('customer.create', `${payload.name} created`)
        setCustomerForm({ name: '', email: '', phone: '', status: 'ACTIVE' })
      }

      await fetchCustomers({ silent: true })
      setCustomerModalOpen(false)
    } catch (err) {
      toast.error(safeBusinessMessage(err))
    } finally {
      setSavingCustomer(false)
    }
  }

  async function onDeleteCustomer(c) {
    const id = c?.id
    if (id == null) return toast.error('Missing customer id')

    const ok = window.confirm(
      `Delete customer "${c?.name ?? ''}"? This cannot be undone.`,
    )
    if (!ok) return

    try {
      await deleteCustomer(id)
      toast.success('Customer deleted')
      pushActivity('customer.delete', `${c?.name ?? 'Customer'} deleted`)
      await refreshCustomers({ silent: true })
    } catch (err) {
      toast.error(safeBusinessMessage(err))
    }
  }

  function openTicket(c) {
    setTicketCustomer(c)
    setTicketForm({ title: '', description: '', priority: 'NORMAL' })
    setTicketModalOpen(true)
  }

  async function onCreateTicket(e) {
    e.preventDefault()
    if (!ticketCustomer) return
    setSavingTicket(true)
    try {
      await addTicket({
        customerId: ticketCustomer.id,
        title: ticketForm.title.trim(),
        description: ticketForm.description.trim(),
        priority: ticketForm.priority,
      })
      toast.success('Ticket created')
      pushActivity(
        'ticket.create',
        `Ticket created for ${ticketCustomer?.name ?? 'customer'}`,
      )
      setTicketModalOpen(false)
    } catch (err) {
      toast.error(safeBusinessMessage(err))
    } finally {
      setSavingTicket(false)
    }
  }

  function goToPreviousPage() {
    if (currentPage <= 0 || loadingCustomers) return
    setCurrentPage((prev) => Math.max(prev - 1, 0))
  }

  function goToNextPage() {
    if (loadingCustomers || currentPage >= totalPages - 1) return
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
  }

  async function handleLogin(username, password) {
    setAuthLoading(true)
    try {
      const response = await loginUser(username, password)
      // eslint-disable-next-line no-console
      console.log('Full Response:', response.data)
      const token = response.data.token

      if (!token) throw new Error('Login succeeded but token was not returned')
      localStorage.setItem('token', token)
      setIsAuthenticated(true)
      setUserRole(extractRoleFromToken(token))
      setUsername(extractUsernameFromToken(token))
      toast.success('Welcome back')
      setCurrentPage(0)
    } catch (err) {
      toast.error(safeBusinessMessage(err))
    } finally {
      setAuthLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
    setUserRole(null)
    setUsername(null)
    setCustomers([])
    setCurrentPage(0)
    setTotalPages(1)
    toast.success('Logged out')
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} loading={authLoading} />
  }

  const sidebarItems = [
    { key: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'Customers', label: 'Customers', icon: Users },
    { key: 'Reports', label: 'Reports', icon: FileText },
    { key: 'Settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-full bg-[radial-gradient(1400px_700px_at_12%_-10%,rgba(56,189,248,0.22),transparent_60%),radial-gradient(1100px_600px_at_88%_-20%,rgba(99,102,241,0.18),transparent_55%)]">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4200,
          style: {
            background: 'rgba(9,9,11,0.95)',
            color: '#fafafa',
            border: '1px solid rgba(39,39,42,1)',
          },
        }}
      />

      {/* Top Navbar */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-zinc-800/70 bg-zinc-950/70 backdrop-blur">
        <div className="flex h-16 w-full items-center gap-4 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-950/30 ring-1 ring-zinc-800/70">
              <BarChart3 size={18} className="text-sky-300" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-wide text-zinc-100">
                Nexus CRM
              </div>
              <div className="text-xs text-zinc-500">
                Global Relationship Suite
              </div>
            </div>
          </div>

          <div className="mx-auto hidden w-full max-w-3xl md:block">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <Search size={16} />
              </span>
              <Input
                hasIcon
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                placeholder="Search customers, emails, phones…"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1 text-xs font-semibold text-zinc-200">
              Logged in as: {roleBadgeLabel}
            </span>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </Button>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 ring-1 ring-zinc-700">
              <span className="text-sm font-bold text-zinc-100">HC</span>
            </div>
          </div>
        </div>
      </header>

      {/* Full-width shell */}
      <div className="grid grid-cols-1 gap-4 px-4 pb-8 pt-20 md:grid-cols-[auto_1fr] md:px-6">
        {/* Sidebar */}
        <aside
          className={cx(
            'h-[calc(100vh-88px)] md:sticky md:top-20',
            sidebarCollapsed ? 'w-[78px]' : 'w-[300px]',
          )}
        >
          <Card className="h-full p-3">
            <div className="flex items-center justify-between gap-2 px-1 py-1">
              <div
                className={cx('min-w-0', sidebarCollapsed ? 'hidden' : 'block')}
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Workspace
                </div>
                <div className="mt-0.5 truncate text-sm font-semibold text-zinc-100">
                  Nexus CRM
                </div>
              </div>
              <IconButton
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                onClick={() => setSidebarCollapsed((v) => !v)}
                className="ml-auto"
              >
                <Grip size={16} />
              </IconButton>
            </div>

            <nav className="mt-3 space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                const active = activeTab === item.key
                const tooltip = sidebarCollapsed ? item.label : null
                return (
                  <div key={item.key} className="group relative">
                    <button
                      type="button"
                      onClick={() => setActiveTab(item.key)}
                      className={cx(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition',
                        active
                          ? 'bg-zinc-900/60 text-zinc-100 ring-1 ring-zinc-800/70'
                          : 'text-zinc-300 hover:bg-zinc-900/40',
                        sidebarCollapsed ? 'justify-center' : '',
                      )}
                    >
                      <Icon size={16} className="text-zinc-400" />
                      {!sidebarCollapsed ? <span>{item.label}</span> : null}
                    </button>
                    {tooltip ? (
                      <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-zinc-800/70 bg-zinc-950/95 px-2.5 py-1 text-xs font-semibold text-zinc-100 opacity-0 shadow-xl shadow-black/40 backdrop-blur group-hover:opacity-100">
                        {tooltip}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </nav>

            {!sidebarCollapsed ? (
              <div className="mt-4 rounded-xl border border-zinc-800/70 bg-zinc-950/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-zinc-300">Records</div>
                  <div className="text-xs text-zinc-400">{customers.length}</div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/20 p-2">
                    <div className="text-zinc-500">LEAD</div>
                    <div className="mt-1 font-semibold text-sky-100">
                      {summary.leads}
                    </div>
                  </div>
                  <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/20 p-2">
                    <div className="text-zinc-500">ACTIVE</div>
                    <div className="mt-1 font-semibold text-emerald-100">
                      {summary.active}
                    </div>
                  </div>
                  <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/20 p-2">
                    <div className="text-zinc-500">CHURN</div>
                    <div className="mt-1 font-semibold text-rose-100">
                      {summary.churned}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </Card>
        </aside>

        {/* Main */}
        <main className="min-w-0 space-y-4">
          <Card className="p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-xl font-extrabold text-zinc-100">
                  {activeTab}
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  Operate your customer lifecycle with clarity and velocity.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => refreshCustomers()}
                  disabled={loadingCustomers}
                >
                  <RefreshCw size={16} />
                  {loadingCustomers ? 'Refreshing…' : 'Refresh'}
                </Button>
                {activeTab === 'Customers' ? (
                  <Button onClick={openNewCustomer}>
                    <Plus size={16} /> New Customer
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>

          {activeTab === 'Dashboard' ? (
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                  <MetricCard title="Total Customers" value={summary.total} icon={Users} trend="up" />
                  <MetricCard title="Active" value={summary.active} icon={Tag} trend="up" />
                  <MetricCard title="Lead" value={summary.leads} icon={Tag} trend="up" />
                  <MetricCard title="Churned" value={summary.churned} icon={Tag} trend="down" />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Card className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-zinc-100">
                          Customer Growth
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          Trendline overview
                        </div>
                      </div>
                      <span className="text-xs text-zinc-500">Last 12 weeks</span>
                    </div>
                    <div className="mt-4 h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartGrowth}>
                          <XAxis
                            dataKey="period"
                            stroke="rgba(161,161,170,0.55)"
                            tickLine={false}
                            axisLine={false}
                            fontSize={12}
                          />
                          <YAxis
                            stroke="rgba(161,161,170,0.55)"
                            tickLine={false}
                            axisLine={false}
                            fontSize={12}
                          />
                          <ReTooltip
                            contentStyle={{
                              background: 'rgba(9,9,11,0.95)',
                              border: '1px solid rgba(39,39,42,1)',
                              borderRadius: 12,
                              color: '#fafafa',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="customers"
                            stroke="#38bdf8"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <div className="text-sm font-extrabold text-zinc-100">
                      Status Distribution
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Current lifecycle split
                    </div>
                    <div className="mt-4 h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartStatus}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={3}
                          >
                            {chartStatus.map((e) => (
                              <Cell key={e.name} fill={e.color} />
                            ))}
                          </Pie>
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            wrapperStyle={{ color: 'rgba(161,161,170,0.85)' }}
                          />
                          <ReTooltip
                            contentStyle={{
                              background: 'rgba(9,9,11,0.95)',
                              border: '1px solid rgba(39,39,42,1)',
                              borderRadius: 12,
                              color: '#fafafa',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              </div>

              <aside className="min-w-0">
                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-extrabold text-zinc-100">
                      Recent Activity
                    </div>
                    <span className="text-xs text-zinc-500">{activity.length}</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {activity.length === 0 ? (
                      <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/20 p-3 text-sm text-zinc-500">
                        No recent activity yet.
                      </div>
                    ) : (
                      activity.slice(0, 10).map((a) => (
                        <div
                          key={a.id}
                          className="rounded-xl border border-zinc-800/70 bg-zinc-950/20 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <ActivityTitle type={a.type} />
                              <div className="mt-1 truncate text-xs text-zinc-500">
                                {a.message}
                              </div>
                            </div>
                            <div className="shrink-0 text-xs text-zinc-500">
                              {relativeTime(a.ts)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </aside>
            </section>
          ) : activeTab === 'Customers' ? (
            <section className="min-w-0">
              <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-zinc-800/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-zinc-100">
                      Customers
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {loadingCustomers ? 'Loading…' : `${filteredCustomers.length} results`}
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
                    <div className="relative w-full sm:w-[420px]">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                        <Search size={16} />
                      </span>
                      <Input
                        hasIcon
                        value={tableQuery}
                        onChange={(e) => setTableQuery(e.target.value)}
                        placeholder="Quick search & filter…"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 bg-zinc-950/80 backdrop-blur">
                      <tr className="text-xs uppercase tracking-wide text-zinc-500">
                        <th className="px-5 py-3 font-medium">Customer</th>
                        <th className="px-5 py-3 font-medium">Email</th>
                        <th className="px-5 py-3 font-medium">Phone</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70">
                      {filteredCustomers.map((c) => (
                        <tr
                          key={c.id ?? `${c.email}-${c.phone}`}
                          className="transition hover:bg-zinc-900/25"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-950/30 ring-1 ring-zinc-800/70">
                                <CircleUser size={16} className="text-zinc-300" />
                              </div>
                              <div className="min-w-0">
                                <div className="truncate font-semibold text-zinc-100">
                                  {c.name ?? '—'}
                                </div>
                                <div className="truncate text-xs text-zinc-500">
                                  ID: {c.id ?? '—'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-zinc-300">{c.email ?? '—'}</td>
                          <td className="px-5 py-4 text-zinc-300">{c.phone ?? '—'}</td>
                          <td className="px-5 py-4">
                            <StatusPill status={c.status} />
                          </td>
                          <td className="relative px-5 py-4 text-right">
                            <div className="inline-flex items-center justify-end gap-2">
                              <IconButton
                                title="Actions"
                                onClick={() => setOpenMenuFor((v) => (v === c.id ? null : c.id))}
                              >
                                <MoreVertical size={16} />
                              </IconButton>
                            </div>

                            {openMenuFor === c.id ? (
                              <div
                                data-menu-root="true"
                                className="absolute right-5 top-[52px] z-30 w-56 overflow-hidden rounded-xl border border-zinc-800/70 bg-zinc-950/95 shadow-2xl shadow-black/50 backdrop-blur"
                              >
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900/60"
                                  onClick={() => {
                                    setOpenMenuFor(null)
                                    openTicket(c)
                                  }}
                                >
                                  <TicketPlus size={16} className="text-sky-300" />
                                  Create ticket
                                </button>
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900/60"
                                  onClick={() => {
                                    setOpenMenuFor(null)
                                    openEditCustomer(c)
                                  }}
                                >
                                  <Pencil size={16} className="text-sky-300" />
                                  Edit
                                </button>
                                {canDeleteCustomer ? (
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-200 hover:bg-zinc-900/60"
                                  onClick={() => {
                                    setOpenMenuFor(null)
                                    onDeleteCustomer(c)
                                  }}
                                >
                                  <Trash2 size={16} className="text-rose-300" />
                                  Delete
                                </button>
                                ) : null}
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      ))}

                      {!loadingCustomers && filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={5}>
                            <EmptyState onCreate={openNewCustomer} />
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-800/70 px-5 py-4 sm:flex-row">
                  <div className="text-sm font-medium text-zinc-400">
                    Page{' '}
                    <span className="font-semibold text-zinc-100">
                      {Math.min(currentPage + 1, totalPages)}
                    </span>{' '}
                    of <span className="font-semibold text-zinc-100">{totalPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={goToPreviousPage}
                      disabled={loadingCustomers || currentPage <= 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={goToNextPage}
                      disabled={loadingCustomers || currentPage >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </Card>
            </section>
          ) : activeTab === 'Reports' ? (
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
            {(() => {
              // Live Math Calculations
              const activeCount = customers.filter(c => c.status === 'ACTIVE').length;
              const leadCount = customers.filter(c => c.status === 'LEAD').length;
              const churnedCount = customers.filter(c => c.status === 'CHURNED').length;
              const totalRevenue = activeCount * 1250;
              const churnRate = customers.length > 0 ? ((churnedCount / customers.length) * 100).toFixed(1) : 0;
  
              return (
                <>
                  {/* Left Side: Live Bar Chart */}
                  <Card className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-zinc-100">Customer Lifecycle</div>
                        <div className="mt-1 text-xs text-zinc-500">Live distribution of customer status</div>
                      </div>
                    </div>
                    <div className="mt-6 rounded-xl border border-zinc-800/70 bg-zinc-950/30 p-4">
                      <div className="flex h-56 items-end justify-around gap-3">
                        
                        {/* LEAD Bar */}
                        <div className="flex w-full flex-col items-center gap-2">
                          <div className="text-xs font-semibold text-zinc-400">{leadCount}</div>
                          <div className="relative flex w-full max-w-12 items-end rounded-lg bg-zinc-900/60 ring-1 ring-inset ring-white/5" style={{ height: '160px' }}>
                            <div 
                              className="w-full rounded-lg bg-gradient-to-t from-sky-600 to-sky-400 shadow-lg shadow-sky-900/20 transition-all duration-500" 
                              style={{ height: `${customers.length ? Math.max(8, (leadCount / customers.length) * 100) : 8}%` }} 
                            />
                          </div>
                          <div className="mt-2 text-xs font-medium text-zinc-500">LEAD</div>
                        </div>
  
                        {/* ACTIVE Bar */}
                        <div className="flex w-full flex-col items-center gap-2">
                          <div className="text-xs font-semibold text-zinc-400">{activeCount}</div>
                          <div className="relative flex w-full max-w-12 items-end rounded-lg bg-zinc-900/60 ring-1 ring-inset ring-white/5" style={{ height: '160px' }}>
                            <div 
                              className="w-full rounded-lg bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-lg shadow-emerald-900/20 transition-all duration-500" 
                              style={{ height: `${customers.length ? Math.max(8, (activeCount / customers.length) * 100) : 8}%` }} 
                            />
                          </div>
                          <div className="mt-2 text-xs font-medium text-zinc-500">ACTIVE</div>
                        </div>
  
                        {/* CHURNED Bar */}
                        <div className="flex w-full flex-col items-center gap-2">
                          <div className="text-xs font-semibold text-zinc-400">{churnedCount}</div>
                          <div className="relative flex w-full max-w-12 items-end rounded-lg bg-zinc-900/60 ring-1 ring-inset ring-white/5" style={{ height: '160px' }}>
                            <div 
                              className="w-full rounded-lg bg-gradient-to-t from-red-600 to-red-400 shadow-lg shadow-red-900/20 transition-all duration-500" 
                              style={{ height: `${customers.length ? Math.max(8, (churnedCount / customers.length) * 100) : 8}%` }} 
                            />
                          </div>
                          <div className="mt-2 text-xs font-medium text-zinc-500">CHURNED</div>
                        </div>
  
                      </div>
                    </div>
                  </Card>
  
                  {/* Right Side: Live Metrics Summary */}
                  <Card className="flex flex-col p-5">
                    <div className="text-sm font-extrabold text-zinc-100">Metrics Summary</div>
                    <div className="mt-1 text-xs text-zinc-500 mb-6">Business health snapshot</div>
                    
                    <div className="space-y-4">
                      <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/25 p-4">
                        <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">Total Revenue</div>
                        <div className="mt-1 text-2xl font-bold text-emerald-400">${totalRevenue.toLocaleString()}</div>
                      </div>
  
                      <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/25 p-4">
                        <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">Overall Churn Rate</div>
                        <div className="mt-1 text-2xl font-bold text-red-400">{churnRate}%</div>
                      </div>
                    </div>
                  </Card>
                </>
              );
            })()}
          </section>
          ) : activeTab === 'Settings' ? (
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
              <Card className="p-5">
                <div className="text-sm font-extrabold text-zinc-100">Profile Information</div>
                

                <form className="mt-5 space-y-4">
                  <Field label="Username" icon={CircleUser}>
                    <Input value={username ?? 'N/A'} disabled
                    className="pl-10" />
                  </Field>
                  <Field label="Role" icon={Tag}>
                    <Input value={roleBadgeLabel} disabled 
                    className="pl-10" />
                  </Field>
                </form>
              </Card>

              <Card className="p-5">
                <div className="text-sm font-extrabold text-zinc-100">Theme</div>
                <div className="mt-1 text-xs text-zinc-500">
                  Workspace appearance preferences
                </div>

                <div className="mt-5 rounded-xl border border-zinc-800/70 bg-zinc-950/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-zinc-100">Dark Mode</div>
                      <div className="mt-1 text-xs text-zinc-500">Enabled</div>
                    </div>
                    <button
                      type="button"
                      disabled
                      aria-label="Dark mode enabled"
                      className="relative h-7 w-12 cursor-not-allowed rounded-full bg-sky-500/80 ring-1 ring-sky-300/30"
                    >
                      <span className="absolute right-1 top-1 h-5 w-5 rounded-full bg-white shadow" />
                    </button>
                  </div>
                </div>
              </Card>
            </section>
          ) : (
            <Card className="p-6">
              <div className="text-sm font-extrabold text-zinc-100">{activeTab}</div>
              <div className="mt-2 text-sm text-zinc-500">
                This section is a placeholder to enrich the workspace.
              </div>
            </Card>
          )}
        </main>
      </div>

      {/* Multi-step (sectioned) Customer Modal */}
      <Modal
        open={customerModalOpen}
        title={editingCustomerId != null ? 'Edit Customer' : 'New Customer'}
        subtitle="Personal Info • Account Status"
        onClose={() => setCustomerModalOpen(false)}
      >
        <form className="space-y-5" onSubmit={onSaveCustomer}>
          <Card className="p-4">
            <div className="text-sm font-extrabold text-zinc-100">Personal Info</div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Name" icon={CircleUser}>
                <Input
                  required
                  hasIcon
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Helen Carter"
                />
              </Field>

              <Field label="Email" icon={Mail}>
                <Input
                  required
                  type="email"
                  hasIcon
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm((s) => ({ ...s, email: e.target.value }))}
                  placeholder="helen@enterprise.com"
                />
              </Field>

              <Field label="Phone" icon={Tag}>
                <Input
                  required
                  hasIcon
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm((s) => ({ ...s, phone: e.target.value }))}
                  placeholder="+1 555 0137"
                />
              </Field>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-extrabold text-zinc-100">Account Status</div>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <Field label="Status" icon={Tag}>
                <Select
                  className="pl-10"
                  value={customerForm.status}
                  onChange={(e) =>
                    setCustomerForm((s) => ({ ...s, status: e.target.value.toUpperCase() }))
                  }
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCustomerModalOpen(false)}
              disabled={savingCustomer}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={savingCustomer}>
              <Plus size={16} />
              {savingCustomer
                ? editingCustomerId != null
                  ? 'Saving…'
                  : 'Creating…'
                : editingCustomerId != null
                  ? 'Save changes'
                  : 'Create customer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Ticket Modal */}
      <Modal
        open={ticketModalOpen}
        title={
          ticketCustomer
            ? `Create Ticket • ${ticketCustomer.name ?? 'Customer'}`
            : 'Create Ticket'
        }
        subtitle="Tickets may be blocked by business rules (400)."
        onClose={() => setTicketModalOpen(false)}
      >
        <form className="space-y-3" onSubmit={onCreateTicket}>
          <Field label="Title" icon={TicketPlus}>
            <Input
              required
              hasIcon
              value={ticketForm.title}
              onChange={(e) => setTicketForm((s) => ({ ...s, title: e.target.value }))}
              placeholder="e.g. Renewal negotiation"
            />
          </Field>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-200">
              Description
            </span>
            <textarea
              value={ticketForm.description}
              onChange={(e) => setTicketForm((s) => ({ ...s, description: e.target.value }))}
              placeholder="Add context and next steps…"
              className={cx(
                'min-h-28 w-full resize-y rounded-xl border border-zinc-800/70 bg-zinc-950/35 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition',
                'focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20',
              )}
            />
          </label>

          <Field label="Priority" icon={Tag}>
            <Select
              value={ticketForm.priority}
              onChange={(e) => setTicketForm((s) => ({ ...s, priority: e.target.value }))}
            >
              <option value="LOW">LOW</option>
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH</option>
            </Select>
          </Field>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTicketModalOpen(false)}
              disabled={savingTicket}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={savingTicket}>
              <TicketPlus size={16} />
              {savingTicket ? 'Creating…' : 'Create ticket'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

