import { useEffect, useRef, useState } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { Plus, Trash2, Copy, UploadCloud, FileText, Printer, Mail, MessageSquare, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { buildQuotationHtml } from '../../../lib/quotationDocument'
import { DEFAULT_QUOTATION_TERMS, DEFAULT_QUOTATION_NOTES } from '../../../lib/quotationDefaults'

export default function QuotationBuilder({ quotationId }){
  const [data, setData] = useState({ boq: [], paymentSchedule: [], terms: DEFAULT_QUOTATION_TERMS, notes: DEFAULT_QUOTATION_NOTES, attachments: [], subtotal:0, gstTotal:0, discount:0, grandTotal:0 })
  const [settings, setSettings] = useState({})
  const [servicesList, setServicesList] = useState([])
  const [validationErrors, setValidationErrors] = useState({})
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [whatsappLoading, setWhatsappLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [currentId, setCurrentId] = useState(quotationId || null)
  const [unsaved, setUnsaved] = useState(false)
  const previewIframeRef = useRef(null)

  // Basic helpers and stubs used by the UI and HTML generator
  function setField(key, value){ setData(prev=>({ ...prev, [key]: value })) }
  function updateBoqRow(idx, field, value){ setData(prev=>{ const b = [...(prev.boq||[])]; b[idx] = { ...(b[idx]||{}), [field]: value }; return { ...prev, boq: b } }) }
  function addBoqRow(){ setData(prev=>({ ...prev, boq: [...(prev.boq||[]), { id: Date.now(), description:'', category:'', unit:'', quantity:0, rate:0, gst:0, amount:0 }] })) }
  function deleteBoqRow(idx){ setData(prev=>{ const b = [...(prev.boq||[])]; b.splice(idx,1); return { ...prev, boq: b } }) }
  function duplicateBoqRow(idx){ setData(prev=>{ const b = [...(prev.boq||[])]; const row = { ...(b[idx]||{}), id: Date.now() }; b.splice(idx+1,0,row); return { ...prev, boq: b } }) }
  function updatePayment(idx, field, value){ setData(prev=>{ const p = [...(prev.paymentSchedule||[])]; p[idx] = { ...(p[idx]||{}), [field]: value }; return { ...prev, paymentSchedule: p } }) }
  function addPayment(){ setData(prev=>({ ...prev, paymentSchedule: [...(prev.paymentSchedule||[]), { id: Date.now(), title: 'Milestone', percent: 0 }] })) }
  function deletePayment(idx){ setData(prev=>{ const p = [...(prev.paymentSchedule||[])]; p.splice(idx,1); return { ...prev, paymentSchedule: p } }) }
  function updateTerm(idx, value){ setData(prev=>{ const t = [...(prev.terms||[])]; t[idx] = value; return { ...prev, terms: t } }) }
  function addTerm(){ setData(prev=>({ ...prev, terms: [...(prev.terms||[]), ''] })) }
  function deleteTerm(idx){ setData(prev=>{ const t = [...(prev.terms||[])]; t.splice(idx,1); return { ...prev, terms: t } }) }

  function formatCurrency(n){ return Number(n||0).toFixed(2) }
  function openAttachments(){ /* stub: open attachment manager */ }

  useEffect(()=>{
    let mounted = true
    async function loadData(){
      try{
        const settingsRes = await fetch('/api/settings')
        const settingsJson = await settingsRes.json()
        if (settingsJson && settingsJson.success && mounted){
          setSettings(settingsJson.data || {})
        }

        const servicesRes = await fetch('/api/services?status=ACTIVE')
        const servicesJson = await servicesRes.json()
        if (servicesJson && servicesJson.success && mounted){
          setServicesList(Array.isArray(servicesJson.data) ? servicesJson.data : [])
        }

        if (quotationId){
          const res = await fetch('/api/quotations/' + quotationId)
          const d = await res.json()
          if (d && d.success && mounted){
            setData(prev => ({
              ...prev,
              ...(d.data || {}),
              terms: Array.isArray(d.data?.terms) ? d.data.terms : [],
              notes: String(d.data?.notes || ''),
            }))
            setCurrentId(quotationId)
          }
        }
      }catch(err){
        console.error('Failed to load settings or quotation data:', err)
      }
    }
    loadData()
    return ()=>{ mounted = false }
  }, [quotationId])

  useEffect(() => {
    computeTotals()
  }, [data.boq, data.discount])

  function getQuotationHtml(printWhenReady = false){
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return buildQuotationHtml(data, settings, { baseUrl, printWhenReady, servicesList })
  }

  function openQuotationWindow(printWhenReady = false){
    const printWindow = window.open('', '_blank', 'width=1400,height=1100,noopener,noreferrer')
    if (!printWindow) throw new Error('Popup blocked')

    const triggerPrint = () => {
      try {
        printWindow.focus()
        if (printWhenReady) printWindow.print()
      } catch (err) {
        console.error(err)
      }
    }

    const html = getQuotationHtml(printWhenReady)
    printWindow.addEventListener('load', () => {
      setTimeout(triggerPrint, 400)
    }, { once: true })

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(triggerPrint, 800)

    return printWindow
  }

  async function exportPreviewToPdf({ saveFile = true } = {}){
    const html = getQuotationHtml(false)
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.left = '-9999px'
    iframe.style.top = '-9999px'
    iframe.style.width = '210mm'
    iframe.style.height = '297mm'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    try {
      await new Promise((resolve, reject) => {
        const handleLoad = () => {
          iframe.removeEventListener('load', handleLoad)
          resolve(null)
        }
        iframe.addEventListener('load', handleLoad, { once: true })
        iframe.srcdoc = html
      })

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) throw new Error('Unable to access preview document')

      const pages = Array.from(iframeDoc.querySelectorAll('.page'))
      if (!pages.length) throw new Error('Preview pages not found')

      // Load jspdf and html2canvas at runtime from CDN to avoid server-side bundling issues
      const loadScript = (src) => new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve()
        const s = document.createElement('script')
        s.src = src
        s.onload = () => resolve()
        s.onerror = (e) => reject(new Error('Failed to load ' + src))
        document.head.appendChild(s)
      })

      if (typeof window === 'undefined') throw new Error('PDF export must run in browser')

      // Try to use already-loaded libs, otherwise fetch from CDN
      if (!window.jspdf) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
      }
      if (!window.html2canvas) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
      }

      const jsPDF = window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : (window.jspdf || null)
      const html2canvas = window.html2canvas || window.html2canvas

      if (!jsPDF || !html2canvas) throw new Error('PDF libraries not available')

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

      for (const [index, page] of pages.entries()) {
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        })

        const imgData = canvas.toDataURL('image/png')
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const imgWidth = pageWidth
        const imgHeight = (canvas.height * pageWidth) / canvas.width

        if (index > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight))
      }

      const fileName = `${String(data.quotationNumber || 'quotation').trim().replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'quotation'}.pdf`
      if (saveFile) pdf.save(fileName)
      const dataUri = pdf.output('datauristring')
      const base64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri
      return { fileName, dataUri, base64 }
    } catch (err) {
      console.error('PDF generation error:', err)
      throw err
    } finally {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }
  }

  async function downloadPdf(){
    setDownloadLoading(true)
    try{
      await exportPreviewToPdf({ saveFile: true })
    }catch(err){
      toast.error('Unable to generate PDF. Please check the console for details.')
    }
    finally{
      setDownloadLoading(false)
    }
  }

  useEffect(() => {
    computeTotals()
  }, [data.boq, data.discount])

  function handlePreview(){ setShowPreview(true) }

  function getLiveFormData(){
    if (typeof window === 'undefined') return data

    const customerNameInput = document.querySelector('input[placeholder="Customer Name *"]')
    const customerPhoneInput = document.querySelector('input[placeholder="Phone Number *"]')
    const projectNameInput = document.querySelector('input[placeholder="Project Name *"]')

    return {
      ...data,
      customerName: String(customerNameInput?.value ?? data.customerName ?? '').trim(),
      customerPhone: String(customerPhoneInput?.value ?? data.customerPhone ?? '').trim(),
      projectName: String(projectNameInput?.value ?? data.projectName ?? '').trim(),
    }
  }

  function handlePrint(){
    const tryPrintPreview = () => {
      const iframe = previewIframeRef.current
      const iframeWindow = iframe?.contentWindow
      if (iframeWindow) {
        try {
          iframeWindow.focus()
          iframeWindow.print()
          return true
        } catch (err) {
          console.error(err)
        }
      }
      return false
    }

    if (!showPreview) {
      setShowPreview(true)
      setTimeout(() => {
        if (!tryPrintPreview()) {
          try {
            openQuotationWindow(true)
          } catch (err) {
            console.error(err)
            toast.error('Please allow popups to print')
          }
        }
      }, 700)
      return
    }

    if (!tryPrintPreview()) {
      try {
        openQuotationWindow(true)
      } catch (err) {
        console.error(err)
        toast.error('Please allow popups to print')
      }
    }
  }

  function computeTotals(){
    const boq = data.boq || []
    let subtotal=0, gstTotal=0
    boq.forEach(r=>{ const amt = Number(r.amount||0); const gst = Number(r.gst||0); subtotal += amt; gstTotal += (amt * gst / 100) })
    const discount = Number(data.discount||0)
    const grand = subtotal + gstTotal - discount
    setData(prev=>({...prev, subtotal, gstTotal, grandTotal: grand}))
  }

  async function handleSave(status='Saved', showMessage=true){
    const normalizedStatus = String(status || 'Saved').trim()
    const isDraft = normalizedStatus.toUpperCase() === 'DRAFT'
    const allowIncompleteSave = isDraft || normalizedStatus.toUpperCase() === 'SAVED'
    const liveData = getLiveFormData()

    if (!allowIncompleteSave) {
      if (!liveData.customerName || !liveData.customerPhone || !liveData.projectName) {
        if (showMessage) toast.error('Customer name, phone and project name are required')
        return false
      }
      if (!liveData.boq || liveData.boq.length===0) { if (showMessage) toast.error('At least one BOQ item required'); return false }
    }

    const payload = {...liveData, status: normalizedStatus, isDraft: false}
    let toastId = null

    try{
      if (showMessage) toastId = toast.loading(isDraft ? 'Saving draft...' : (normalizedStatus.toUpperCase() === 'SENT' ? 'Sending...' : 'Saving...'))

      if (quotationId) {
        const res = await fetch('/api/quotations/' + quotationId, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
        const d = await res.json()
        if (d.success){
          setUnsaved(false)
          if (toastId) toast.dismiss(toastId)
          if (showMessage) {
            const successMessage = isDraft ? 'Quotation Draft Saved Successfully' : (normalizedStatus.toUpperCase() === 'SENT' ? 'Quotation sent successfully.' : 'Quotation Saved Successfully')
            toast.success(successMessage)
          }
          if (d.data && d.data.id) {
            setCurrentId(d.data.id)
            setTimeout(() => { window.location.href = '/admin/quotations' }, 500)
          }
          return true
        } else {
          throw new Error(d.message || 'Save failed')
        }
      } else {
        const res = await fetch('/api/quotations', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
        const d = await res.json()
        if (d.success){
          setUnsaved(false)
          if (toastId) toast.dismiss(toastId)
          if (showMessage) {
            const successMessage = isDraft ? 'Quotation Draft Saved Successfully' : (normalizedStatus.toUpperCase() === 'SENT' ? 'Quotation sent successfully.' : 'Quotation Saved Successfully')
            toast.success(successMessage)
          }
          if (d.data && d.data.id){
            setCurrentId(d.data.id)
            setTimeout(() => { window.location.href = '/admin/quotations' }, 500)
          }
          return true
        } else {
          throw new Error(d.message || 'Save failed')
        }
      }
    }catch(err){
      console.error('Save error:', err)
      if (toastId) toast.dismiss(toastId)
      if (showMessage) toast.error('Unable to save: ' + err.message)
    }
    return false
  }

  async function handleSaveAndSend(){
    const liveData = getLiveFormData()
    const errors = {}
    if (!liveData.customerName || !String(liveData.customerName).trim()) errors.customerName = true
    if (!liveData.customerPhone || !String(liveData.customerPhone).trim()) errors.customerPhone = true
    if (!liveData.projectName || !String(liveData.projectName).trim()) errors.projectName = true
    const boq = Array.isArray(liveData.boq) ? liveData.boq : []
    const hasBoq = boq.some(r => r && (String(r?.description||'').trim() || Number(r?.quantity||0) || Number(r?.rate||0)))
    if (!hasBoq) errors.boq = true

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      toast.error('Please fill required fields before sending')
      return false
    }

    setValidationErrors({})
    return handleSave('Sent')
  }

  async function handleAutoSave(){ if (!unsaved) return; await handleSave('Draft', false) }

  function handleSendEmail(){ sendEmail() }

  function handleSendWhatsApp(){ sendWhatsApp() }

  async function sendWhatsApp(){
    if (!currentId) return toast.error('Please save quotation first')
    const url = encodeURIComponent(window.location.origin + '/quotations/' + currentId)
    const text = encodeURIComponent(`Please review our quotation - ${data.quotationNumber || 'SVC-' + new Date().getFullYear()}`)
    window.open(`https://wa.me/?text=${text}%0A%0A${url}`)
  }

  async function sendEmail(){
    if (!emailLoading) {
      if (!data.customerEmail || !String(data.customerEmail).trim()) {
        return toast.error('Customer email is required to send quotation')
      }
      if (!currentId) {
        return toast.error('Please save quotation before sending email')
      }

      setEmailLoading(true)
      try {
        const html = buildQuotationHtml(data, settings, { baseUrl: window.location.origin, servicesList })
        const subject = `Quotation: ${data.quotationNumber || 'SVC-' + new Date().getFullYear()}`
        const { base64, fileName } = await exportPreviewToPdf({ saveFile: false })

        const response = await fetch('/api/email/quotation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: data.customerEmail,
            subject,
            html,
            attachmentBase64: base64,
            attachmentFileName: fileName,
          })
        })

        const result = await response.json()
        if (result.success) {
          toast.success('Quotation email sent successfully')
        } else {
          throw new Error(result.message || 'Failed to send email')
        }
      } catch (err) {
        console.error('Email send error:', err)
        toast.error('Unable to send email. Please check console for details.')
      } finally {
        setEmailLoading(false)
      }
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-white p-4 rounded">
          <h3 className="font-semibold mb-2">Section 1 — Customer Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={data.customerName} onChange={(e)=>setField('customerName', e.target.value)} placeholder="Customer Name *" className={"border p-2 rounded " + (validationErrors.customerName ? 'border-red-500' : '')} />
            <input value={data.customerPhone} onChange={(e)=>setField('customerPhone', e.target.value)} placeholder="Phone Number *" className={"border p-2 rounded " + (validationErrors.customerPhone ? 'border-red-500' : '')} />
            <input value={data.customerEmail} onChange={(e)=>setField('customerEmail', e.target.value)} placeholder="Email" className="border p-2 rounded" />
            <input value={data.siteAddress} onChange={(e)=>setField('siteAddress', e.target.value)} placeholder="Site Address *" className="border p-2 rounded" />
            <input value={data.city} onChange={(e)=>setField('city', e.target.value)} placeholder="City" className="border p-2 rounded" />
            <input value={data.state} onChange={(e)=>setField('state', e.target.value)} placeholder="State" className="border p-2 rounded" />
            <input value={data.pincode} onChange={(e)=>setField('pincode', e.target.value)} placeholder="Pincode" className="border p-2 rounded" />
            <input value={data.referenceBy} onChange={(e)=>setField('referenceBy', e.target.value)} placeholder="Reference By" className="border p-2 rounded" />
          </div>
        </div>

        <div className="bg-white p-4 rounded">
          <h3 className="font-semibold mb-2">Section 2 — Project Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={data.projectName} onChange={(e)=>setField('projectName', e.target.value)} placeholder="Project Name *" className={"border p-2 rounded " + (validationErrors.projectName ? 'border-red-500' : '')} />
            <select value={data.projectType} onChange={(e)=>setField('projectType', e.target.value)} className="border p-2 rounded">
              <option value="">Select Project Type *</option>
              <option>Individual House</option>
              <option>Duplex House</option>
              <option>Luxury Villa</option>
              <option>Apartment</option>
              <option>Commercial Building</option>
              <option>Office Interior</option>
              <option>Shop Interior</option>
              <option>Renovation</option>
              <option>Turnkey Construction</option>
              <option>Interior Design</option>
            </select>
            <input value={data.projectLocation} onChange={(e)=>setField('projectLocation', e.target.value)} placeholder="Project Location" className="border p-2 rounded" />
            <input value={data.plotArea} onChange={(e)=>setField('plotArea', e.target.value)} placeholder="Plot Area" className="border p-2 rounded" />
            <input value={data.builtUpArea} onChange={(e)=>setField('builtUpArea', e.target.value)} placeholder="Built-up Area" className="border p-2 rounded" />
            <input value={data.floors} onChange={(e)=>setField('floors', e.target.value)} placeholder="No. of Floors" className="border p-2 rounded" />
            <input value={data.estimatedDuration} onChange={(e)=>setField('estimatedDuration', e.target.value)} placeholder="Estimated Duration" className="border p-2 rounded" />
          </div>
        </div>

        <div className="bg-white p-4 rounded">
          <h3 className="font-semibold mb-2">Section 3 — Services</h3>
          <div className="grid grid-cols-3 gap-2">
            {servicesList.filter(s=>s.status==='ACTIVE' || s.status==='active' || s.status===undefined).map(s => (
              <label key={s.id} className="flex items-center gap-2">
                <input type="checkbox" checked={(data.services||[]).some(x=>x===s.id)} onChange={(e)=>{
                  const selected = new Set(data.services||[])
                  if (e.target.checked) selected.add(s.id); else selected.delete(s.id)
                  setField('services', Array.from(selected))
                }} />
                <span>{s.serviceName || s.title || s.name}</span>
              </label>
            ))}
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={Array.isArray(data.services) && data.services.some(x => typeof x === 'string' && x.startsWith('Others:'))} onChange={(e) => {
                const services = Array.isArray(data.services) ? [...data.services] : []
                const filtered = services.filter(x => !(typeof x === 'string' && x.startsWith('Others:')))
                if (e.target.checked) filtered.push('Others:')
                setField('services', filtered)
              }} />
              <span>Others</span>
            </label>
            {Array.isArray(data.services) && data.services.some(x => typeof x === 'string' && x.startsWith('Others:')) && (
              <input
                value={String((data.services || []).find(x => typeof x === 'string' && x.startsWith('Others:')) || '').slice('Others:'.length).trim()}
                onChange={(e) => {
                  const services = Array.isArray(data.services) ? [...data.services] : []
                  const filtered = services.filter(x => !(typeof x === 'string' && x.startsWith('Others:')))
                  filtered.push(`Others: ${String(e.target.value).trim()}`)
                  setField('services', filtered)
                }}
                placeholder="Enter custom service..."
                className="col-span-3 border p-2 rounded"
              />
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded">
          <h3 className="font-semibold mb-2">Section 4 — Bill of Quantities (BOQ)</h3>
          <div className={"overflow-x-auto " + (validationErrors.boq ? 'border-2 border-red-500 p-1' : '')}>
            <table className="w-full text-sm">
              <thead className="text-left"><tr><th>Description</th><th>Category</th><th>Unit</th><th>Qty</th><th>Rate</th><th>GST %</th><th>Amount</th><th>Actions</th></tr></thead>
              <tbody>
                {(data.boq||[]).map((r, idx)=> (
                  <tr key={r.id} className="align-top border-t">
                    <td><input value={r.description} onChange={(e)=>updateBoqRow(idx,'description', e.target.value)} className="border p-1" /></td>
                    <td><input value={r.category} onChange={(e)=>updateBoqRow(idx,'category', e.target.value)} className="border p-1" /></td>
                    <td><input value={r.unit} onChange={(e)=>updateBoqRow(idx,'unit', e.target.value)} className="border p-1" /></td>
                    <td><input type="number" value={r.quantity} onChange={(e)=>updateBoqRow(idx,'quantity', Number(e.target.value))} className="border p-1 w-20" /></td>
                    <td><input type="number" value={r.rate} onChange={(e)=>updateBoqRow(idx,'rate', Number(e.target.value))} className="border p-1 w-28" /></td>
                    <td><input type="number" value={r.gst} onChange={(e)=>updateBoqRow(idx,'gst', Number(e.target.value))} className="border p-1 w-20" /></td>
                    <td>{formatCurrency(r.amount)}</td>
                    <td className="flex gap-1">
                      <button type="button" onClick={()=>duplicateBoqRow(idx)} className="p-1 border rounded"><Copy className="w-4 h-4" /></button>
                      <button type="button" onClick={()=>deleteBoqRow(idx)} className="p-1 border rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={addBoqRow} className="px-3 py-1 bg-emerald-600 text-white rounded inline-flex items-center gap-2"><Plus /> Add Row</button>
          </div>

          <div className="mt-4 space-y-1 text-sm">
            <div>Subtotal: {formatCurrency(data.subtotal)}</div>
            <div>GST Total: {formatCurrency(data.gstTotal)}</div>
            <div className="flex items-center gap-2">Discount: <input type="number" value={data.discount||0} onChange={(e)=>setField('discount', Number(e.target.value))} className="border p-1 w-32" /></div>
            <div className="font-semibold">Grand Total: {formatCurrency(data.grandTotal)}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded">
          <h3 className="font-semibold mb-2">Section 5 — Payment Schedule</h3>
          <div className="space-y-2">
            {(data.paymentSchedule||[]).map((p, idx)=> (
              <div key={p.id} className="flex gap-2 items-center">
                <input value={p.title} onChange={(e)=>updatePayment(idx,'title', e.target.value)} className="border p-1 rounded flex-1" />
                <input type="number" value={p.percent} onChange={(e)=>updatePayment(idx,'percent', Number(e.target.value))} className="border p-1 w-24" />
                <div className="w-32">Amount: {formatCurrency((data.grandTotal||0) * (p.percent||0) / 100)}</div>
                <button onClick={()=>deletePayment(idx)} className="p-1 border rounded text-red-600">Delete</button>
              </div>
            ))}
            <button onClick={addPayment} className="px-3 py-1 bg-emerald-600 text-white rounded inline-flex items-center gap-2"><Plus /> Add Milestone</button>
          </div>
        </div>

        <div className="bg-white p-4 rounded">
          <h3 className="font-semibold mb-2">Section 6 — Terms & Conditions</h3>
          <div className="space-y-2">
            {(data.terms||[]).map((t, idx)=> (
              <div key={idx} className="flex gap-2">
                <input value={t} onChange={(e)=>updateTerm(idx, e.target.value)} className="flex-1 border p-1 rounded" />
                <button onClick={()=>deleteTerm(idx)} className="p-1 border rounded text-red-600">Delete</button>
              </div>
            ))}
            <button onClick={addTerm} className="px-3 py-1 bg-emerald-600 text-white rounded inline-flex items-center gap-2"><Plus /> Add Clause</button>
          </div>
        </div>

        <div className="bg-white p-4 rounded">
          <h3 className="font-semibold mb-2">Section 7 — Notes</h3>
          <textarea value={data.notes} onChange={(e)=>setField('notes', e.target.value)} className="w-full h-40 border p-2 rounded" />
        </div>

        <div className="bg-white p-4 rounded">
          <h3 className="font-semibold mb-2">Section 8 — Attachments</h3>
          <div className="flex gap-2 items-center">
            <button onClick={openAttachments} className="px-3 py-1 bg-emerald-600 text-white rounded inline-flex items-center gap-2"><UploadCloud /> Select from Upload Manager</button>
            <div className="flex gap-2">{(data.attachments||[]).map(a=> <a key={a.id} href={a.fileUrl} target="_blank" className="text-sm underline">{a.originalName}</a>)}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2 flex-wrap">
              <button onClick={()=>handleSave('Saved')} className="px-4 py-2 bg-emerald-600 text-white rounded">Save</button>
              <button onClick={handlePreview} className="px-4 py-2 border rounded">Preview</button>
              <button onClick={downloadPdf} disabled={downloadLoading} className="px-4 py-2 border rounded inline-flex items-center gap-2">
                <Download className="w-4 h-4" /> {downloadLoading ? 'Generating...' : 'Download PDF'}
              </button>
              <button onClick={handlePrint} className="px-4 py-2 border rounded inline-flex items-center gap-2"><Printer /> Print</button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleSendEmail} disabled={emailLoading} className="px-3 py-2 border rounded inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"><Mail /> {emailLoading ? 'Sending...' : 'Send Email'}</button>
              <button onClick={handleSendWhatsApp} disabled={whatsappLoading} className="px-3 py-2 border rounded inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"><MessageSquare /> {whatsappLoading ? 'Preparing...' : 'Share WhatsApp'}</button>
            </div>
          </div>
          {showPreview ? (
            <div className="bg-gray-50 border border-gray-200 rounded p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold">Quotation Preview</h2>
                  <p className="text-sm text-gray-600">Live A4 preview with company settings applied.</p>
                </div>
                <button onClick={()=>setShowPreview(false)} className="px-3 py-1 border rounded">Close Preview</button>
              </div>
              <div className="overflow-auto">
                <iframe
                  ref={previewIframeRef}
                  title="Quotation Preview"
                  srcDoc={getQuotationHtml()}
                  style={{ width: '210mm', height: '297mm', border: '1px solid #d1d5db', borderRadius: 10 }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AdminLayout>
  )
}
