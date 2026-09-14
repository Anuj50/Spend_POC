"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft, ArrowUpRight, Bell, ChevronRight, CreditCard,
  FileText, Home, Menu, Plus, Receipt, ScanLine, Settings,
  ShoppingBag, Sparkles, TrendingUp, Wallet, X, LogOut
} from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api, clearSession, saveSession } from "../lib/api";

const demoChart = [
  { month: "Oct", amount: 4200 }, { month: "Nov", amount: 5100 },
  { month: "Dec", amount: 4800 }, { month: "Jan", amount: 6200 },
  { month: "Feb", amount: 5900 }, { month: "Mar", amount: 8545 }
];

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loginMode, setLoginMode] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [modal, setModal] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [bills, setBills] = useState([]);
  const [savings, setSavings] = useState([]);
  const [summary, setSummary] = useState({ total: 0, gst: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("spend_user");
    if (stored) setUser(JSON.parse(stored));
    else setAuthOpen(true);
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [e, s, b, sa] = await Promise.all([
        api("/expenses"), api("/expenses/summary"), api("/bills"), api("/savings")
      ]);
      setExpenses(e); setSummary(s); setBills(b); setSavings(sa);
    } catch (err) {
      setToast(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitAuth(event) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    try {
      const path = loginMode ? "/auth/login" : "/auth/register";
      const data = await api(path, {
        method: "POST",
        body: JSON.stringify({
          name: f.get("name"),
          email: f.get("email"),
          password: f.get("password")
        })
      });
      saveSession(data);
      setUser(data.user);
      setAuthOpen(false);
      setToast(loginMode ? "Welcome back!" : "Account created!");
    } catch (err) { setToast(err.message); }
  }

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

  function logout() {
    clearSession();
    setUser(null);
    setExpenses([]);
    setBills([]);
    setAuthOpen(true);
  }

  const totalSpent = summary.total || 0;
  const totalGST = summary.gst || 0;
  const saved = Math.max(0, 32000 - totalSpent);

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white"><Wallet size={20}/></div>
            <div>
              <h1 className="font-bold">Spend It Wisely</h1>
              <p className="text-xs text-gray-500">Smart money management</p>
            </div>
          </a>
          <nav className="hidden gap-8 md:flex">
            <a className="font-semibold" href="#home">Home</a>
            <a className="text-gray-500" href="#bills">Bills</a>
            <a className="text-gray-500" href="#savings">Savings</a>
            <a className="text-gray-500" href="#profile">Profile</a>
          </nav>
          <div className="flex items-center gap-2">
            <button className="hidden rounded-xl p-2 hover:bg-gray-100 sm:block"><Bell size={20}/></button>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="rounded-xl p-2 hover:bg-gray-100 md:hidden">{mobileMenu ? <X/>:<Menu/>}</button>
          </div>
        </div>
        {mobileMenu && <div className="border-t bg-white px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <a href="#home" onClick={() => setMobileMenu(false)}>Home</a>
            <a href="#bills" onClick={() => setMobileMenu(false)}>Bills</a>
            <a href="#savings" onClick={() => setMobileMenu(false)}>Savings</a>
            <a href="#profile" onClick={() => setMobileMenu(false)}>Profile</a>
          </div>
        </div>}
      </header>

      <div id="home" className="mx-auto max-w-7xl px-5 py-8 pb-24">
        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-3xl bg-black p-7 text-white shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400">This month you spent</p>
                <h2 className="mt-2 text-4xl font-bold">₹{totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
              </div>
              <div className="rounded-2xl bg-white/10 p-3"><TrendingUp/></div>
            </div>
            <div className="mt-8 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demoChart}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} stroke="#999"/>
                  <Tooltip/>
                  <Area type="monotone" dataKey="amount" stroke="#fff" fill="#fff" fillOpacity={0.08}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <Metric label="Income" value="₹32,000"/>
              <Metric label="Spent" value={`₹${totalSpent.toLocaleString("en-IN")}`}/>
              <Metric label="Saved" value={`₹${saved.toLocaleString("en-IN")}`}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Quick icon={<ArrowUpRight/>} title="Sent"/>
            <Quick icon={<ArrowDownLeft/>} title="Receive"/>
            <Quick icon={<CreditCard/>} title="Loan"/>
            <Quick icon={<Plus/>} title="Topup"/>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <Insight title="Similar plans charge 12%" text="Compare your bills with category averages."/>
          <Insight title="GST Analysis" text={`₹${totalGST.toLocaleString("en-IN")} GST tracked from your expenses.`}/>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tool onClick={() => setModal("scan")} icon={<ScanLine/>} title="Scan Invoice" text="Upload an invoice"/>
          <Tool onClick={() => setModal("expense")} icon={<Receipt/>} title="Add Expense" text="Track a new expense"/>
          <Tool onClick={() => setModal("bill")} icon={<FileText/>} title="Add Bill" text="Track a recurring bill"/>
          <Tool onClick={() => setToast("Reports can be exported in the next release.")} icon={<Settings/>} title="Reports" text="Monthly report"/>
        </section>

        <section className="mt-10">
          <Section title="Your Expenses" desc="Track your latest spending"/>
          <div className="mt-5 overflow-hidden rounded-3xl bg-white shadow-sm">
            {loading ? <Empty text="Loading your data..."/> : expenses.length === 0 ? <Empty text="No expenses yet. Add your first one."/> :
              expenses.map(x => <div key={x._id} className="flex items-center justify-between border-b p-5 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-gray-100 p-3"><ShoppingBag size={19}/></div>
                  <div><p className="font-semibold">{x.merchantName}</p><p className="text-sm text-gray-500">{x.category} · {x.paymentMethod}</p></div>
                </div>
                <div className="text-right"><p className="font-bold">₹{x.amount.toLocaleString("en-IN")}</p><p className="text-xs text-gray-500">GST ₹{x.gst.toLocaleString("en-IN")}</p></div>
              </div>)
            }
          </div>
        </section>

        <section id="bills" className="mt-10">
          <Section title="Bills" desc="Manage upcoming and paid bills"/>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {bills.length === 0 ? <Empty text="No bills yet. Add one above."/> :
              bills.map(b => <div key={b._id} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex justify-between"><div><p className="font-bold">{b.title}</p><p className="text-sm text-gray-500">{b.provider}</p></div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${b.status === "Paid" ? "bg-gray-200" : "bg-black text-white"}`}>{b.status}</span></div>
                <p className="mt-5 text-2xl font-bold">₹{b.amount.toLocaleString("en-IN")}</p>
                <p className="mt-1 text-sm text-gray-500">Due {new Date(b.dueDate).toLocaleDateString("en-IN")}</p>
                {b.status !== "Paid" && <button onClick={() => payBill(b._id)} className="mt-5 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white">Mark as paid</button>}
              </div>)
            }
          </div>
        </section>

        <section className="mt-10">
          <Section title="Bills History" desc="Recent transactions from your account"/>
          <div className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
            {expenses.slice(0, 5).map(x => <div key={x._id} className="flex items-center justify-between border-b py-4 last:border-0">
              <div><p className="font-semibold">{x.merchantName}</p><p className="text-sm text-gray-500">{new Date(x.date).toLocaleString("en-IN")} · {x.category}</p></div>
              <p className="font-bold">₹{x.amount.toLocaleString("en-IN")}</p>
            </div>)}
            {!expenses.length && <Empty text="Your history will appear here."/>}
          </div>
        </section>

        <section id="savings" className="mt-10">
          <Section title="Savings & Offers" desc="Discover ways to reduce regular bills"/>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {savings.map(s => <div key={s._id} className="rounded-3xl bg-white p-6 shadow-sm">
              <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">{s.discount || "OFFER"}</span>
              <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{s.description}</p>
              <button onClick={() => setToast("Offer selected. Connect a payment provider to enable payment.")} className="mt-5 flex items-center gap-1 font-bold">Pay <ChevronRight size={17}/></button>
            </div>)}
          </div>
          <div className="mt-5 rounded-3xl bg-black p-7 text-white">
            <div className="flex items-center gap-3"><Sparkles/><p className="font-semibold">15% Unlocked</p></div>
            <h3 className="mt-3 text-2xl font-bold">You unlocked ₹480 this month</h3>
            <p className="mt-2 text-sm text-gray-400">Keep tracking expenses to discover more savings.</p>
          </div>
        </section>

        <section id="profile" className="mt-10">
          <div className="rounded-3xl bg-white p-7 shadow-sm">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div><p className="text-sm text-gray-500">Profile</p><h3 className="mt-1 text-2xl font-bold">{user?.name}</h3><p className="text-gray-500">{user?.email}</p></div>
              <button onClick={logout} className="flex items-center justify-center gap-2 rounded-xl border px-5 py-3 font-semibold"><LogOut size={17}/> Log out</button>
            </div>
          </div>
        </section>
      </div>

      {user && <button onClick={() => setModal("expense")} className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-2xl hover:scale-105"><Plus/></button>}

      {authOpen && <Modal title={loginMode ? "Welcome back" : "Create your account"} onClose={user ? () => setAuthOpen(false) : undefined}>
        <form onSubmit={submitAuth} className="space-y-4">
          {!loginMode && <input name="name" required placeholder="Full name" className="field"/>}
          <input name="email" type="email" required placeholder="Email address" className="field"/>
          <input name="password" type="password" required minLength="6" placeholder="Password (6+ characters)" className="field"/>
          <button className="primary">{loginMode ? "Log in" : "Create account"}</button>
          <button type="button" onClick={() => setLoginMode(!loginMode)} className="w-full text-sm text-gray-500">{loginMode ? "Need an account? Sign up" : "Already have an account? Log in"}</button>
        </form>
      </Modal>}

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

      {modal === "scan" && <Modal title="Scan invoice" onClose={() => setModal(null)}>
        <div className="rounded-2xl border-2 border-dashed p-8 text-center">
          <ScanLine className="mx-auto" size={34}/>
          <p className="mt-3 font-semibold">Upload invoice image/PDF</p>
          <p className="mt-1 text-sm text-gray-500">OCR integration is the next production step.</p>
          <input type="file" accept="image/*,.pdf" className="mt-5 w-full text-sm"/>
        </div>
      </Modal>}

      {toast && <div className="fixed bottom-5 left-1/2 z-[200] -translate-x-1/2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-xl" onClick={() => setToast("")}>{toast}</div>}
    </main>
  );
}

function Metric({label,value}) { return <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-gray-400">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
function Quick({icon,title}) { return <button className="group rounded-3xl bg-white p-6 text-left shadow-sm hover:-translate-y-1 hover:shadow-lg"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 group-hover:bg-black group-hover:text-white">{icon}</div><p className="mt-5 font-bold">{title}</p><p className="mt-1 text-sm text-gray-500">Manage</p></button>; }
function Insight({title,text}) { return <div className="rounded-3xl bg-white p-6 shadow-sm"><p className="font-bold">{title}</p><p className="mt-2 text-sm text-gray-500">{text}</p></div>; }
function Tool({icon,title,text,onClick}) { return <button onClick={onClick} className="rounded-3xl bg-white p-6 text-left shadow-sm hover:-translate-y-1 hover:shadow-lg"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">{icon}</div><h3 className="mt-5 font-bold">{title}</h3><p className="mt-1 text-sm text-gray-500">{text}</p></button>; }
function Section({title,desc}) { return <div><h2 className="text-2xl font-bold">{title}</h2><p className="mt-1 text-sm text-gray-500">{desc}</p></div>; }
function Empty({text}) { return <div className="p-8 text-center text-gray-500">{text}</div>; }
function Modal({title,children,onClose}) { return <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-5"><div className="w-full max-w-lg rounded-3xl bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2>{onClose && <button onClick={onClose} className="rounded-xl p-2 hover:bg-gray-100"><X/></button>}</div><div className="mt-6">{children}</div></div></div>; }
