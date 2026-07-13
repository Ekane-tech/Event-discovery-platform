import { toast } from 'sonner'
import { Camera, CheckCircle2, Keyboard, QrCode, RefreshCw, UserCheck, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../shared/components/layout/SectionHeader.jsx'
import { formatDate } from '../../../shared/utils/formatDate.js'
import { ticketService } from '../services/ticketService.js'
import { eventService } from '../../events/services/eventService.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'

function extractTicketNumber(value) {
  const text = String(value || '').trim()
  if (!text) return ''

  try {
    const url = new URL(text)
    const parts = url.pathname.split('/').filter(Boolean)
    const verifyIndex = parts.findIndex((part) => part === 'verify')
    if (verifyIndex >= 0 && parts[verifyIndex + 1]) return decodeURIComponent(parts[verifyIndex + 1])
  } catch {
    // Plain ticket numbers are allowed.
  }

  const marker = '/tickets/verify/'
  if (text.includes(marker)) return decodeURIComponent(text.split(marker).pop().split(/[?#]/)[0])
  return text
}

export default function TicketScannerPage() {
  const { id } = useParams()
  const location = useLocation()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const detectorRef = useRef(null)
  const scanningRef = useRef(false)
  const lastScanRef = useRef('')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraMessage, setCameraMessage] = useState('')
  const [manualTicket, setManualTicket] = useState('')
  const [verification, setVerification] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)

  function stopCamera() {
    scanningRef.current = false
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  useEffect(() => () => stopCamera(), [])

  async function verifyTicket(rawValue, force = false) {
    const ticketNumber = extractTicketNumber(rawValue)
    if (!ticketNumber) return

    if (!force && ticketNumber === lastScanRef.current && verification) return
    lastScanRef.current = ticketNumber
    setVerifying(true)
    setVerification(null)

    try {
      const response = await ticketService.verifyTicket(ticketNumber)
      const data = response.data
      const scannedEventId = Number(data.ticket?.event?.id)
      if (id && scannedEventId && scannedEventId !== Number(id)) {
        setVerification({ ...data, valid: false, message: 'This ticket belongs to a different event.' })
      } else {
        setVerification(data)
      }
    } catch (verifyError) {
      if (verifyError.response?.data) setVerification(verifyError.response.data)
      else toast.error(getApiErrorMessage(verifyError, 'Unable to verify ticket.'))
    } finally {
      setVerifying(false)
    }
  }

  async function startCamera() {
    setCameraMessage('')
    setVerification(null)
    lastScanRef.current = ''

    if (!('BarcodeDetector' in window)) {
      setCameraMessage('Camera scanning is not supported by this browser. Use manual ticket entry below.')
      return
    }

    try {
      detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] })
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      scanningRef.current = true
      setCameraActive(true)
      scanLoop()
    } catch (cameraError) {
      setCameraMessage('Camera access was blocked or unavailable. Use manual ticket entry below.')
    }
  }

  async function scanLoop() {
    if (!scanningRef.current || !videoRef.current || !detectorRef.current) return

    try {
      const codes = await detectorRef.current.detect(videoRef.current)
      if (codes.length > 0) {
        const value = codes[0].rawValue
        stopCamera()
        await verifyTicket(value)
        return
      }
    } catch {
      // Keep scanning unless the camera is stopped.
    }

    window.requestAnimationFrame(scanLoop)
  }

  async function handleManualSubmit(event) {
    event.preventDefault()
    await verifyTicket(manualTicket)
  }

  async function handleCheckIn() {
    const registrationId = verification?.ticket?.registration_id
    if (!registrationId) return toast.error('Registration not found for this ticket.')

    setCheckingIn(true)
    try {
      await eventService.checkInRegistration(registrationId)
      toast.success('Attendee checked in.')
      await verifyTicket(verification.ticket.ticket_number, true)
    } catch (checkInError) {
      toast.error(getApiErrorMessage(checkInError, 'Unable to check in attendee.'))
    } finally {
      setCheckingIn(false)
    }
  }

  const isAdminPath = location.pathname.startsWith('/admin')
  const attendeesPath = isAdminPath ? `/admin/events/${id}/attendees` : `/organizer/events/${id}/attendees`
  const ticket = verification?.ticket
  const valid = Boolean(verification?.valid)
  const alreadyCheckedIn = Boolean(ticket?.checked_in_at)
  const StatusIcon = valid ? CheckCircle2 : XCircle

  return (
    <PageContainer>
      <SectionHeader
        title="Ticket scanner"
        description="Scan attendee QR codes, verify tickets and check attendees in at the entrance."
        action={<Link to={attendeesPath}><Button variant="secondary">Back to attendees</Button></Link>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="overflow-hidden">
          <div className="rounded-3xl bg-gradient-to-br from-slate-950 to-teal-800 p-5 text-white">
            <QrCode className="h-9 w-9 text-teal-100" />
            <h2 className="mt-4 text-2xl font-black">Scan QR code</h2>
            <p className="mt-2 text-sm leading-6 text-slate-200">Use a phone or laptop camera. If the browser does not support camera QR detection, enter the ticket number manually.</p>
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl bg-slate-950">
            <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
          </div>

          {cameraMessage && <div className="mt-4"><Alert type="warning">{cameraMessage}</Alert></div>}

          <div className="mt-4 flex flex-wrap gap-2">
            {!cameraActive ? (
              <Button type="button" onClick={startCamera}><Camera className="mr-2 h-4 w-4" />Start camera scanner</Button>
            ) : (
              <Button type="button" variant="danger" onClick={stopCamera}>Stop camera</Button>
            )}
            <Button type="button" variant="secondary" onClick={() => { setVerification(null); lastScanRef.current = ''; setManualTicket('') }}>
              <RefreshCw className="mr-2 h-4 w-4" />Reset
            </Button>
          </div>

          <form onSubmit={handleManualSubmit} className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-800"><Keyboard className="h-4 w-4" /> Manual ticket entry</span>
              <input value={manualTicket} onChange={(event) => setManualTicket(event.target.value)} placeholder="CM-EVT-3-AB12CD34 or full verification URL" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500" />
            </label>
            <div className="mt-3"><Button type="submit" disabled={verifying}>{verifying ? 'Verifying...' : 'Verify ticket'}</Button></div>
          </form>
        </Card>

        <Card>
          <h2 className="text-xl font-black text-slate-950">Scan result</h2>
          {!verification ? (
            <div className="mt-5 rounded-3xl bg-slate-50 p-6 text-center text-slate-600">
              <QrCode className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-3 font-semibold">No ticket scanned yet.</p>
            </div>
          ) : (
            <div className="mt-5">
              <div className={`rounded-3xl p-5 text-white ${valid ? 'bg-gradient-to-br from-green-600 to-teal-700' : 'bg-gradient-to-br from-red-600 to-rose-700'}`}>
                <StatusIcon className="h-9 w-9" />
                <h3 className="mt-3 text-2xl font-black">{valid ? 'Valid ticket' : 'Invalid ticket'}</h3>
                <p className="mt-1 text-sm text-white/90">{verification.message}</p>
              </div>

              {ticket && (
                <div className="mt-5 grid gap-3 text-sm text-slate-700">
                  <p><strong>Ticket:</strong> {ticket.ticket_number}</p>
                  <p><strong>Status:</strong> {ticket.status}</p>
                  <p><strong>Attendee:</strong> {ticket.attendee?.name || 'Unknown'}</p>
                  <p><strong>Email:</strong> {ticket.attendee?.email || '—'}</p>
                  <p><strong>Event:</strong> {ticket.event?.title || '—'}</p>
                  <p><strong>Date:</strong> {formatDate(ticket.event?.start_date)}</p>
                  <p><strong>Checked in:</strong> {ticket.checked_in_at ? `${formatDate(ticket.checked_in_at)} by ${ticket.checked_in_by || 'staff'}` : 'Not yet'}</p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                {valid && !alreadyCheckedIn && <Button type="button" onClick={handleCheckIn} disabled={checkingIn}><UserCheck className="mr-2 h-4 w-4" />{checkingIn ? 'Checking in...' : 'Check in attendee'}</Button>}
                {alreadyCheckedIn && <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-black text-green-700">Already checked in</span>}
                <Button type="button" variant="secondary" onClick={startCamera}>Scan another ticket</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  )
}
