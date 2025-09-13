import React, { useEffect, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend as RLegend } from 'recharts'
import { createRoot } from 'react-dom/client'

// UPDATED: Force new build with correct backend URL
const API_BASE = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : 'https://crm-sde-assignemnt-xeno.onrender.com'
console.log('🚀 Frontend loaded with API_BASE:', API_BASE)
const withBase = (path) => (/^https?:/i.test(path) ? path : `${API_BASE||''}${path}`)
const api = async (path, options={}) => {
  const fullUrl = withBase(path)
  console.log('API call:', fullUrl, 'API_BASE:', API_BASE)
  const res = await fetch(fullUrl, { headers: { 'Content-Type': 'application/json' }, credentials: 'include', ...options })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

const formatINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n||0))

// Black-focused theme with subtle depth
const t = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#1f242d',
  text: '#e6edf3',
  subtext: '#8b949e',
  stripe1: '#0f141a',
  stripe2: '#121820',
  hover: '#1b2230',
  green: '#16a34a',
  red: '#dc2626'
}

function Page({ children }){
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 24px 28px' }}>
      {children}
    </div>
  )
}

function Card({ title, children }){
  return (
    <div style={{ background:t.panel, border:`1px solid ${t.border}`, borderRadius:12, padding:20, margin:'20px 0', boxShadow:'0 1px 0 rgba(255,255,255,0.02), 0 10px 30px rgba(0,0,0,0.35)' }}>
      <h2 style={{ margin:'0 0 14px', fontSize:18, color:t.text, letterSpacing:0.2 }}>{title}</h2>
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
      <input {...props} style={{ background:t.panel, color:t.text, border:`1px solid rgba(255,255,255,0.15)`, outline:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'10px 12px', height:42, fontSize:14 }} />
    </div>
  )
}

function Login(){
  const [authEnabled, setAuthEnabled] = useState(false)
  useEffect(() => {
    api('/api/public/health').then(h => setAuthEnabled(!!h.authEnabled)).catch(()=>{})
    // If we land here after OAuth with flag, show toast once and redirect
    const params = new URLSearchParams(window.location.hash.split('?')[1]||'')
    const loginFlag = params.get('login') === '1'
    api('/api/me').then(() => {
      if (loginFlag && window.showToast) window.showToast('Signed in successfully', 'success')
      window.location.hash = '#/dashboard'
    }).catch(()=>{})
  }, [])
  return (
    <Page>
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'68vh' }}>
        <div style={{ width:'100%', maxWidth:560 }}>
          <div style={{
            background: `linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`,
            border:`1px solid ${t.border}`, borderRadius:14, padding:28,
            boxShadow:'0 10px 30px rgba(0,0,0,0.45)'
          }}>
            <div style={{ marginBottom:18 }}>
              <h1 style={{ margin:0, fontSize:28, fontWeight:800, letterSpacing:0.2, color:t.text }}>Mini CRM</h1>
              <div style={{ marginTop:6, color:t.subtext, fontSize:14 }}>Minimal CRM for segments, campaigns, and insights.</div>
            </div>
            <div style={{ display:'grid', gap:10, margin:'14px 0 18px' }}>
              <div style={{ color:t.subtext, fontSize:13 }}>- No authentication required</div>
              <div style={{ color:t.subtext, fontSize:13 }}>- Create segments with flexible rules</div>
              <div style={{ color:t.subtext, fontSize:13 }}>- Launch campaigns and track delivery</div>
            </div>
            <div style={{ marginTop:10 }}>
              <button onClick={()=>{
                // AUTHENTICATION DISABLED - ALWAYS REDIRECT TO DASHBOARD
                console.log('Sign in clicked - redirecting to dashboard (no auth required)')
                window.location.hash = '#/dashboard'
                if (window.showToast) window.showToast('Signed in successfully', 'success')
              }} style={{
                width:'100%', height:46, borderRadius:10,
                background:t.text, color:'#000', border:0, fontWeight:700, cursor:'pointer'
              }}>Sign in</button>
              {!authEnabled && (
                <div style={{ marginTop:10, display:'flex', gap:10 }}>
                  <div style={{ color:t.subtext, fontSize:12, flex:1 }}>Google login not configured (dev mode).
                  </div>
                  <Button onClick={()=>window.location.hash = '#/dashboard'} secondary>Continue</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Page>
  )
}

function Customers({ onSaved }){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const save = async () => {
    await api('/api/customers', { method:'POST', body: JSON.stringify({ name, email }) })
    setName(''); setEmail('')
    if (onSaved) onSaved()
  }
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
  const [customers, setCustomers] = useState([])
  const [customerName, setCustomerName] = useState('')
  useEffect(() => { api('/api/customers').then(setCustomers).catch(()=>{}) }, [])
  const save = async () => {
    await api('/api/orders', { method:'POST', body: JSON.stringify({ customerId, amount }) })
    setAmount('500')
  }
  return (
    <Card title="Add Order">
      <div style={{ display:'grid', gap:16, gridTemplateColumns:'1fr 1fr' }}>
        <div style={{ display:'flex', flexDirection:'column' }}>
          <small style={{ color:t.subtext, marginBottom:6 }}>Customer Email</small>
          <select value={customerId} onChange={e=>{
              const cid = e.target.value; setCustomerId(cid)
              const found = customers.find(c=> String(c.id)===String(cid))
              setCustomerName(found? found.name : '')
          }} style={{ background:t.panel, color:t.text, border:`1px solid rgba(255,255,255,0.15)`, outline:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'10px 12px', height:42, fontSize:14 }}>
            <option value="">Select</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.email}</option>)}
          </select>
          {customerName && <small style={{ color:t.subtext, marginTop:6 }}>Name: {customerName}</small>}
        </div>
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
          <select value={op} onChange={e=>setOp(e.target.value)} style={{ background:t.panel, color:t.text, border:`1px solid rgba(255,255,255,0.15)`, outline:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'10px 12px', height:42, fontSize:14 }}>
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        </div>
      </div>
      {rules.map((r,i)=> (
        <div key={i} style={{ display:'grid', gap:16, gridTemplateColumns:'1fr 1fr 1fr auto', marginTop:8 }}>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <small style={{ color:t.subtext, marginBottom:6 }}>Field</small>
            <select value={r.field} onChange={e=>update(i,'field', e.target.value)} style={{ background:t.panel, color:t.text, border:`1px solid rgba(255,255,255,0.15)`, outline:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'10px 12px', height:42, fontSize:14 }}>
              <option value="totalSpend">Total Spend</option>
              <option value="totalVisits">Total Visits</option>
              <option value="inactiveDays">Inactive Days</option>
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <small style={{ color:t.subtext, marginBottom:6 }}>Operator</small>
            <select value={r.operator} onChange={e=>update(i,'operator', e.target.value)} style={{ background:t.panel, color:t.text, border:`1px solid rgba(255,255,255,0.15)`, outline:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'10px 12px', height:42, fontSize:14 }}>
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
          <thead style={{ background:t.stripe1 }}>
            <tr>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>ID</th>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>Name</th>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.slice().reverse().map((c,i) => (
              <tr key={c.id} style={{ background: i%2? t.stripe1 : t.stripe2 }}>
                <td style={{ padding:'10px 8px' }}>{c.id}</td>
                <td style={{ padding:'10px 8px' }}>{c.name}</td>
                <td style={{ padding:'10px 8px' }}>
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
  const create = async ()=>{ await api('/api/campaigns',{ method:'POST', body: JSON.stringify({ segmentId, name, message })}); alert('Campaign created'); }
  const createAndSend = async ()=>{
    const c = await api('/api/campaigns',{ method:'POST', body: JSON.stringify({ segmentId, name, message })});
    const r = await api(`/api/vendor/send/${c.id}`, { method:'POST' })
    alert(`Sent: ${r.sent}, Failed: ${r.failed}`)
  }
  return (
    <Page>
      <Card title="Create Campaign">
        <div style={{ display:'grid', gap:16, gridTemplateColumns:'1fr 1fr' }}>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <small style={{ color:t.subtext, marginBottom:6 }}>Segment</small>
            <select value={segmentId} onChange={e=>setSegmentId(e.target.value)} style={{ background:t.panel, color:t.text, border:`1px solid rgba(255,255,255,0.15)`, outline:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'10px 12px', height:42, fontSize:14 }}>
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
          <Button onClick={create}>Create</Button>
          <Button secondary onClick={createAndSend}>Create & Send</Button>
        </div>
      </Card>
    </Page>
  )
}

function StatCard({label, value}){
  return <div style={{ background:t.panel, border:`1px solid ${t.border}`, borderRadius:12, padding:22, boxShadow:'0 2px 6px rgba(0,0,0,0.4)' }}>
    <div style={{ color:t.subtext, fontSize:13, marginBottom:8 }}>{label}</div>
    <div style={{ fontSize:30, fontWeight:700, color:t.text }}>{value}</div>
  </div>
}

function Dashboard(){
  const [stats, setStats] = useState({ totalCustomers:0, totalOrders:0, totalCampaigns:0, lastCampaign:{}, totalIncome:0 })
  const [derivedIncome,setDerivedIncome]=useState(0)
  const [campCards,setCampCards] = useState([])
  useEffect(()=>{
    console.log('Dashboard useEffect - making API calls')
    api('/api/dashboard/stats')
      .then(data => {
        console.log('Dashboard stats received:', data)
        setStats(data)
      })
      .catch(err => {
        console.log('Dashboard stats failed:', err)
      })
    
    // Fallback income computed on frontend (sum of customer totalSpend)
    api('/api/customers')
      .then(cs=>{
        console.log('Customers received:', cs)
        const sum = (cs||[]).reduce((acc,c)=> acc + Number(c.totalSpend||0), 0)
        setDerivedIncome(sum)
      })
      .catch(err => {
        console.log('Customers failed:', err)
      })
    
    ;(async()=>{
      try {
        const list = await api('/api/campaigns')
        console.log('Campaigns received:', list)
        const top = list.slice(-8) // look at a few more recent items
        const cards = await Promise.all(top.map(async c=>{
          const s = await api(`/api/campaigns/${c.id}/stats`)
          const pct = s.total ? Math.round((s.sent/s.total)*100) : 0
          return { id:c.id, name:c.name, pct, sent:s.sent, failed:s.failed, total:s.total }
        }))
        const delivered = cards.filter(c => (c.sent + c.failed) > 0)
        setCampCards(delivered.reverse())
      } catch (err) {
        console.log('Campaigns failed:', err)
      }
    })()
  },[])
  const last = stats.lastCampaign || {}
  const sentPct = last.total ? Math.round((last.sent/last.total)*100) : 0
  const lastCampaign = [
    { name: 'Sent', value: last.sent || 0 },
    { name: 'Failed', value: last.failed || 0 }
  ]
  const barCards = campCards.slice(0,6)
  const campaignData = barCards.map(c => ({ name: c.name, success: c.sent, failed: c.failed }))
  return (
    <Page>
      <div style={{ display:'grid', gap:20, gridTemplateColumns:'repeat(4, 1fr)', marginBottom:10 }}>
        <StatCard label="Total Customers" value={stats.totalCustomers} />
        <StatCard label="Total Orders" value={stats.totalOrders} />
        <StatCard label="Income" value={formatINR((derivedIncome||0) > 0 ? derivedIncome : (stats.totalIncome||0))} />
      </div>
      <Card title="Recent Campaigns">
        <div style={{ margin:'4px 0 14px', height:220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={campaignData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d333b" />
              <XAxis dataKey="name" stroke={t.text} tick={{ fontSize: 11 }} />
              <YAxis stroke={t.text} tick={{ fontSize: 11 }} />
              <RTooltip />
              <RLegend />
              <Bar dataKey="success" fill={t.green} radius={[6,6,0,0]} barSize={28} />
              <Bar dataKey="failed" fill={t.red} radius={[6,6,0,0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <DashboardCampaignTable rows={campCards} />
      </Card>
    </Page>
  )
}

function DashboardCampaignTable({ rows }){
  const [hoverIndex, setHoverIndex] = useState(-1)
  return (
    <table style={{ width:'100%', borderCollapse:'collapse', color:t.text }}>
      <thead style={{ background:t.stripe1 }}>
        <tr>
          {['ID','Name','Sent','Failed','Total','Success %'].map(h => (
            <th key={h} style={{ textAlign:'left', padding:'12px 8px', borderBottom:`1px solid ${t.border}`, fontWeight:700 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r,i)=> (
          <tr key={r.id}
              onMouseEnter={()=>setHoverIndex(i)}
              onMouseLeave={()=>setHoverIndex(-1)}
              style={{ background: hoverIndex===i? t.hover : (i%2? t.stripe1 : t.stripe2), transition:'background 120ms ease' }}>
            <td style={{ padding:'10px 8px' }}>{r.id}</td>
            <td style={{ padding:'10px 8px' }}>{r.name}</td>
            <td style={{ padding:'10px 8px', color:t.green }}>{r.sent}</td>
            <td style={{ padding:'10px 8px', color:t.red }}>{r.failed}</td>
            <td style={{ padding:'10px 8px' }}>{r.total}</td>
            <td style={{ padding:'10px 8px' }}>{r.pct}%</td>
          </tr>
        ))}
      </tbody>
    </table>
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
        <input placeholder="Search customers" value={q} onChange={e=>setQ(e.target.value)} style={{ flex:1, background:t.panel, color:t.text, border:`1px solid ${t.border}`, borderRadius:8, padding:'8px 10px', height:40 }} />
        <Button onClick={search}>Search</Button>
      </div>
      <Customers onSaved={search} />
      <Card title="Customers">
        <table style={{ width:'100%', borderCollapse:'collapse', color:t.text }}>
          <thead style={{ background:t.stripe1 }}>
            <tr>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>ID</th>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>Name</th>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>Email</th>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>Spend</th>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>Visits</th>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c,i) => (
              <tr key={c.id} style={{ background: i%2? t.stripe1 : t.stripe2 }}>
                <td style={{ padding:'10px 8px' }}>{c.id}</td>
                <td style={{ padding:'10px 8px' }}>{c.name}</td>
                <td style={{ padding:'10px 8px' }}>{c.email}</td>
                <td style={{ padding:'10px 8px' }}>{c.totalSpend||0}</td>
                <td style={{ padding:'10px 8px' }}>{c.totalVisits||0}</td>
                <td style={{ padding:'10px 8px' }}>{c.lastActiveAt||''}</td>
              </tr>
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
  const [selectedName,setSelectedName]=useState('')
  const [amount,setAmount]=useState('500')
  const [rows,setRows]=useState([])
  const load = async ()=>{
    const cs = await api('/api/customers'); setCustomers(cs)
    // If a customer is selected, show that customer's orders; else show all
    if (customerId) {
      setRows(await api(`/api/orders?customerId=${encodeURIComponent(customerId)}`))
    } else {
      setRows(await api('/api/orders'))
    }
  }
  useEffect(()=>{ load() },[])
  const save = async ()=>{ await api('/api/orders',{ method:'POST', body: JSON.stringify({ customerId, amount })}); setAmount('500'); await load() }
  return (
    <Page>
      <Card title="Add Order">
        <div style={{ display:'grid', gap:16, gridTemplateColumns:'1fr 1fr' }}>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <small style={{ color:t.subtext, marginBottom:6 }}>Customer Email</small>
            <select value={customerId} onChange={async e=>{ const id=e.target.value; setCustomerId(id); const f=customers.find(c=> String(c.id)===String(id)); setSelectedName(f? f.name : ''); const data = id? await api(`/api/orders?customerId=${encodeURIComponent(id)}`) : await api('/api/orders'); setRows(data) }} style={{ background:t.panel, color:t.text, border:`1px solid ${t.border}`, borderRadius:8, padding:'8px 10px', height:40 }}>
              <option value="">Select</option>
              {customers.map(c=> <option key={c.id} value={c.id}>{c.email}</option>)}
            </select>
            {selectedName && <small style={{ color:t.subtext, marginTop:6 }}>Name: {selectedName}</small>}
          </div>
          <Input label="Amount (₹)" value={amount} onChange={e=>setAmount(e.target.value)} />
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:10 }}>
          <Button onClick={save}>Save</Button>
        </div>
      </Card>
      <Card title="Orders">
        <table style={{ width:'100%', borderCollapse:'collapse', color:t.text }}>
          <thead style={{ background:t.stripe1 }}>
            <tr>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>ID</th>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>Customer</th>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>Amount</th>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o,i) => (
              <tr key={o.id} style={{ background: i%2? t.stripe1 : t.stripe2 }}>
                <td style={{ padding:'10px 8px' }}>{o.id}</td>
                <td style={{ padding:'10px 8px' }}>{o.customerName}</td>
                <td style={{ padding:'10px 8px' }}>{o.amount}</td>
                <td style={{ padding:'10px 8px' }}>{o.date||''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Page>
  )
}

function CampaignHistoryPage(){
  const [rows,setRows]=useState([])
  useEffect(()=>{ (async()=>{
    const list = await api('/api/campaigns')
    const withStats = await Promise.all(list.map(async c=>{
      const s = await api(`/api/campaigns/${c.id}/stats`)
      const pct = s.total ? Math.round((s.sent/s.total)*100) : 0
      return { id:c.id, name:c.name, total:s.total, sent:s.sent, failed:s.failed, pct }
    }))
    // Show only campaigns that have at least one delivered (sent or failed)
    setRows(withStats.filter(r => (r.sent + r.failed) > 0).reverse())
  })() },[])
  return (
    <Page>
      <Card title="Campaign History">
        <table style={{ width:'100%', borderCollapse:'collapse', color:t.text }}>
          <thead style={{ background:t.stripe1 }}>
            <tr>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>ID</th>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>Name</th>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>Sent</th>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>Failed</th>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>Total</th>
              <th style={{ textAlign:'left', padding:'10px 8px', borderBottom:`1px solid ${t.border}` }}>Success %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=> (
              <tr key={r.id} style={{ background: i%2? t.stripe1 : t.stripe2 }}>
                <td style={{ padding:'10px 8px' }}>{r.id}</td>
                <td style={{ padding:'10px 8px' }}>{r.name}</td>
                <td style={{ padding:'10px 8px', color:t.green }}>{r.sent}</td>
                <td style={{ padding:'10px 8px', color:t.red }}>{r.failed}</td>
                <td style={{ padding:'10px 8px' }}>{r.total}</td>
                <td style={{ padding:'10px 8px' }}>{r.pct}%</td>
              </tr>
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
          {suggestions.map((s,i)=> (
            <div key={i} style={{ background:t.panel, border:`1px solid ${t.border}`, borderRadius:12, padding:12 }}>
              {s}
            </div>
          ))}
        </div>
      </Card>
    </Page>
  )
}

function Sidebar(){
  const Item = ({href, label}) => <a href={href} style={{ color:t.text, textDecoration:'none', padding:'12px 14px', display:'block', borderLeft:'3px solid transparent' }}>{label}</a>
  return (
    <div style={{ width:220, background:t.bg, minHeight:'calc(100vh - 60px)', borderRight:`1px solid ${t.border}` }}>
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
  const [toast,setToast]=useState('')
  // lightweight toast helper
  window.showToast = (msg, type)=>{ setToast(JSON.stringify({msg, type:type||'info'})); setTimeout(()=>setToast(''), 2500) }
  useEffect(()=>{
    const onHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const [isAuthed,setIsAuthed]=useState(null) // null = checking, false = not authed, true = authed
  
  useEffect(() => {
    // AUTHENTICATION DISABLED - ALWAYS SET TO AUTHENTICATED
    console.log('Authentication disabled - always setting to authenticated')
    setIsAuthed(true)
  }, [])
  
  // AUTHENTICATION DISABLED - NO OAUTH HANDLING NEEDED
  useEffect(()=>{
    // ensure no white borders/background
    document.documentElement.style.background = t.bg
    document.body.style.background = t.bg
    document.body.style.margin = '0'
  }, [])
  const doLogout = async ()=>{
    try { 
      await fetch(withBase('/logout'), { method:'POST', credentials:'include' })
      console.log('Logout request sent')
    } catch(e) {
      console.log('Logout request failed:', e)
    }
    setIsAuthed(false)
    window.location.hash = '#/'
    if (window.showToast) window.showToast('Signed out', 'error')
  }
  const isProtected = (r)=> ['#/dashboard','#/customers','#/orders','#/segment','#/create-campaign','#/campaigns','#/ai'].some(p=> (r||'').startsWith(p))
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
      <header style={{ height:60, padding:'0 20px', background:t.bg, borderBottom:`1px solid ${t.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontWeight:800, letterSpacing:0.5, color:t.text }}>Xeno Mini CRM</div>
        <nav style={{ display:'flex', gap:12, alignItems:'center' }}>
          <a href="#/" style={{ color:t.subtext, textDecoration:'none' }}>Login</a>
          <a href="#/dashboard" onClick={(e)=>{ if(isAuthed !== true){ e.preventDefault(); window.location.hash='#/'; if(window.showToast) window.showToast('Please sign in', 'error') } }} style={{ color:t.subtext, textDecoration:'none' }}>Dashboard</a>
          {isAuthed === true && (
            <button onClick={doLogout} style={{ marginLeft:12, background:'transparent', color:t.text, border:`1px solid ${t.border}`, borderRadius:8, padding:'8px 12px', cursor:'pointer' }}>Logout</button>
          )}
        </nav>
      </header>
      {toast && (()=>{ const {msg,type} = JSON.parse(toast); const styles = type==='success'
          ? { bg:'#0f2a17', fg:'#86efac', bd:'#134e21' }
          : type==='error'
            ? { bg:'#2a1111', fg:'#fecaca', bd:'#4b1a1a' }
            : { bg:'#11171e', fg:t.text, bd:t.border };
        return (
        <div style={{ position:'fixed', top:14, right:14, background:styles.bg, color:styles.fg, border:`1px solid ${styles.bd}`, borderRadius:10, padding:'10px 14px 10px 12px', boxShadow:'0 8px 18px rgba(0,0,0,0.4)', zIndex:1000, display:'flex', alignItems:'center', gap:10, transition:'all 150ms ease' }}>
          <div style={{ width:4, alignSelf:'stretch', borderRadius:4, background: type==='success'? '#22c55e' : (type==='error' ? '#ef4444' : '#334155') }} />
          <div>{msg}</div>
        </div>
        )})()}
      { isAuthed === null ? (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'60vh' }}>
            <div style={{ color:t.subtext }}>Loading...</div>
          </div>
        ) : isAuthed === false || route==='#/' || route==='#' ? (
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


