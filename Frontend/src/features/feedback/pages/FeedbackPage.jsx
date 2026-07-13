import { MessageSquareHeart, Star } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import Input from '../../../shared/components/ui/Input.jsx'
import Select from '../../../shared/components/ui/Select.jsx'
import Textarea from '../../../shared/components/ui/Textarea.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { feedbackService } from '../services/feedbackService.js'

export default function FeedbackPage() {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', rating: 5, category: 'general', message: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  function updateField(event){ setForm((c)=>({...c,[event.target.name]:event.target.value})) }
  async function handleSubmit(event){ event.preventDefault(); setSubmitting(true); setError(''); setSuccess(''); try{ const r=await feedbackService.submitFeedback({...form,rating:Number(form.rating)}); setSuccess(r.data.message||'Thank you for your feedback.'); toast.success('Thank you for your feedback.'); setForm((c)=>({...c,message:'',rating:5,category:'general'})) }catch(e){ const m=getApiErrorMessage(e,'Unable to submit feedback.'); setError(m); toast.error(m) }finally{ setSubmitting(false) } }
  return <div><section className="bg-gradient-to-r from-teal-700 to-slate-950 text-white"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><MessageSquareHeart className="h-10 w-10 text-teal-200"/><h1 className="mt-5 text-4xl font-black md:text-6xl">Help us improve</h1><p className="mt-4 max-w-2xl text-slate-200">Tell us what works, what feels confusing, and what would make the platform better for you.</p></div></section><PageContainer><div className="grid gap-8 lg:grid-cols-[1fr_520px]"><div className="grid gap-4">{['Fast event discovery','Useful notifications','Better organizer tools'].map((item,index)=><Card key={item}><div className="flex gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Star className="h-5 w-5"/></span><div><h2 className="font-bold text-slate-950">{item}</h2><p className="mt-1 text-sm text-slate-600">Your feedback helps us prioritize improvements that matter to real users.</p></div></div></Card>)}</div><Card><h2 className="text-xl font-bold text-slate-950">Share feedback</h2>{error&&<div className="mt-4"><Alert type="error">{error}</Alert></div>}{success&&<div className="mt-4"><Alert type="success">{success}</Alert></div>}<form onSubmit={handleSubmit} className="mt-5 grid gap-4"><div className="grid gap-4 md:grid-cols-2"><Input name="name" value={form.name} onChange={updateField} placeholder="Your name"/><Input name="email" type="email" value={form.email} onChange={updateField} placeholder="Your email"/></div><div className="grid gap-4 md:grid-cols-2"><Select name="rating" value={form.rating} onChange={updateField}>{[5,4,3,2,1].map(r=><option key={r} value={r}>{r} star{r>1?'s':''}</option>)}</Select><Select name="category" value={form.category} onChange={updateField}><option value="general">General feedback</option><option value="bug">Bug report</option><option value="feature">Feature request</option><option value="design">Design/UI</option><option value="performance">Performance</option></Select></div><Textarea name="message" value={form.message} onChange={updateField} rows="6" placeholder="Tell us what you think..."/><Button type="submit" disabled={submitting}>{submitting?'Submitting...':'Submit Feedback'}</Button></form></Card></div></PageContainer></div>
}
