import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { supabase } from './lib/supabase'

// ---------- Date helpers ----------
const TODAY = (() => {
  const t = new Date()
  return new Date(t.getFullYear(), t.getMonth(), t.getDate())
})()

function startOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}
function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}
function parseISO(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function toISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function formatLong(date) {
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}
function formatEventDate(date) {
  return {
    weekday: WEEKDAYS[date.getDay()],
    main: `${MONTHS[date.getMonth()].slice(0, 3)} ${date.getDate()}`,
  }
}
function formatRange(a, b) {
  const sameMonth = a.getMonth() === b.getMonth()
  if (sameMonth) return `${MONTHS[a.getMonth()].slice(0,3)} ${a.getDate()} – ${b.getDate()}`
  return `${MONTHS[a.getMonth()].slice(0,3)} ${a.getDate()} – ${MONTHS[b.getMonth()].slice(0,3)} ${b.getDate()}`
}

const THIS_WEEK_START = startOfWeek(TODAY)
const NEXT_WEEK_START = addDays(THIS_WEEK_START, 7)
const FUTURE_START = addDays(THIS_WEEK_START, 14)

function bucketFor(iso) {
  const d = parseISO(iso)
  if (!d) return 'future'
  if (d < THIS_WEEK_START) return 'past'
  if (d < NEXT_WEEK_START) return 'this'
  if (d < FUTURE_START) return 'next'
  return 'future'
}

// ---------- Icons ----------
const IconCheck = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 12 10 18 20 6"/></svg>
)
const IconPlus = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
)
const IconTrash = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
)
const IconPencil = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
)
const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
)
const IconClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
)
const IconClose = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
)

// ---------- Auth Gate ----------
function AuthGate({ onSignedIn }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="auth-gate">
      <div className="auth-card">
        <h1>Tina's Page</h1>
        <p className="auth-lead">Sign in to view and manage the page.</p>
        {sent ? (
          <div className="auth-success">
            Check your email — we sent a sign-in link to <strong>{email}</strong>.
          </div>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              type="email"
              className="field"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            {error && <p style={{ color: 'oklch(0.55 0.18 25)', fontSize: 18, margin: '4px 0 0' }}>{error}</p>}
            <button type="submit" className="btn primary" style={{ marginTop: 8 }} disabled={loading}>
              {loading ? 'Sending…' : 'Send sign-in link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ---------- Schedule ----------
function ScheduleSection({ events, userEmail, onAdd, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const editingEvent = useMemo(() => events.find(ev => ev.id === editingId) || null, [events, editingId])

  const buckets = useMemo(() => {
    const result = { this: [], next: [], future: [] }
    ;[...events]
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach(e => {
        const b = bucketFor(e.date)
        if (b !== 'past') result[b].push(e)
      })
    return result
  }, [events])

  return (
    <section className="block">
      <div className="section-head">
        <h2>Schedule</h2>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn primary" onClick={() => setOpen(true)}>
            <IconPlus /> Add an event
          </button>
        </div>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <button className="modal-close" onClick={() => setOpen(false)} aria-label="Close"><IconClose /></button>
            <div className="panel-body">
              <h2>Add an event</h2>
              <EventForm submitLabel="Save event" onSave={async (ev) => { await onAdd(ev); setOpen(false) }} onCancel={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
      {editingEvent && (
        <div className="modal-backdrop" onClick={() => setEditingId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <button className="modal-close" onClick={() => setEditingId(null)} aria-label="Close"><IconClose /></button>
            <div className="panel-body">
              <h2>Edit event</h2>
              <EventForm submitLabel="Save changes" initial={editingEvent} onSave={async (ev) => { await onUpdate(editingEvent.id, ev); setEditingId(null) }} onCancel={() => setEditingId(null)} />
            </div>
          </div>
        </div>
      )}

      <ScheduleGroup title="This Week" sub={formatRange(THIS_WEEK_START, addDays(THIS_WEEK_START, 6))} events={buckets.this} onEdit={setEditingId} onDelete={onDelete} />
      <ScheduleGroup title="Next Week" sub={formatRange(NEXT_WEEK_START, addDays(NEXT_WEEK_START, 6))} events={buckets.next} onEdit={setEditingId} onDelete={onDelete} />
      <ScheduleGroup title="Future" sub="Anything after that" events={buckets.future} onEdit={setEditingId} onDelete={onDelete} />
    </section>
  )
}

function ScheduleGroup({ title, sub, events, onEdit, onDelete }) {
  const confirmDelete = (e) => {
    if (window.confirm(`Delete event "${e.title}"?`)) onDelete(e.id)
  }
  return (
    <div className="schedule-group">
      <h3>{title}<span className="sub">{sub}</span></h3>
      {events.length === 0 ? (
        <div className="empty">Nothing scheduled.</div>
      ) : events.map(e => {
        const d = parseISO(e.date)
        const f = formatEventDate(d)
        return (
          <div className="event" key={e.id}>
            <div className="date">
              <span className="weekday">{f.weekday}</span>
              {f.main}
            </div>
            <div className="body">
              <p className="title">{e.title}</p>
              {e.description && <p className="desc">{e.description}</p>}
            </div>
            <div className="actions">
              <button className="icon-btn" onClick={() => onEdit(e.id)} title="Edit event"><IconPencil /></button>
              <button className="icon-btn danger" onClick={() => confirmDelete(e)} title="Delete event"><IconTrash /></button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EventForm({ initial, submitLabel, onSave, onCancel }) {
  const [date, setDate] = useState(initial?.date || toISO(addDays(TODAY, 1)))
  const [title, setTitle] = useState(initial?.title || '')
  const [desc, setDesc] = useState(initial?.description || '')
  const titleRef = useRef(null)
  useEffect(() => { titleRef.current?.focus() }, [])

  const submit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({ date, title: title.trim(), description: desc.trim() })
  }

  return (
    <form onSubmit={submit}>
      <div className="add-event-grid">
        <label htmlFor="ev-date">Date</label>
        <input id="ev-date" type="date" className="field" value={date} onChange={e => setDate(e.target.value)} required />
        <label htmlFor="ev-title">What is it?</label>
        <input id="ev-title" ref={titleRef} type="text" className="field" placeholder="e.g. Doctor appointment" value={title} onChange={e => setTitle(e.target.value)} required />
        <label htmlFor="ev-desc">Notes (optional)</label>
        <textarea id="ev-desc" className="field" placeholder="Time, address, who's going, anything to bring…" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn primary">{submitLabel}</button>
      </div>
    </form>
  )
}

// ---------- To Do ----------
function TodoSection({ todos, onToggle, onAdd, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const editingTodo = useMemo(() => todos.find(t => t.id === editingId) || null, [todos, editingId])

  const sorted = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    const open = todos.filter(t => !t.done)
    const done = todos.filter(t => t.done && t.done_at && new Date(t.done_at).getTime() >= cutoff)
    return [...open, ...done]
  }, [todos])

  return (
    <section className="block">
      <div className="section-head">
        <h2>To Do</h2>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn primary" onClick={() => setOpen(true)}>
            <IconPlus /> Add a task
          </button>
        </div>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <button className="modal-close" onClick={() => setOpen(false)} aria-label="Close"><IconClose /></button>
            <div className="panel-body">
              <h2>Add a task</h2>
              <TodoForm submitLabel="Save task" onSave={async (t) => { await onAdd(t); setOpen(false) }} onCancel={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
      {editingTodo && (
        <div className="modal-backdrop" onClick={() => setEditingId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <button className="modal-close" onClick={() => setEditingId(null)} aria-label="Close"><IconClose /></button>
            <div className="panel-body">
              <h2>Edit task</h2>
              <TodoForm submitLabel="Save changes" initial={editingTodo} onSave={async (t) => { await onUpdate(editingTodo.id, t); setEditingId(null) }} onCancel={() => setEditingId(null)} />
            </div>
          </div>
        </div>
      )}

      <div className="todo-list">
        {sorted.length === 0 && <div className="empty">No tasks yet.</div>}
        {sorted.map(t => (
          <div className={'todo' + (t.done ? ' done' : '')} key={t.id}>
            <button
              className={'check' + (t.done ? ' checked' : '')}
              onClick={() => onToggle(t.id)}
              aria-pressed={t.done}
              aria-label={t.done ? `Mark "${t.title}" not done` : `Mark "${t.title}" done`}
            >
              {t.done && <IconCheck />}
            </button>
            <div>
              <p className="title">{t.title}</p>
              {t.description && <p className="desc">{t.description}</p>}
              <span className="assignee">{t.done ? 'Done · ' : ''}{t.assignee}</span>
            </div>
            <div className="actions">
              <button className="icon-btn" onClick={() => setEditingId(t.id)} title="Edit task"><IconPencil /></button>
              <button className="icon-btn danger" onClick={() => { if (window.confirm(`Delete task "${t.title}"?`)) onDelete(t.id) }} title="Delete task"><IconTrash /></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function TodoForm({ initial, submitLabel, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [desc, setDesc] = useState(initial?.description || '')
  const [assignee, setAssignee] = useState(initial?.assignee || 'Tina')
  const titleRef = useRef(null)
  useEffect(() => { titleRef.current?.focus() }, [])

  const submit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({ title: title.trim(), description: desc.trim(), assignee: assignee || 'Tina' })
  }

  return (
    <form onSubmit={submit}>
      <div className="add-event-grid">
        <label htmlFor="td-title">What needs doing?</label>
        <input id="td-title" ref={titleRef} type="text" className="field" placeholder="e.g. Pick up prescription" value={title} onChange={e => setTitle(e.target.value)} required />
        <label htmlFor="td-desc">Notes (optional)</label>
        <textarea id="td-desc" className="field" placeholder="Details, where, when…" value={desc} onChange={e => setDesc(e.target.value)} />
        <label>Who is doing it?</label>
        <div className="assignee-picker">
          {['Tina', 'David', 'Jason'].map(name => (
            <button type="button" key={name} className={'assignee-btn' + (assignee === name ? ' active' : '')} onClick={() => setAssignee(name)} aria-pressed={assignee === name}>
              {name}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn primary">{submitLabel}</button>
      </div>
    </form>
  )
}

// ---------- Projects ----------
function ProjectModal({ mode, initialTitle, initialNotes, onSave, onClose }) {
  const [title, setTitle] = useState(initialTitle || '')
  const [notes, setNotes] = useState(initialNotes || '')
  const titleRef = useRef(null)
  useEffect(() => { titleRef.current?.focus() }, [])

  const submit = (e) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    onSave({ title: t, notes: notes.trim() })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close"><IconClose /></button>
        <div className="panel-body">
          <h2>{mode === 'edit' ? 'Edit project' : 'Add a project'}</h2>
          <form onSubmit={submit}>
            <div className="add-event-grid">
              <label htmlFor="pj-title">Project name</label>
              <input id="pj-title" ref={titleRef} type="text" className="field" placeholder="e.g. Garden renovation" value={title} onChange={e => setTitle(e.target.value)} required />
              <label htmlFor="pj-notes">Notes (optional)</label>
              <textarea id="pj-notes" className="field" placeholder="Anything you want to remember about this project…" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
              <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn primary">{mode === 'edit' ? 'Save changes' : 'Save project'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function ProjectsSection({ projects, onUpdateNotes, onUpdate, onDelete, onAdd }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const editingProject = useMemo(() => projects.find(p => p.id === editingId) || null, [projects, editingId])

  return (
    <section className="block">
      <div className="section-head">
        <h2>Projects</h2>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn primary" onClick={() => setAdding(true)}>
            <IconPlus /> Add a project
          </button>
        </div>
      </div>
      {adding && (
        <ProjectModal mode="add" onSave={async ({ title, notes }) => { await onAdd({ title, notes }); setAdding(false) }} onClose={() => setAdding(false)} />
      )}
      {editingProject && (
        <ProjectModal mode="edit" initialTitle={editingProject.title} initialNotes={editingProject.notes} onSave={async ({ title, notes }) => { await onUpdate(editingProject.id, { title, notes }); setEditingId(null) }} onClose={() => setEditingId(null)} />
      )}
      <div className="projects">
        {projects.map(p => (
          <ProjectCard key={p.id} project={p} onChangeNotes={(v) => onUpdateNotes(p.id, v)} onEdit={() => setEditingId(p.id)} onDelete={() => onDelete(p.id)} />
        ))}
      </div>
    </section>
  )
}

function ProjectCard({ project, onChangeNotes, onEdit, onDelete }) {
  const [savedVisible, setSavedVisible] = useState(false)
  const timer = useRef(null)

  const handleNotes = (v) => {
    onChangeNotes(v)
    setSavedVisible(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setSavedVisible(false), 1200)
  }

  const confirmDelete = () => {
    if (window.confirm(`Archive project "${project.title}"?`)) onDelete()
  }

  return (
    <div className="project">
      <div className="project-head">
        <div className="pkicker">Project</div>
        <div className="project-tools">
          <button className="icon-btn" onClick={onEdit} title="Edit project"><IconPencil /></button>
          <button className="icon-btn danger" onClick={confirmDelete} title="Delete project"><IconTrash /></button>
        </div>
      </div>
      <h3>{project.title}</h3>
      <textarea value={project.notes} onChange={e => handleNotes(e.target.value)} placeholder="Write anything you want to remember about this…" aria-label={`Notes for ${project.title}`} />
      <div className={'saved' + (savedVisible ? ' visible' : '')}>Saved ✓</div>
    </div>
  )
}

// ---------- Top Menu ----------
function TopMenu({ userEmail, history, onSignOut }) {
  const [panel, setPanel] = useState(null)

  return (
    <>
      <nav className="topmenu">
        <button className="topmenu-btn" onClick={() => setPanel('history')}>
          <IconClock /> History
        </button>
        <button className="topmenu-btn" onClick={() => setPanel('account')}>
          <IconUser /> {userEmail}
        </button>
      </nav>
      {panel && (
        <div className="modal-backdrop" onClick={() => setPanel(null)}>
          <div className={'modal' + (panel === 'history' ? ' wide' : '')} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <button className="modal-close" onClick={() => setPanel(null)} aria-label="Close"><IconClose /></button>
            {panel === 'history'
              ? <HistoryPanel entries={history} />
              : <AccountPanel userEmail={userEmail} onSignOut={onSignOut} onClose={() => setPanel(null)} />
            }
          </div>
        </div>
      )}
    </>
  )
}

function AccountPanel({ userEmail, onSignOut, onClose }) {
  return (
    <div className="panel-body">
      <h2>Account</h2>
      <p className="panel-lead">Signed in as <strong>{userEmail}</strong></p>
      <button className="btn danger" onClick={async () => { await supabase.auth.signOut(); onSignOut(); onClose() }}>
        Sign out
      </button>
    </div>
  )
}

function HistoryPanel({ entries }) {
  const fmt = (iso) => {
    const d = new Date(iso)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const yy = String(d.getFullYear()).slice(-2)
    return `${mm}-${dd}-${yy}`
  }
  return (
    <div className="panel-body">
      <h2>History</h2>
      <p className="panel-lead">Recent activity on this page.</p>
      {(!entries || entries.length === 0) ? (
        <p className="panel-note">Nothing here yet.</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Date</th>
              <th>Title</th>
              <th>User</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((it, i) => (
              <tr key={i}>
                <td><span className="history-kind">{it.type} {it.action}</span></td>
                <td className="history-date">{fmt(it.at)}</td>
                <td className="history-text">{it.title}</td>
                <td className="history-who">{it.who}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ---------- App ----------
export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [events, setEvents] = useState([])
  const [todos, setTodos] = useState([])
  const [projects, setProjects] = useState([])
  const [history, setHistory] = useState([])

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  // Load data once signed in
  useEffect(() => {
    if (!session) return
    Promise.all([
      supabase.from('events').select('*').is('deleted_at', null).order('date'),
      supabase.from('todos').select('*').is('deleted_at', null).order('position'),
      supabase.from('projects').select('*').is('deleted_at', null).order('position'),
      supabase.from('history').select('*').order('at', { ascending: false }).limit(100),
    ]).then(([ev, td, pr, hi]) => {
      if (ev.data) setEvents(ev.data)
      if (td.data) setTodos(td.data)
      if (pr.data) setProjects(pr.data)
      if (hi.data) setHistory(hi.data)
    })
  }, [session])

  // Refetch all data — used by both the visibility handler and realtime callbacks
  const refetchAll = useCallback(() => {
    supabase.from('events').select('*').is('deleted_at', null).order('date').then(({ data }) => data && setEvents(data))
    supabase.from('todos').select('*').is('deleted_at', null).order('position').then(({ data }) => data && setTodos(data))
    supabase.from('projects').select('*').is('deleted_at', null).order('position').then(({ data }) => data && setProjects(data))
    supabase.from('history').select('*').order('at', { ascending: false }).limit(100).then(({ data }) => data && setHistory(data))
  }, [])

  // Refetch when tab becomes visible again (covers dropped websockets while backgrounded)
  useEffect(() => {
    if (!session) return
    const onVisible = () => { if (document.visibilityState === 'visible') refetchAll() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [session, refetchAll])

  // Realtime subscriptions — keep all clients in sync
  useEffect(() => {
    if (!session) return
    const channel = supabase
      .channel('shared-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, refetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, refetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, refetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'history' }, refetchAll)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [session, refetchAll])

  const userEmail = session?.user?.email || ''
  const who = userEmail

  const log = useCallback(async (type, action, title, targetId) => {
    await supabase.from('history').insert({ type, action, title, target_id: targetId, who, at: new Date().toISOString() })
  }, [who])

  // Events
  const addEvent = async (ev) => {
    const { data } = await supabase.from('events').insert({ ...ev, id: 'e' + Date.now() }).select().single()
    if (data) { setEvents(prev => [...prev, data]); log('Event', 'added', ev.title, data.id) }
  }
  const updateEvent = async (id, patch) => {
    await supabase.from('events').update(patch).eq('id', id)
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))
    log('Event', 'edited', patch.title || events.find(e => e.id === id)?.title || '', id)
  }
  const deleteEvent = async (id) => {
    const ev = events.find(e => e.id === id)
    await supabase.from('events').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
    if (ev) log('Event', 'archived', ev.title, id)
  }

  // Todos
  const addTodo = async (t) => {
    const { data } = await supabase.from('todos').insert({ ...t, id: 't' + Date.now(), done: false, position: todos.length }).select().single()
    if (data) { setTodos(prev => [data, ...prev]); log('Todo', 'added', t.title, data.id) }
  }
  const toggleTodo = async (id) => {
    const t = todos.find(t => t.id === id)
    if (!t) return
    const done_at = t.done ? null : new Date().toISOString()
    await supabase.from('todos').update({ done: !t.done, done_at }).eq('id', id)
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done, done_at } : t))
    log('Todo', t.done ? 'reopened' : 'completed', t.title, id)
  }
  const updateTodo = async (id, patch) => {
    await supabase.from('todos').update(patch).eq('id', id)
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
    log('Todo', 'edited', patch.title || todos.find(t => t.id === id)?.title || '', id)
  }
  const deleteTodo = async (id) => {
    const t = todos.find(t => t.id === id)
    await supabase.from('todos').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    setTodos(prev => prev.filter(t => t.id !== id))
    if (t) log('Todo', 'archived', t.title, id)
  }

  // Projects
  const addProject = async ({ title, notes }) => {
    const { data } = await supabase.from('projects').insert({ id: 'p' + Date.now(), title, notes, position: projects.length }).select().single()
    if (data) { setProjects(prev => [...prev, data]); log('Project', 'added', title, data.id) }
  }
  const updateProject = async (id, patch) => {
    await supabase.from('projects').update(patch).eq('id', id)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
    log('Project', 'edited', patch.title || projects.find(p => p.id === id)?.title || '', id)
  }
  const updateProjectNotes = async (id, notes) => {
    // Debounced autosave — optimistic update only, no history log
    setProjects(prev => prev.map(p => p.id === id ? { ...p, notes } : p))
    await supabase.from('projects').update({ notes }).eq('id', id)
  }
  const deleteProject = async (id) => {
    const p = projects.find(p => p.id === id)
    await supabase.from('projects').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
    if (p) log('Project', 'archived', p.title, id)
  }

  if (session === undefined) return <div className="loading-screen">Loading…</div>
  if (!session) return <AuthGate />

  return (
    <div className="page">
      <TopMenu userEmail={userEmail} history={history} onSignOut={() => setSession(null)} />
      <header className="masthead">
        <h1>Tina's Page</h1>
        <div className="today">Today is {formatLong(TODAY)}</div>
      </header>
      <ScheduleSection events={events} userEmail={userEmail} onAdd={addEvent} onUpdate={updateEvent} onDelete={deleteEvent} />
      <TodoSection todos={todos} onToggle={toggleTodo} onAdd={addTodo} onUpdate={updateTodo} onDelete={deleteTodo} />
      <ProjectsSection projects={projects} onUpdateNotes={updateProjectNotes} onUpdate={updateProject} onDelete={deleteProject} onAdd={addProject} />
    </div>
  )
}
