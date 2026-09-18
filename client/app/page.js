"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell, Building2, Check, ChevronRight, Crown, Download, FileText, Hash,
  HelpCircle, Home, Loader2, LogOut, Phone, Receipt, ScanLine, Settings,
  ShoppingBag, Sparkles, Trash2, TrendingUp, User, Wallet, X
} from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api, clearSession, updateStoredUser } from "../lib/api";
import AuthWelcome from "../components/AuthWelcome";

const SAVINGS_CATEGORIES = ["All", "Utilities", "Groceries", "Dining"];

function parseReceiptText(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let bestAmount = 0;
  let totalLineAmount = 0;
  lines.forEach((line) => {
    const isTotalLine = /total|amount due|grand total|net payable|balance due/i.test(line);
    const matches = line.match(/[0-9]+(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?/g) || [];
    matches.forEach((m) => {
      const value = Number(m.replace(/,/g, ""));
      if (!Number.isFinite(value)) return;
      if (isTotalLine && value > totalLineAmount) totalLineAmount = value;
      if (value > bestAmount) bestAmount = value;
    });
  });
  const amount = totalLineAmount || bestAmount || "";

  const merchantName = lines.find((l) => l.length > 2 && !/^[0-9.,₹\s-]+$/.test(l)) || "";

  const dateMatch = text.match(/(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/);
  let date = new Date().toISOString().slice(0, 10);
  if (dateMatch) {
    const parsedDate = new Date(dateMatch[1].replace(/\./g, "/"));
    if (!Number.isNaN(parsedDate.getTime())) date = parsedDate.toISOString().slice(0, 10);
  }

  return { merchantName: merchantName.slice(0, 60), amount, category: "Other", gstRate: 18, paymentMethod: "Other", date };
}

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [modal, setModal] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [bills, setBills] = useState([]);
  const [savings, setSavings] = useState([]);
  const [savingsFilter, setSavingsFilter] = useState("All");
  const [summary, setSummary] = useState({ total: 0, gst: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [scanBusy, setScanBusy] = useState(false);
  const [scanDraft, setScanDraft] = useState(null);
  const [scanError, setScanError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("spend_user");
    if (stored) setUser(JSON.parse(stored));
    setCheckingSession(false);
  }, []);

  useEffect(() => {
    if (user) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function loadData() {
    setLoading(true);
    try {
      const [e, s, b, sa, me] = await Promise.all([
        api("/expenses"), api("/expenses/summary"), api("/bills"), api("/savings"), api("/auth/me")
      ]);
      setExpenses(e); setSummary(s); setBills(b); setSavings(sa);
      setUser(me);
      updateStoredUser(me);
    } catch (err) {
      setToast(err.message);
    } finally {
      setLoading(false);
    }
  }

  const monthlyChart = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString("en-IN", { month: "short" }), amount: 0 });
    }
    expenses.forEach((x) => {
      const d = new Date(x.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = months.find((m) => m.key === key);
      if (bucket) bucket.amount += x.amount;
    });
    return months;
  }, [expenses]);

  const hasChartData = monthlyChart.some((m) => m.amount > 0);
  const cgstTotal = expenses.reduce((sum, x) => sum + (x.cgst || 0), 0);
  const sgstTotal = expenses.reduce((sum, x) => sum + (x.sgst || 0), 0);
  const taxIdentifiedCount = expenses.filter((x) => x.gst > 0).length;
  const savingsUnlockedTotal = savings.filter((s) => s.redeemed).reduce((sum, s) => sum + s.amount, 0);
  const totalMatchedSavings = savings.filter((s) => !s.redeemed).reduce((sum, s) => sum + s.amount, 0);
  const filteredSavings = savingsFilter === "All" ? savings : savings.filter((s) => s.category === savingsFilter);

  async function addExpense(event) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    try {
      await api("/expenses", {
        method: "POST",
        body: JSON.stringify({
          merchantName: f.get("merchantName"),
          category: f.get("category"),
          amount: Number(f.get("amount")),
          gstRate: Number(f.get("gstRate")),
          paymentMethod: f.get("paymentMethod")
        })
      });
      setModal(null);
      event.currentTarget.reset();
      await loadData();
      setToast("Expense saved.");
    } catch (err) { setToast(err.message); }
  }

  async function addBill(event) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    try {
      await api("/bills", {
        method: "POST",
        body: JSON.stringify({
          title: f.get("title"),
          provider: f.get("provider"),
          amount: Number(f.get("amount")),
          dueDate: f.get("dueDate")
        })
      });
      setModal(null);
      await loadData();
      setToast("Bill added.");
    } catch (err) { setToast(err.message); }
  }

  async function payBill(id) {
    try {
      await api(`/bills/${id}/pay`, { method: "PATCH" });
      await loadData();
      setToast("Bill marked as paid.");
    } catch (err) { setToast(err.message); }
  }

  async function deleteExpense(id) {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await api(`/expenses/${id}`, { method: "DELETE" });
      await loadData();
      setToast("Expense deleted.");
    } catch (err) { setToast(err.message); }
  }

  async function redeemSaving(id) {
    try {
      await api(`/savings/${id}/redeem`, { method: "PATCH" });
      await loadData();
      setToast("Offer applied to your savings.");
    } catch (err) { setToast(err.message); }
  }

  async function updateProfile(event) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    try {
      const updated = await api("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          monthlyIncome: Number(f.get("monthlyIncome")),
          phone: f.get("phone"),
          businessName: f.get("businessName"),
          gstin: f.get("gstin")
        })
      });
      setUser(updated);
      updateStoredUser(updated);
      setToast("Profile updated.");
    } catch (err) { setToast(err.message); }
  }

  function closeScanModal() {
    setModal(null);
    setScanDraft(null);
    setScanError("");
  }

  async function handleScanFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setScanError("");
    setScanDraft(null);
    setScanBusy(true);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(file);
      await worker.terminate();
      setScanDraft(parseReceiptText(data.text));
    } catch (err) {
      setScanError("Could not read this file. Try a clearer photo or enter the expense manually.");
    } finally {
      setScanBusy(false);
    }
  }

  async function saveScannedExpense(event) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    try {
      await api("/expenses", {
        method: "POST",
        body: JSON.stringify({
          merchantName: f.get("merchantName"),
          category: f.get("category"),
          amount: Number(f.get("amount")),
          gstRate: Number(f.get("gstRate")),
          paymentMethod: f.get("paymentMethod"),
          date: f.get("date"),
          scanned: true
        })
      });
      closeScanModal();
      await loadData();
      setToast("Scanned expense saved.");
    } catch (err) { setToast(err.message); }
  }

  function logout() {
    clearSession();
    setUser(null);
    setExpenses([]);
    setBills([]);
    setActiveTab("home");
  }

  function handleAuthed(data) {
    setUser(data.user);
    setToast(`Welcome, ${data.user.name}!`);
  }

  if (checkingSession) return null;
  if (!user) return <AuthWelcome onAuthed={handleAuthed} />;

  const totalSpent = summary.total || 0;
  const totalGST = summary.gst || 0;
  const monthlyIncome = user?.monthlyIncome || 0;
  const saved = Math.max(0, monthlyIncome - totalSpent);
  const initial = (user?.name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-white lg:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><Wallet size={20}/></div>
          <div>
            <p className="font-bold leading-tight">Spend It Wisely</p>
            <p className="text-xs text-gray-400 leading-tight">Smart money management</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-4">
          <SidebarLink icon={<Home size={18}/>} label="Home" active={activeTab === "home"} onClick={() => setActiveTab("home")}/>
          <SidebarLink icon={<FileText size={18}/>} label="Bills" active={activeTab === "bills"} onClick={() => setActiveTab("bills")}/>
          <SidebarLink icon={<Sparkles size={18}/>} label="Savings" active={activeTab === "savings"} onClick={() => setActiveTab("savings")}/>
          <SidebarLink icon={<User size={18}/>} label="Profile" active={activeTab === "profile"} onClick={() => setActiveTab("profile")}/>
        </nav>
        <div className="p-4">
          <button onClick={() => setModal("scan")} className="primary flex items-center justify-center gap-2"><ScanLine size={18}/> Scan Invoice</button>
        </div>
        <button onClick={logout} className="flex items-center gap-2 border-t px-6 py-4 text-sm font-semibold text-gray-500 hover:bg-gray-50"><LogOut size={16}/> Log out</button>
      </aside>

      <div className="lg:pl-64">
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3 lg:max-w-5xl">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">{initial}</div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Welcome back,</p>
              <p className="truncate font-bold leading-tight">{user?.name}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"><Bell size={20}/></button>
            <div className="hidden items-center gap-2 sm:flex lg:hidden">
              <Wallet size={18} className="text-blue-600"/>
              <span className="text-sm font-bold text-blue-600">Spend It Wisely</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-6 pb-24 lg:max-w-5xl lg:pb-10">
        {activeTab === "home" && (
          <>
            <section className="rounded-3xl bg-gradient-to-br from-blue-600 to-slate-900 p-7 text-white shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-blue-100">This month you spent</p>
                  <h2 className="mt-2 text-4xl font-bold">₹{totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
                </div>
                <div className="rounded-2xl bg-white/10 p-3"><TrendingUp/></div>
              </div>
              <div className="mt-8 h-48">
                {hasChartData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyChart}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} stroke="#bfdbfe"/>
                      <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Spent"]}/>
                      <Area type="monotone" dataKey="amount" stroke="#fff" fill="#fff" fillOpacity={0.12}/>
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-blue-200">No chart data available.</div>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <Metric label="Income" value={`₹${monthlyIncome.toLocaleString("en-IN")}`}/>
                <Metric label="Spent" value={`₹${totalSpent.toLocaleString("en-IN")}`}/>
                <Metric label="Saved" value={`₹${saved.toLocaleString("en-IN")}`}/>
              </div>
            </section>

            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">GST Components</h2>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">Live feed</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <GstCard label="CGST" value={cgstTotal}/>
                <GstCard label="SGST" value={sgstTotal}/>
                <GstCard label="IGST" value={0}/>
              </div>
            </section>

            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              <Tool onClick={() => setModal("scan")} icon={<ScanLine/>} title="Scan Invoice" text="Upload an invoice"/>
              <Tool onClick={() => setModal("expense")} icon={<Receipt/>} title="Add Expense" text="Track a new expense"/>
              <Tool onClick={() => setModal("bill")} icon={<FileText/>} title="Add Bill" text="Track a recurring bill"/>
            </section>
          </>
        )}

        {activeTab === "bills" && (
          <>
            <Section title="Bills" desc="Manage upcoming and paid bills"/>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bills.length === 0 ? <Empty text="No bills yet. Add one from the Home tab."/> :
                bills.map(b => <div key={b._id} className="rounded-3xl bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-bold">{b.title}</p><p className="truncate text-sm text-gray-500">{b.provider}</p></div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${b.status === "Paid" ? "bg-gray-200" : "bg-blue-600 text-white"}`}>{b.status}</span></div>
                  <p className="mt-5 text-2xl font-bold">₹{b.amount.toLocaleString("en-IN")}</p>
                  <p className="mt-1 text-sm text-gray-500">Due {new Date(b.dueDate).toLocaleDateString("en-IN")}</p>
                  {b.status !== "Paid" && <button onClick={() => payBill(b._id)} className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700">Mark as paid</button>}
                </div>)
              }
            </div>

            <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm">
              <QuickLink icon={<Download size={18}/>} label="Download Monthly Report" onClick={() => setToast("Report export isn't wired up in this demo.")}/>
              <QuickLink icon={<HelpCircle size={18}/>} label="Help & Support" onClick={() => setToast("Help & Support isn't wired up in this demo.")}/>
              <QuickLink icon={<Settings size={18}/>} label="Settings" onClick={() => setToast("Settings aren't wired up in this demo.")} last/>
            </div>

            <div className="mt-8">
              <Section title="Transaction History" desc="Every expense you've tracked"/>
              <div className="mt-5 overflow-hidden rounded-3xl bg-white shadow-sm">
                {loading ? <Empty text="Loading your data..."/> : expenses.length === 0 ? <Empty text="No expenses yet."/> :
                  expenses.map(x => <div key={x._id} className="flex items-center justify-between gap-3 border-b p-5 last:border-0">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="shrink-0 rounded-2xl bg-blue-50 p-3 text-blue-600"><ShoppingBag size={19}/></div>
                      <div className="min-w-0"><p className="truncate font-semibold">{x.merchantName}</p><p className="truncate text-sm text-gray-500">{new Date(x.date).toLocaleDateString("en-IN")} · {x.category}</p></div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <div className="text-right"><p className="font-bold">₹{x.amount.toLocaleString("en-IN")}</p><p className="text-xs text-gray-500">GST ₹{x.gst.toLocaleString("en-IN")}</p></div>
                      <button onClick={() => deleteExpense(x._id)} aria-label="Delete expense" className="rounded-xl p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={18}/></button>
                    </div>
                  </div>)
                }
              </div>
            </div>
          </>
        )}

        {activeTab === "savings" && (
          <>
            <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-900 p-7 text-white">
              <p className="text-xs uppercase tracking-wide text-blue-200">Total matched savings</p>
              <p className="mt-2 text-3xl font-bold">₹{totalMatchedSavings.toLocaleString("en-IN")} available</p>
              <p className="mt-2 text-sm text-blue-200">Personalized for your spending patterns.</p>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {SAVINGS_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setSavingsFilter(cat)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${savingsFilter === cat ? "bg-blue-600 text-white" : "border bg-white text-gray-600"}`}>{cat}</button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSavings.length === 0 ? <Empty text="No offers in this category yet."/> :
                filteredSavings.map(s => <div key={s._id} className="rounded-3xl bg-white p-6 shadow-sm">
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">{s.discount || "OFFER"}</span>
                  <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">{s.description}</p>
                  {s.redeemed ? (
                    <span className="mt-5 flex items-center gap-1 font-bold text-green-600"><Check size={17}/> Applied</span>
                  ) : (
                    <button onClick={() => redeemSaving(s._id)} className="mt-5 flex items-center gap-1 font-bold text-blue-600">Apply <ChevronRight size={17}/></button>
                  )}
                </div>)
              }
            </div>

            <div className="mt-5 rounded-3xl bg-gradient-to-br from-blue-600 to-slate-900 p-7 text-white">
              <div className="flex items-center gap-3"><Sparkles/><p className="font-semibold">Savings unlocked</p></div>
              <h3 className="mt-3 text-2xl font-bold">You unlocked ₹{savingsUnlockedTotal.toLocaleString("en-IN")} this month</h3>
              <p className="mt-2 text-sm text-blue-200">Keep tracking expenses to discover more savings.</p>
            </div>
          </>
        )}

        {activeTab === "profile" && (
          <>
            <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-900 p-7 text-center text-white">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/30 bg-white/10 text-2xl font-bold">{initial}</div>
              <h3 className="mt-4 text-xl font-bold">{user?.name}</h3>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-wide">
                <Crown size={14}/> {user?.plan === "premium" ? "Premium plan" : "Free plan"}
              </span>
              {user?.plan !== "premium" && (
                <div>
                  <button onClick={() => setToast("Real payments aren't wired up in this demo — this is where an upgrade flow would go.")} className="mt-4 rounded-xl bg-white px-6 py-2 text-sm font-bold text-blue-700">Upgrade</button>
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <StatCard value={user?.billsScanned || 0} label="Bills scanned"/>
              <StatCard value={taxIdentifiedCount} label="Tax identified"/>
              <StatCard value={`₹${savingsUnlockedTotal.toLocaleString("en-IN")}`} label="Savings unlocked"/>
            </div>

            <div className="mt-6 rounded-3xl bg-white p-7 shadow-sm">
              <h3 className="font-bold">Profile details</h3>
              <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
              <form key={user?.id} onSubmit={updateProfile} className="mt-5 space-y-4">
                <TextField icon={<Building2 size={18}/>} name="businessName" defaultValue={user?.businessName} placeholder="Business name (optional)"/>
                <TextField icon={<Hash size={18}/>} name="gstin" defaultValue={user?.gstin} placeholder="GSTIN (optional)"/>
                <TextField icon={<Phone size={18}/>} name="phone" defaultValue={user?.phone} placeholder="Phone number (optional)"/>
                <div>
                  <label className="text-sm text-gray-500">Monthly income</label>
                  <input name="monthlyIncome" type="number" min="0" step="0.01" defaultValue={user?.monthlyIncome || 0} className="field mt-1"/>
                </div>
                <button className="primary">Save profile</button>
              </form>
            </div>

            <button onClick={logout} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border bg-white px-5 py-3 font-semibold shadow-sm"><LogOut size={17}/> Log out</button>
          </>
        )}
      </div>

      <nav className="bottom-nav lg:hidden">
        <button onClick={() => setActiveTab("home")} className={`bottom-nav-item ${activeTab === "home" ? "active" : ""}`}>
          <Home size={20}/><span>Home</span>
        </button>
        <button onClick={() => setActiveTab("bills")} className={`bottom-nav-item ${activeTab === "bills" ? "active" : ""}`}>
          <FileText size={20}/><span>Bills</span>
        </button>
        <button onClick={() => setModal("scan")} className="bottom-nav-scan" aria-label="Scan invoice">
          <ScanLine size={22}/>
        </button>
        <button onClick={() => setActiveTab("savings")} className={`bottom-nav-item ${activeTab === "savings" ? "active" : ""}`}>
          <Sparkles size={20}/><span>Savings</span>
        </button>
        <button onClick={() => setActiveTab("profile")} className={`bottom-nav-item ${activeTab === "profile" ? "active" : ""}`}>
          <User size={20}/><span>Profile</span>
        </button>
      </nav>

      {modal === "expense" && <Modal title="Add expense" onClose={() => setModal(null)}>
        <form onSubmit={addExpense} className="space-y-4">
          <input name="merchantName" required placeholder="Merchant name" className="field"/>
          <select name="category" className="field"><option>Food</option><option>Bills</option><option>Shopping</option><option>Transport</option><option>Entertainment</option><option>Healthcare</option><option>Other</option></select>
          <input name="amount" type="number" min="0" step="0.01" required placeholder="Amount" className="field"/>
          <input name="gstRate" type="number" min="0" step="0.01" defaultValue="18" placeholder="GST %" className="field"/>
          <select name="paymentMethod" className="field"><option>UPI</option><option>Card</option><option>Cash</option><option>Bank Transfer</option><option>Other</option></select>
          <button className="primary">Save expense</button>
        </form>
      </Modal>}

      {modal === "bill" && <Modal title="Add bill" onClose={() => setModal(null)}>
        <form onSubmit={addBill} className="space-y-4">
          <input name="title" required placeholder="Bill name e.g. Internet" className="field"/>
          <input name="provider" placeholder="Provider e.g. Jio / Airtel" className="field"/>
          <input name="amount" type="number" min="0" required placeholder="Amount" className="field"/>
          <input name="dueDate" type="date" required className="field"/>
          <button className="primary">Save bill</button>
        </form>
      </Modal>}

      {modal === "scan" && <Modal title="Scan invoice" onClose={closeScanModal}>
        {!scanDraft && (
          <div className="rounded-2xl border-2 border-dashed p-8 text-center">
            {scanBusy ? (
              <>
                <Loader2 className="mx-auto animate-spin text-blue-600" size={34}/>
                <p className="mt-3 font-semibold">Reading your invoice...</p>
                <p className="mt-1 text-sm text-gray-500">This runs in your browser and can take a few seconds.</p>
              </>
            ) : (
              <>
                <ScanLine className="mx-auto text-blue-600" size={34}/>
                <p className="mt-3 font-semibold">Upload invoice image</p>
                <p className="mt-1 text-sm text-gray-500">We'll extract the merchant and amount automatically. You can review before saving.</p>
                <input type="file" accept="image/*" onChange={handleScanFile} className="mt-5 w-full text-sm"/>
                {scanError && <p className="mt-3 text-sm text-red-600">{scanError}</p>}
              </>
            )}
          </div>
        )}
        {scanDraft && (
          <form onSubmit={saveScannedExpense} className="space-y-4">
            <p className="text-sm text-gray-500">Review the extracted details and adjust anything that looks off.</p>
            <input name="merchantName" required defaultValue={scanDraft.merchantName} placeholder="Merchant name" className="field"/>
            <select name="category" defaultValue={scanDraft.category} className="field"><option>Food</option><option>Bills</option><option>Shopping</option><option>Transport</option><option>Entertainment</option><option>Healthcare</option><option>Other</option></select>
            <input name="amount" type="number" min="0" step="0.01" required defaultValue={scanDraft.amount} placeholder="Amount" className="field"/>
            <input name="gstRate" type="number" min="0" step="0.01" defaultValue={scanDraft.gstRate} placeholder="GST %" className="field"/>
            <select name="paymentMethod" defaultValue={scanDraft.paymentMethod} className="field"><option>UPI</option><option>Card</option><option>Cash</option><option>Bank Transfer</option><option>Other</option></select>
            <input name="date" type="date" defaultValue={scanDraft.date} className="field"/>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setScanDraft(null); setScanError(""); }} className="w-full rounded-xl border py-3 text-sm font-semibold">Rescan</button>
              <button className="primary">Save expense</button>
            </div>
          </form>
        )}
      </Modal>}

      {toast && <div className="fixed bottom-20 left-1/2 z-[200] -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl" onClick={() => setToast("")}>{toast}</div>}
      </div>
    </div>
  );
}

function TextField({ icon, ...props }) {
  return (
    <div className="field-icon-wrap">
      {icon}
      <input className="field" {...props}/>
    </div>
  );
}

function SidebarLink({icon,label,active,onClick}) { return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${active ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>{icon}{label}</button>; }
function Metric({label,value}) { return <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-blue-100">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
function GstCard({label,value}) { return <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-blue-600">{label}</p><p className="mt-2 text-lg font-bold">₹{value.toLocaleString("en-IN")}</p><div className="mt-3 h-1 w-10 rounded-full bg-blue-600"/></div>; }
function StatCard({value,label}) { return <div className="rounded-2xl bg-white p-4 text-center shadow-sm"><p className="text-xl font-bold">{value}</p><p className="mt-1 text-xs text-gray-500">{label}</p></div>; }
function Tool({icon,title,text,onClick}) { return <button onClick={onClick} className="rounded-3xl bg-white p-6 text-left shadow-sm hover:-translate-y-1 hover:shadow-lg"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">{icon}</div><h3 className="mt-5 font-bold">{title}</h3><p className="mt-1 text-sm text-gray-500">{text}</p></button>; }
function QuickLink({icon,label,onClick,last}) { return <button onClick={onClick} className={`flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 ${last ? "" : "border-b"}`}><span className="flex items-center gap-3 font-semibold"><span className="text-gray-400">{icon}</span>{label}</span><ChevronRight size={18} className="text-gray-300"/></button>; }
function Section({title,desc}) { return <div><h2 className="text-2xl font-bold">{title}</h2><p className="mt-1 text-sm text-gray-500">{desc}</p></div>; }
function Empty({text}) { return <div className="p-8 text-center text-gray-500">{text}</div>; }
function Modal({title,children,onClose}) { return <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-5"><div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2>{onClose && <button onClick={onClose} className="rounded-xl p-2 hover:bg-gray-100"><X/></button>}</div><div className="mt-6 overflow-y-auto">{children}</div></div></div>; }
