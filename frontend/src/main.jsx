import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

const api = async (path, options={}) => {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, credentials: 'include', ...options })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// Black & White theme
const t = {
  bg: '#000000',
  panel: '#0a0a0a',
  border: '#1a1a1a',
  text: '#f5f5f5',
  subtext: '#9ca3af',
  stripe1: '#0b0b0b',
  stripe2: '#0f0f0f'
}

function Page({ children }){
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
      {children}
    </div>
  )
}

function Card({ title, children }){
  return (
    <div style={{ background:t.panel, border:`1px solid ${t.border}`, borderRadius:12, padding:16, margin:'16px 0' }}>
      <h2 style={{ margin:'0 0 12px', fontSize:18, color:t.text }}>{title}</h2>
      {children}
    </div>
  )
}

function Button({ children, secondary, ...props }){
  return (
    <button {...props} style={{
      background: secondary ? 'transparent' : t.text,
      color: secondary ? t.text : '#000',
      border: secondary ? `1px solid ${t.text}` : 0,
      borderRadius:8, padding:'10px 14px', fontWeight:600, cursor:'pointer', height:40
    }}>{children}</button>
  )
}

function Input({ label, ...props }){
  return (
    <div style={{ display:'flex', flexDirection:'column' }}>
      <small style={{ color:t.subtext, marginBottom:6 }}>{label}</small>
      <input {...props} style={{ background:'#0a0a0a', color:t.text, border:`1px solid ${t.border}`, borderRadius:8, padding:'8px 10px', height:40 }} />
    </div>
  )
}

function Login(){
  const [authEnabled, setAuthEnabled] = useState(false)
  useEffect(() => {
    api('/api/public/health').then(h => setAuthEnabled(!!h.authEnabled)).catch(()=>{})
  }, [])
  return (
    <Page>
      <div style={{ textAlign:'center', marginTop:80 }}>
        <h1 style={{ fontWeight:800, letterSpacing:0.5, color:t.text }}>Xeno Mini CRM</h1>
        <p style={{ color:t.subtext }}>Sign in to continue</p>
        <div>
          <Button onClick={()=>{ window.location.hash = '#/dashboard' }}>Login with Google</Button>
        </div>
        {!authEnabled && <p style={{ color:t.subtext }}>Google login not configured. Dev mode enabled.</p>}
        <div style={{ marginTop:20 }}>
          <Button onClick={()=>window.location.hash = '#/dashboard'} secondary>Continue (Dev)</Button>
        </div>
      </div>
    </Page>
  )
}

function Customers(){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const save = async () => { await api('/api/customers', { method:'POST', body: JSON.stringify({ name, email }) }); alert('Customer saved') }
  return (
    <Card title="Add Customer">
      <div style={{ display:'grid', gap:16, gridTemplateColumns:'1fr 1fr' }}>
        <Input label="Name" value={name} onChange={e=>setName(e.target.value)} />
        <Input label="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:10 }}>
        <Button onClick={save}>Save</Button>
      </div>
    </Card>
  )
}

function Orders(){
  const [customerId, setCustomerId] = useState('')
  const [amount, setAmount] = useState('500')
  const save = async () => { await api('/api/orders', { method:'POST', body: JSON.stringify({ customerId, amount }) }); alert('Order saved') }
  return (
    <Card title="Add Order">
      <div style={{ display:'grid', gap:16, gridTemplateColumns:'1fr 1fr' }}>
        <Input label="Customer ID" value={customerId} onChange={e=>setCustomerId(e.target.value)} />
        <Input label="Amount (₹)" value={amount} onChange={e=>setAmount(e.target.value)} />
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:10 }}>
        <Button onClick={save}>Save</Button>
      </div>
    </Card>
  )
}

function SegmentBuilder(){
  const [name, setName] = useState('High Spenders')
  const [op, setOp] = useState('AND')
  const [rules, setRules] = useState([{ field:'totalSpend', operator:'>', value:10000 }])
  const [segmentId, setSegmentId] = useState(null)
  const [audience, setAudience] = useState(null)
  const addRule = () => setRules([...rules, { field:'inactiveDays', operator:'>', value:90 }])
  const update = (i, k, v) => setRules(rules.map((r,idx)=> idx===i ? { ...r, [k]: k==='value'? Number(v): v } : r))
  const remove = (i) => setRules(rules.filter((_,idx)=> idx!==i))
  const save = async () => {
    const ruleJson = JSON.stringify({ type:'group', op, children: rules.map(r=>({ type:'rule', ...r })) })
    const seg = await api('/api/segments', { method:'POST', body: JSON.stringify({ name, ruleJson }) })
    setSegmentId(seg.id)
    alert('Segment saved. Now preview audience or go create a campaign.')
  }
  const preview = async () => {
    const ruleJson = JSON.stringify({ type:'group', op, children: rules.map(r=>({ type:'rule', ...r })) })
    const res = await api('/api/segments/preview', { method:'POST', body: JSON.stringify({ ruleJson }) })
    setAudience(res.audienceSize)
  }
  return (
    <Card title="Segment Builder">
      <div style={{ display:'grid', gap:16, gridTemplateColumns:'1fr 1fr' }}>
        <Input label="Name" value={name} onChange={e=>setName(e.target.value)} />
        <div style={{ display:'flex', flexDirection:'column' }}>
          <small style={{ color:t.subtext, marginBottom:6 }}>Group Operator</small>
          <select value={op} onChange={e=>setOp(e.target.value)} style={{ background:t.panel, color:t.text, border:`1px solid ${t.border}`, borderRadius:8, padding:'8px 10px', height:40 }}>
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        </div>
      </div>
      {rules.map((r,i)=> (
        <div key={i} style={{ display:'grid', gap:16, gridTemplateColumns:'1fr 1fr 1fr auto', marginTop:8 }}>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <small style={{ color:t.subtext, marginBottom:6 }}>Field</small>
            <select value={r.field} onChange={e=>update(i,'field', e.target.value)} style={{ background:t.panel, color:t.text, border:`1px solid ${t.border}`, borderRadius:8, padding:'8px 10px', height:40 }}>
              <option value="totalSpend">Total Spend</option>
              <option value="totalVisits">Total Visits</option>
              <option value="inactiveDays">Inactive Days</option>
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <small style={{ color:t.subtext, marginBottom:6 }}>Operator</small>
            <select value={r.operator} onChange={e=>update(i,'operator', e.target.value)} style={{ background:t.panel, color:t.text, border:`1px solid ${t.border}`, borderRadius:8, padding:'8px 10px', height:40 }}>
              {['>','>=','<','<=','==','!='].map(op=> <option key={op} value={op}>{op}</option>)}
            </select>
          </div>
          <Input label="Value" value={r.value} onChange={e=>update(i,'value', e.target.value)} />
          <div style={{ display:'flex', alignItems:'end' }}>
            <Button secondary onClick={()=>remove(i)}>Remove</Button>
          </div>
        </div>
      ))}
      <div style={{ display:'flex', gap:10, marginTop:10 }}>
        <Button secondary onClick={addRule}>Add Rule</Button>
        <div style={{ flex:1 }} />
        <Button onClick={save}>Save Segment</Button>
        <Button secondary onClick={preview}>Preview Audience</Button>
        {audience!=null && <span style={{ color:t.subtext, alignSelf:'center' }}>Audience: {audience}</span>}
      </div>
      <div style={{ marginTop:10 }}>
        <Button secondary onClick={()=> window.location.hash = '#/create-campaign'}>Go to Create Campaign</Button>
      </div>
    </Card>
  )
}

function Campaigns(){
  const [segmentId, setSegmentId] = useState('')
  const [name, setName] = useState('September Offer')
  const [message, setMessage] = useState("Hi {name}, here's 10% off on your next order!")
  const [list, setList] = useState([])
  const load = async () => setList(await api('/api/campaigns'))
  useEffect(()=>{ load() },[])
  const create = async () => { await api('/api/campaigns', { method:'POST', body: JSON.stringify({ segmentId, name, message }) }); await load() }
  const send = async (id) => { const res = await api(`/api/vendor/send/${id}`, { method:'POST' }); alert(`Sent: ${res.sent}, Failed: ${res.failed}`); }
  const stats = async (id) => { const res = await api(`/api/campaigns/${id}/stats`); alert(`Total ${res.total}, Sent ${res.sent}, Failed ${res.failed}`); }
  const suggest = async () => { const res = await api('/api/ai/suggest-messages', { method:'POST', body: JSON.stringify({ objective: 'bring back inactive users' }) }); setMessage(res.suggestions[0] || message) }
  return (
    <Card title="Campaigns">
      <div style={{ display:'grid', gap:16, gridTemplateColumns:'1fr 1fr' }}>
        <Input label="Segment ID" value={segmentId} onChange={e=>setSegmentId(e.target.value)} />
        <Input label="Name" value={name} onChange={e=>setName(e.target.value)} />
      </div>
      <div style={{ display:'flex', flexDirection:'column', marginTop:10 }}>
        <small style={{ color:t.subtext, marginBottom:6 }}>Message</small>
        <textarea rows={3} value={message} onChange={e=>setMessage(e.target.value)} style={{ background:t.panel, color:t.text, border:`1px solid ${t.border}`, borderRadius:8, padding:'8px 10px' }} />
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:10 }}>
        <Button onClick={create}>Create & Queue</Button>
        <Button secondary onClick={suggest}>AI Suggest</Button>
      </div>
      <Card title="History">
        <table style={{ width:'100%', borderCollapse:'collapse', color:t.text }}>
          <thead style={{ background:'#0c0c0c' }}><tr><th>ID</th><th>Name</th><th>Actions</th></tr></thead>
          <tbody>
            {list.slice().reverse().map((c,i) => (
              <tr key={c.id} style={{ background: i%2? t.stripe1 : t.stripe2 }}>
                <td>{c.id}</td><td>{c.name}</td>
                <td>
                  <Button onClick={()=>send(c.id)}>Send</Button>
                  <span style={{ display:'inline-block', width:8 }} />
                  <Button secondary onClick={()=>stats(c.id)}>Stats</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Card>
  )
}

function CreateCampaignPage(){
  const [segments,setSegments]=useState([])
  const [segmentId,setSegmentId]=useState('')
  const [name,setName]=useState('September Offer')
  const [message,setMessage]=useState("Hi {name}, here's 10% off on your next order!")
  useEffect(()=>{ api('/api/segments').then(setSegments).catch(()=>{}) },[])
  const create = async ()=>{ await api('/api/campaigns',{ method:'POST', body: JSON.stringify({ segmentId, name, message })}); alert('Campaign created and queued'); }
  return (
    <Page>
      <Card title="Create Campaign">
        <div style={{ display:'grid', gap:16, gridTemplateColumns:'1fr 1fr' }}>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <small style={{ color:t.subtext, marginBottom:6 }}>Segment</small>
            <select value={segmentId} onChange={e=>setSegmentId(e.target.value)} style={{ background:t.panel, color:t.text, border:`1px solid ${t.border}`, borderRadius:8, padding:'8px 10px', height:40 }}>
              <option value="">Select</option>
              {segments.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <Input label="Name" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div style={{ display:'flex', flexDirection:'column', marginTop:10 }}>
          <small style={{ color:t.subtext, marginBottom:6 }}>Message</small>
          <textarea rows={3} value={message} onChange={e=>setMessage(e.target.value)} style={{ background:t.panel, color:t.text, border:`1px solid ${t.border}`, borderRadius:8, padding:'8px 10px' }} />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:10 }}>
          <Button onClick={create}>Create & Queue</Button>
        </div>
      </Card>
    </Page>
  )
}

function StatCard({label, value}){
  return <div style={{ background:t.panel, border:`1px solid ${t.border}`, borderRadius:12, padding:16 }}>
    <div style={{ color:t.subtext, fontSize:12 }}>{label}</div>
    <div style={{ fontSize:24, fontWeight:700, color:t.text }}>{value}</div>
  </div>
}

function Dashboard(){
  const [stats, setStats] = useState({ totalCustomers:0, totalOrders:0, totalCampaigns:0, lastCampaign:{} })
  useEffect(()=>{ api('/api/dashboard/stats').then(setStats).catch(()=>{}) },[])
  const last = stats.lastCampaign || {}
  const sentPct = last.total ? Math.round((last.sent/last.total)*100) : 0
  return (
    <Page>
      <div style={{ display:'grid', gap:16, gridTemplateColumns:'repeat(4, 1fr)' }}>
        <StatCard label="Total Customers" value={stats.totalCustomers} />
        <StatCard label="Total Orders" value={stats.totalOrders} />
        <StatCard label="Campaigns Created" value={stats.totalCampaigns} />
        <div style={{ background:t.panel, border:`1px solid ${t.border}`, borderRadius:12, padding:16 }}>
          <div style={{ color:t.subtext, fontSize:12 }}>Last Campaign Success</div>
          <div style={{ marginTop:8, height:12, background:'#0f0f0f', borderRadius:8 }}>
            <div style={{ width:`${sentPct}%`, height:'100%', background:t.text, borderRadius:8 }}></div>
          </div>
          <div style={{ marginTop:6, fontSize:12, color:t.subtext }}>{sentPct}% sent</div>
        </div>
      </div>
    </Page>
  )
}

function CustomersPage(){
  const [q,setQ] = useState('')
  const [rows,setRows] = useState([])
  const search = async () => setRows(await api(`/api/customers${q?`?search=${encodeURIComponent(q)}`:''}`))
  useEffect(()=>{ search() },[])
  return (
    <Page>
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        <input placeholder="Search customers" value={q} onChange={e=>setQ(e.target.value)} style={{ flex:1, background:'#0a0a0a', color:t.text, border:`1px solid ${t.border}`, borderRadius:8, padding:'8px 10px', height:40 }} />
        <Button onClick={search}>Search</Button>
      </div>
      <Customers />
      <Card title="Customers">
        <table style={{ width:'100%', borderCollapse:'collapse', color:t.text }}>
          <thead style={{ background:'#0c0c0c' }}><tr><th>ID</th><th>Name</th><th>Email</th><th>Spend</th><th>Visits</th><th>Last Active</th></tr></thead>
          <tbody>
            {rows.map((c,i) => (
              <tr key={c.id} style={{ background: i%2? t.stripe1 : t.stripe2 }}><td>{c.id}</td><td>{c.name}</td><td>{c.email}</td><td>{c.totalSpend||0}</td><td>{c.totalVisits||0}</td><td>{c.lastActiveAt||''}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Page>
  )
}

function OrdersPage(){
  const [customers,setCustomers]=useState([])
  const [customerId,setCustomerId]=useState('')
  const [amount,setAmount]=useState('500')
  const [rows,setRows]=useState([])
  const load = async ()=>{
    setCustomers(await api('/api/customers'))
    setRows(await api('/api/orders'))
  }
  useEffect(()=>{ load() },[])
  const save = async ()=>{ await api('/api/orders',{ method:'POST', body: JSON.stringify({ customerId, amount })}); await load() }
  return (
    <Page>
      <Card title="Add Order">
        <div style={{ display:'grid', gap:16, gridTemplateColumns:'1fr 1fr' }}>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <small style={{ color:t.subtext, marginBottom:6 }}>Customer</small>
            <select value={customerId} onChange={e=>setCustomerId(e.target.value)} style={{ background:t.panel, color:t.text, border:`1px solid ${t.border}`, borderRadius:8, padding:'8px 10px', height:40 }}>
              <option value="">Select</option>
              {customers.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Input label="Amount (₹)" value={amount} onChange={e=>setAmount(e.target.value)} />
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:10 }}>
          <Button onClick={save}>Save</Button>
        </div>
      </Card>
      <Card title="Orders">
        <table style={{ width:'100%', borderCollapse:'collapse', color:t.text }}>
          <thead style={{ background:'#0c0c0c' }}><tr><th>ID</th><th>Customer</th><th>Amount</th><th>Date</th></tr></thead>
          <tbody>
            {rows.map((o,i) => (
              <tr key={o.id} style={{ background: i%2? t.stripe1 : t.stripe2 }}><td>{o.id}</td><td>{o.customerName}</td><td>{o.amount}</td><td>{o.date||''}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Page>
  )
}

function CampaignHistoryPage(){
  const [list,setList]=useState([])
  useEffect(()=>{ api('/api/campaigns').then(setList) },[])
  const stats=async(id)=>{ const s=await api(`/api/campaigns/${id}/stats`); alert(`Total ${s.total}, Sent ${s.sent}, Failed ${s.failed}`) }
  const send=async(id)=>{ const r=await api(`/api/vendor/send/${id}`,{method:'POST'}); alert(`Sent: ${r.sent}, Failed: ${r.failed}`) }
  return (
    <Page>
      <Card title="Campaign History">
        <table style={{ width:'100%', borderCollapse:'collapse', color:t.text }}>
          <thead style={{ background:'#0c0c0c' }}><tr><th>ID</th><th>Name</th><th>Actions</th></tr></thead>
          <tbody>
            {list.slice().reverse().map((c,i)=> (
              <tr key={c.id} style={{ background: i%2? t.stripe1 : t.stripe2 }}><td>{c.id}</td><td>{c.name}</td><td><Button onClick={()=>send(c.id)}>Send</Button><span style={{display:'inline-block',width:8}}/><Button secondary onClick={()=>stats(c.id)}>Stats</Button></td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Page>
  )
}

function AISuggestionsPage(){
  const [goal,setGoal]=useState('Bring back inactive users')
  const [suggestions,setSuggestions]=useState([])
  const go=async()=>{ const r=await api('/api/ai/suggest-messages',{ method:'POST', body: JSON.stringify({ objective: goal })}); setSuggestions(r.suggestions||[]) }
  return (
    <Page>
      <Card title="AI Suggestions">
        <div style={{ display:'grid', gap:16, gridTemplateColumns:'1fr auto' }}>
          <Input label="Campaign goal" value={goal} onChange={e=>setGoal(e.target.value)} />
          <div style={{ display:'flex', alignItems:'end' }}><Button onClick={go}>Suggest</Button></div>
        </div>
        <div style={{ display:'grid', gap:12, gridTemplateColumns:'1fr 1fr 1fr', marginTop:12 }}>
          {suggestions.map((s,i)=> <div key={i} style={{ background:t.panel, border:`1px solid ${t.border}`, borderRadius:12, padding:12 }}>{s}</div>)}
        </div>
      </Card>
    </Page>
  )
}

function Sidebar(){
  const Item = ({href, label}) => <a href={href} style={{ color:t.text, textDecoration:'none', padding:'12px 14px', display:'block', borderLeft:'3px solid transparent' }}>{label}</a>
  return (
    <div style={{ width:220, background:'#000000', minHeight:'calc(100vh - 60px)', borderRight:`1px solid ${t.border}` }}>
      <Item href="#/dashboard" label="Dashboard" />
      <Item href="#/customers" label="Customers" />
      <Item href="#/orders" label="Orders" />
      <Item href="#/segment" label="Create Segment" />
      <Item href="#/create-campaign" label="Create Campaign" />
      <Item href="#/campaigns" label="Campaign History" />
      <Item href="#/ai" label="AI Suggestions" />
    </div>
  )
}

function App(){
  const [route, setRoute] = useState(window.location.hash || '#/')
  useEffect(()=>{
    const onHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const dark = { background:t.bg, color:t.text }
  const main = () => {
    if (route==='#/' || route==='#') return <Login />
    if (route.startsWith('#/dashboard')) return <Dashboard />
    if (route.startsWith('#/customers')) return <CustomersPage />
    if (route.startsWith('#/orders')) return <OrdersPage />
    if (route.startsWith('#/segment')) return <SegmentBuilder />
    if (route.startsWith('#/create-campaign')) return <CreateCampaignPage />
    if (route.startsWith('#/campaigns')) return <CampaignHistoryPage />
    if (route.startsWith('#/ai')) return <AISuggestionsPage />
    return <Dashboard />
  }
  return (
    <div style={{ ...dark, minHeight:'100vh' }}>
      <header style={{ height:60, padding:'0 20px', background:'#000', borderBottom:`1px solid ${t.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontWeight:800, letterSpacing:0.5, color:t.text }}>Xeno Mini CRM</div>
        <nav style={{ display:'flex', gap:12 }}>
          <a href="#/" style={{ color:t.subtext, textDecoration:'none' }}>Login</a>
          <a href="#/dashboard" style={{ color:t.subtext, textDecoration:'none' }}>Dashboard</a>
        </nav>
      </header>
      {route==='#/' || route==='#' ? (
        <Login />
      ) : (
        <div style={{ display:'flex' }}>
          <Sidebar />
          <div style={{ flex:1 }}>
            {main()}
          </div>
        </div>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)


