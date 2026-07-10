import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AdminLayout from '../../../components/admin/AdminLayout'
import { Plus, Trash2, Copy, UploadCloud, FileText, Printer, Download, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { buildQuotationHtml } from '../../../lib/quotationDocument'
import { DEFAULT_QUOTATION_TERMS, DEFAULT_QUOTATION_NOTES } from '../../../lib/quotationDefaults'
import { getQuotationSaveRequestDetails } from '../../../lib/quotationClientHelpers'

export default function QuotationBuilder({ quotationId }){
  const router = useRouter()
  const enquiryIdFromQuery = typeof router.query?.enquiryId === 'string'
    ? router.query.enquiryId
    : Array.isArray(router.query?.enquiryId)
      ? router.query.enquiryId[0]
      : null
  const customerIdFromQuery = typeof router.query?.customerId === 'string'
    ? router.query.customerId
    : Array.isArray(router.query?.customerId)
      ? router.query.customerId[0]
      : null

  const [data, setData] = useState({ boq: [], paymentSchedule: [], terms: DEFAULT_QUOTATION_TERMS, notes: DEFAULT_QUOTATION_NOTES, attachments: [], subtotal:0, gstTotal:0, gstPercent:0, discount:0, discountPercent:0, subtotalAfterDiscount:0, grandTotal:0 })
  const [customProjectTypeEnabled, setCustomProjectTypeEnabled] = useState(false)
  const projectTypeOptions = ['Individual House','Duplex House','Luxury Villa','Apartment','Commercial Building','Office Interior','Shop Interior','Renovation','Turnkey Construction','Interior Design']
  const [settings, setSettings] = useState({})
  const [servicesList, setServicesList] = useState([])
  const [validationErrors, setValidationErrors] = useState({})
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [currentId, setCurrentId] = useState(quotationId || null)
  const [unsaved, setUnsaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const previewIframeRef = useRef(null)
  
  // New structured BOQ state for Work Blocks
  const [workBlocks, setWorkBlocks] = useState([])

  // Basic helpers and stubs used by the UI and HTML generator
  function setField(key, value){ setData(prev=>({ ...prev, [key]: value })) }
  const calculateSectionTotal = (block = {}) => {
    return (block.measurements || []).reduce((sum, meas) => {
      const quantity = Number(meas.quantity || 0)
      const rate = Number(meas.rate || 0)
      return sum + (quantity * rate)
    }, 0)
  }
  const calculateBoqTotal = (blocks = workBlocks) => {
    return (blocks || []).reduce((sum, block) => sum + calculateSectionTotal(block), 0)
  }
  const isCustomProjectTypeValue = (value) => {
    const normalized = String(value || '').trim()
    return Boolean(normalized) && !projectTypeOptions.includes(normalized)
  }
  function handleProjectTypeChange(value){
    if (value === 'Others') {
      setCustomProjectTypeEnabled(true)
      const currentValue = String(data.projectType || '').trim()
      setField('projectType', isCustomProjectTypeValue(currentValue) ? currentValue : '')
      return
    }

    setCustomProjectTypeEnabled(false)
    setField('projectType', value)
  }
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

  // Work Block helpers
  function addWorkBlock(){ 
    setWorkBlocks(prev=>([...prev, { 
      id: Date.now(), 
      title: '', 
      descriptions: [''], 
      materials: [''], 
      warranty: '', 
      measurements: [{ id: Date.now(), description: '', unit: '', quantity: 0, rate: 0, amount: 0 }],
      expanded: true 
    }])) 
  }
  
  function deleteWorkBlock(idx){ 
    setWorkBlocks(prev=>{ const b = [...prev]; b.splice(idx,1); return b }) 
  }
  
  function updateWorkBlock(idx, field, value){ 
    setWorkBlocks(prev=>{ const b = [...prev]; b[idx] = { ...b[idx], [field]: value }; return b }) 
  }
  
  function toggleWorkBlock(idx){ 
    setWorkBlocks(prev=>{ const b = [...prev]; b[idx] = { ...b[idx], expanded: !b[idx].expanded }; return b }) 
  }
  
  function addDescription(workIdx){ 
    setWorkBlocks(prev=>{ const b = [...prev]; b[workIdx] = { ...b[workIdx], descriptions: [...(b[workIdx].descriptions||[]), ''] }; return b }) 
  }
  
  function updateDescription(workIdx, descIdx, value){ 
    setWorkBlocks(prev=>{ const b = [...prev]; const descs = [...b[workIdx].descriptions]; descs[descIdx] = value; b[workIdx] = { ...b[workIdx], descriptions: descs }; return b }) 
  }
  
  function deleteDescription(workIdx, descIdx){ 
    setWorkBlocks(prev=>{ const b = [...prev]; const descs = [...b[workIdx].descriptions]; descs.splice(descIdx,1); b[workIdx] = { ...b[workIdx], descriptions: descs }; return b }) 
  }
  
  function addMaterial(workIdx){ 
    setWorkBlocks(prev=>{ const b = [...prev]; b[workIdx] = { ...b[workIdx], materials: [...(b[workIdx].materials||[]), ''] }; return b }) 
  }
  
  function updateMaterial(workIdx, matIdx, value){ 
    setWorkBlocks(prev=>{ const b = [...prev]; const mats = [...b[workIdx].materials]; mats[matIdx] = value; b[workIdx] = { ...b[workIdx], materials: mats }; return b }) 
  }
  
  function deleteMaterial(workIdx, matIdx){ 
    setWorkBlocks(prev=>{ const b = [...prev]; const mats = [...b[workIdx].materials]; mats.splice(matIdx,1); b[workIdx] = { ...b[workIdx], materials: mats }; return b }) 
  }
  
  function addMeasurement(workIdx){ 
    setWorkBlocks(prev=>{ const b = [...prev]; b[workIdx] = { ...b[workIdx], measurements: [...(b[workIdx].measurements||[]), { id: Date.now(), description: '', unit: '', quantity: 0, rate: 0, amount: 0 }] }; return b }) 
  }
  
  function updateMeasurement(workIdx, measIdx, field, value){ 
    setWorkBlocks(prev=>{ const b = [...prev]; const meas = [...b[workIdx].measurements]; meas[measIdx] = { ...meas[measIdx], [field]: value }; b[workIdx] = { ...b[workIdx], measurements: meas }; return b }) 
  }
  
  function deleteMeasurement(workIdx, measIdx){ 
    setWorkBlocks(prev=>{ const b = [...prev]; const meas = [...b[workIdx].measurements]; meas.splice(measIdx,1); b[workIdx] = { ...b[workIdx], measurements: meas }; return b }) 
  }

  // Transform workBlocks to flat boq array for backend compatibility
  function syncWorkBlocksToBoq(){
    const flatBoq = []
    workBlocks.forEach(block => {
      const blockTitle = block.title || 'Untitled Work'
      const descriptions = (block.descriptions || []).filter(d => d && d.trim()).join('; ')
      const materials = (block.materials || []).filter(m => m && m.trim()).join('; ')
      const warranty = block.warranty || ''
      
      if (block.measurements && block.measurements.length > 0) {
        block.measurements.forEach(meas => {
          const amount = Number(meas.quantity || 0) * Number(meas.rate || 0)
          const fullDescription = [
            meas.description || '',
            descriptions ? `Description: ${descriptions}` : '',
            materials ? `Materials: ${materials}` : '',
            warranty ? `Warranty: ${warranty}` : ''
          ].filter(Boolean).join(' | ')
          
          flatBoq.push({
            id: meas.id || Date.now() + Math.random(),
            description: fullDescription || blockTitle,
            category: blockTitle,
            unit: meas.unit || '',
            quantity: Number(meas.quantity || 0),
            rate: Number(meas.rate || 0),
            gst: 0, // GST will be calculated by backend based on company settings
            amount: amount
          })
        })
      }
    })
    
    setData(prev=>({ ...prev, boq: flatBoq }))
  }

  function buildWorkBlocksFromBoq(flatBoq = []){
    const byCategory = flatBoq.reduce((acc, row) => {
      const category = String(row?.category || 'General').trim() || 'General'
      if (!acc[category]) acc[category] = []
      acc[category].push(row)
      return acc
    }, {})

    return Object.entries(byCategory).map(([category, rows], idx) => ({
      id: `work-${idx}-${category}`,
      title: category,
      descriptions: [],
      materials: [],
      warranty: '',
      expanded: true,
      measurements: (rows || []).map((row, rowIdx) => ({
        id: row.id || `${category}-${rowIdx}`,
        description: String(row.description || ''),
        unit: String(row.unit || ''),
        quantity: Number(row.quantity || 0),
        rate: Number(row.rate || 0),
        amount: Number(row.amount || 0),
      })),
    }))
  }

  function formatCurrency(n){ return Number(n||0).toFixed(2) }
  function openAttachments(){ /* stub: open attachment manager */ }

  function getPrefilledServices(selectedService, serviceList = []) {
    const normalized = String(selectedService || '').trim().toLowerCase()
    if (!normalized) return []

    for (const service of serviceList) {
      const candidates = [service?.id, service?.title, service?.name, service?.serviceName, service?.serviceTitle]
      for (const candidate of candidates) {
        if (String(candidate || '').trim().toLowerCase() === normalized) {
          return [service?.id || candidate]
        }
      }
    }

    return [selectedService]
  }

  useEffect(() => {
    setCustomProjectTypeEnabled(prev => prev || isCustomProjectTypeValue(data.projectType))
  }, [data.projectType])

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
        const servicesData = servicesJson && servicesJson.success ? (Array.isArray(servicesJson.data) ? servicesJson.data : []) : []
        if (mounted){
          setServicesList(servicesData)
        }

          if (quotationId){
          const res = await fetch('/api/quotations/' + quotationId)
          const d = await res.json()
          if (d && d.success && mounted){
            const loadedBoq = Array.isArray(d.data?.boq) ? d.data.boq : []
            setData(prev => ({
              ...prev,
              ...(d.data || {}),
              boq: loadedBoq,
              terms: Array.isArray(d.data?.terms) ? d.data.terms : [],
              notes: String(d.data?.notes || ''),
            }))
            setWorkBlocks(buildWorkBlocksFromBoq(loadedBoq))
            setCurrentId(quotationId)
          }
          return
        }

        if (customerIdFromQuery) {
          const customerRes = await fetch(`/api/customers/${customerIdFromQuery}`)
          const customerJson = await customerRes.json()
          const customerData = customerJson && customerJson.success ? (customerJson.data || null) : customerJson

          if (mounted && customerData) {
            setData(prev => ({
              ...prev,
              customerId: customerIdFromQuery,
              customerName: customerData.name || prev.customerName || '',
              customerPhone: customerData.phone || prev.customerPhone || '',
              customerEmail: customerData.email || prev.customerEmail || '',
              siteAddress: customerData.location || prev.siteAddress || '',
            }))
          }
        }

        const enquiryIdToUse = enquiryIdFromQuery
        if (!enquiryIdToUse) return

        const enquiryRes = await fetch('/api/enquiries/' + enquiryIdToUse)
        const enquiryJson = await enquiryRes.json()
        const enquiryData = enquiryJson && enquiryJson.success ? (enquiryJson.data || null) : enquiryJson

        if (!mounted || !enquiryData) return

        setData(prev => ({
          ...prev,
          enquiryId: enquiryIdToUse,
          customerName: enquiryData.customerName || prev.customerName || '',
          customerPhone: enquiryData.phone || prev.customerPhone || '',
          customerEmail: enquiryData.email || prev.customerEmail || '',
          siteAddress: enquiryData.location || prev.siteAddress || '',
          projectName: enquiryData.service ? `${enquiryData.customerName || 'Customer'} - ${enquiryData.service}` : prev.projectName || '',
          projectType: enquiryData.service || prev.projectType || '',
          services: getPrefilledServices(enquiryData.service, servicesData),
          notes: enquiryData.message || prev.notes || '',
        }))
      }catch(err){
        console.error('Failed to load settings or quotation data:', err)
      }
    }
    loadData()
    return ()=>{ mounted = false }
  }, [quotationId, enquiryIdFromQuery, customerIdFromQuery])

  useEffect(() => {
    computeTotals()
  }, [data.boq, data.discountPercent, data.gstPercent])

  // Sync workBlocks to boq whenever workBlocks change
  useEffect(() => {
    syncWorkBlocksToBoq()
  }, [workBlocks])

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
  }, [data.boq, data.discountPercent])

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
    const subtotal = boq.reduce((sum, row) => sum + Number(row.amount || 0), 0)

    const discountPercent = Number(data.discountPercent || 0)
    const discountAmount = subtotal * (discountPercent / 100)
    const subtotalAfterDiscount = subtotal - discountAmount

    const gstPercent = Number(data.gstPercent || 0)
    const gstAmount = subtotalAfterDiscount * (gstPercent / 100)
    const grand = subtotalAfterDiscount + gstAmount

    setData(prev => ({
      ...prev,
      subtotal,
      discount: discountAmount,
      discountPercent,
      subtotalAfterDiscount,
      gstPercent,
      gstTotal: gstAmount,
      grandTotal: grand,
    }))
  }

  function parseHistoryMeta(meta){
    if (!meta) return {}
    if (typeof meta === 'object') return meta
    try { return JSON.parse(meta) } catch { return {} }
  }

  async function refreshQuotationData(idToLoad = currentId || quotationId){
    if (!idToLoad) return null

    try {
      const res = await fetch('/api/quotations/' + idToLoad)
      const d = await res.json()
      if (!d?.success || !d?.data) return null

      const loadedBoq = Array.isArray(d.data?.boq) ? d.data.boq : []
      setCurrentId(idToLoad)
      setData(prev => ({
        ...prev,
        ...d.data,
        boq: loadedBoq,
        terms: Array.isArray(d.data?.terms) ? d.data.terms : prev.terms,
        notes: String(d.data?.notes || prev.notes || ''),
      }))
      setWorkBlocks(buildWorkBlocksFromBoq(loadedBoq))
      return d.data
    } catch (err) {
      console.error('Failed to refresh quotation data:', err)
      return null
    }
  }

  async function handleSave(status = 'Draft', showMessage=true){
    // Read live form values first (includes DOM reads for inputs)
    const liveData = getLiveFormData()

    const normalizedStatus = String(status || 'Draft').trim()
    const isDraft = normalizedStatus.toUpperCase() === 'DRAFT'
    const allowIncompleteSave = isDraft || normalizedStatus.toUpperCase() === 'SAVED'

    if (!allowIncompleteSave) {
      if (!liveData.customerName || !liveData.customerPhone || !liveData.projectName) {
        if (showMessage) toast.error('Customer name, phone and project name are required')
        return false
      }
      if (!liveData.boq || liveData.boq.length===0) { if (showMessage) toast.error('At least one BOQ item required'); return false }
    }

    const payload = {
      ...liveData,
      customerId: liveData.customerId || customerIdFromQuery || null,
      enquiryId: liveData.enquiryId || enquiryIdFromQuery || null,
    }
    // Log payload for debugging status-saving issues
    let toastId = null
    setSaveLoading(true)

    try{
      if (showMessage) toastId = toast.loading(isDraft ? 'Saving draft...' : (normalizedStatus.toUpperCase() === 'SENT' ? 'Sending...' : 'Saving...'))

      const requestDetails = getQuotationSaveRequestDetails(quotationId, currentId)
      const res = await fetch(requestDetails.endpoint, { method: requestDetails.method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      const d = await res.json()

      if (!d.success) {
        throw new Error(d.message || 'Save failed')
      }
      setUnsaved(false)
      const nextId = String(d.data?.id || requestDetails.id || '').trim()
      if (nextId) {
        setCurrentId(nextId)
        const refreshed = await refreshQuotationData(nextId)
        if (!refreshed) {
          setData(prev => ({
            ...prev,
            ...d.data,
            terms: Array.isArray(d.data?.terms) ? d.data.terms : prev.terms,
            notes: String(d.data?.notes ?? prev.notes ?? ''),
          }))
        }
        if (!requestDetails.id) {
          await router.replace(`/admin/quotations/${nextId}`)
        }
      }

      if (toastId) toast.dismiss(toastId)
      if (showMessage) {
        toast.success('Quotation saved successfully.')
      }

      return true
    } catch(err){
      console.error('Save error:', err)
      if (toastId) toast.dismiss(toastId)
      if (showMessage) toast.error('Unable to save: ' + (err?.message || 'An unknown error occurred'))
    } finally {
      setSaveLoading(false)
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <Link href="/admin/quotations" className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
            <span aria-hidden="true">←</span>
            Back to Quotations
          </Link>
        </div>

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
            <div className="space-y-2">
              <select value={customProjectTypeEnabled ? 'Others' : (data.projectType || '')} onChange={(e)=>handleProjectTypeChange(e.target.value)} className="border p-2 rounded w-full">
                <option value="">Select Scope of Project *</option>
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
                <option>Others</option>
              </select>
              {customProjectTypeEnabled && (
                <div className="space-y-1">
                  <label className="text-sm text-gray-700">Custom Project Scope</label>
                  <input value={data.projectType || ''} onChange={(e)=>setField('projectType', e.target.value)} placeholder="Enter project scope" className="border p-2 rounded w-full" />
                </div>
              )}
            </div>
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
          <div className={"space-y-4 " + (validationErrors.boq ? 'border-2 border-red-500 p-1' : '')}>
            {workBlocks.map((block, workIdx) => (
              <div key={block.id} className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b">
                  <div className="flex items-center gap-3 flex-1">
                    <button type="button" onClick={()=>toggleWorkBlock(workIdx)} className="p-1 hover:bg-gray-200 rounded">
                      {block.expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    <input 
                      value={block.title} 
                      onChange={(e)=>updateWorkBlock(workIdx, 'title', e.target.value)} 
                      placeholder="WORK TITLE" 
                      className="font-semibold text-lg border-none bg-transparent focus:outline-none focus:ring-0 w-full"
                    />
                  </div>
                  <button type="button" onClick={()=>deleteWorkBlock(workIdx)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {block.expanded && (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">WORK DESCRIPTION</label>
                      <div className="space-y-2">
                        {(block.descriptions || []).map((desc, descIdx) => (
                          <div key={descIdx} className="flex gap-2 items-start">
                            <span className="text-gray-500 mt-2">{String.fromCharCode(97 + descIdx)})</span>
                            <input 
                              value={desc} 
                              onChange={(e)=>updateDescription(workIdx, descIdx, e.target.value)} 
                              placeholder="Enter description point..." 
                              className="flex-1 border p-2 rounded"
                            />
                            <button type="button" onClick={()=>deleteDescription(workIdx, descIdx)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={()=>addDescription(workIdx)} className="px-3 py-1 bg-emerald-600 text-white rounded inline-flex items-center gap-2 text-sm">
                          <Plus className="w-4 h-4" /> Add Description Point
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">USING MATERIAL</label>
                      <div className="space-y-2">
                        {(block.materials || []).map((mat, matIdx) => (
                          <div key={matIdx} className="flex gap-2 items-start">
                            <span className="text-gray-500 mt-2">{String.fromCharCode(97 + matIdx)})</span>
                            <input 
                              value={mat} 
                              onChange={(e)=>updateMaterial(workIdx, matIdx, e.target.value)} 
                              placeholder="Enter material..." 
                              className="flex-1 border p-2 rounded"
                            />
                            <button type="button" onClick={()=>deleteMaterial(workIdx, matIdx)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={()=>addMaterial(workIdx)} className="px-3 py-1 bg-emerald-600 text-white rounded inline-flex items-center gap-2 text-sm">
                          <Plus className="w-4 h-4" /> Add Material
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">WARRANTY</label>
                      <input 
                        value={block.warranty} 
                        onChange={(e)=>updateWorkBlock(workIdx, 'warranty', e.target.value)} 
                        placeholder="e.g., Warranty for 10 Years" 
                        className="w-full border p-2 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">MEASUREMENT</label>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="text-left bg-gray-50">
                            <tr>
                              <th className="p-2 border w-12">Sl.No</th>
                              <th className="p-2 border">Description</th>
                              <th className="p-2 border w-24">Unit</th>
                              <th className="p-2 border w-24">Quantity</th>
                              <th className="p-2 border w-28">Rate</th>
                              <th className="p-2 border w-28">Amount</th>
                              <th className="p-2 border w-12">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(block.measurements || []).map((meas, measIdx) => {
                              const amount = Number(meas.quantity || 0) * Number(meas.rate || 0)
                              return (
                                <tr key={meas.id} className="border-t">
                                  <td className="p-2 border text-center font-medium">{measIdx + 1}</td>
                                  <td className="p-2 border">
                                    <input 
                                      value={meas.description} 
                                      onChange={(e)=>updateMeasurement(workIdx, measIdx, 'description', e.target.value)} 
                                      className="border p-1 w-full"
                                      placeholder="Enter description..."
                                    />
                                  </td>
                                  <td className="p-2 border">
                                    <input 
                                      value={meas.unit} 
                                      onChange={(e)=>updateMeasurement(workIdx, measIdx, 'unit', e.target.value)} 
                                      className="border p-1 w-full"
                                    />
                                  </td>
                                  <td className="p-2 border">
                                    <input 
                                      type="number" 
                                      value={meas.quantity} 
                                      onChange={(e)=>updateMeasurement(workIdx, measIdx, 'quantity', Number(e.target.value))} 
                                      className="border p-1 w-full"
                                    />
                                  </td>
                                  <td className="p-2 border">
                                    <input 
                                      type="number" 
                                      value={meas.rate} 
                                      onChange={(e)=>updateMeasurement(workIdx, measIdx, 'rate', Number(e.target.value))} 
                                      className="border p-1 w-full"
                                    />
                                  </td>
                                  <td className="p-2 border font-medium">{formatCurrency(amount)}</td>
                                  <td className="p-2 border text-center">
                                    <button type="button" onClick={()=>deleteMeasurement(workIdx, measIdx)} className="p-1 border rounded text-red-600">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      <button type="button" onClick={()=>addMeasurement(workIdx)} className="mt-2 px-3 py-1 bg-emerald-600 text-white rounded inline-flex items-center gap-2 text-sm">
                        <Plus className="w-4 h-4" /> Add Measurement Row
                      </button>
                    </div>
                    <div className="flex justify-end pt-2 font-semibold">
                      Section Total: {formatCurrency(calculateSectionTotal(block))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={addWorkBlock} className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg inline-flex items-center justify-center gap-2 font-medium">
              <Plus className="w-5 h-5" /> Add Work
            </button>
          </div>

          <div className="mt-4 space-y-1 text-sm">
            <div>Subtotal: {formatCurrency(data.subtotal)}</div>
            <div className="flex items-center gap-2">Discount %: <input type="number" value={data.discountPercent || 0} onChange={(e)=>setField('discountPercent', Number(e.target.value))} className="border p-1 w-32" /></div>
            <div>Discount Amount: {formatCurrency(data.discount || 0)}</div>
            <div>Subtotal After Discount: {formatCurrency(data.subtotalAfterDiscount || 0)}</div>
            <div className="flex items-center gap-2">GST %: <input type="number" value={data.gstPercent || 0} onChange={(e)=>setField('gstPercent', Number(e.target.value))} className="border p-1 w-32" /></div>
            <div>GST Amount: {formatCurrency(data.gstTotal || 0)}</div>
            <div className="font-semibold">Grand Total: {formatCurrency(data.grandTotal || 0)}</div>
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

        <div className="bg-white p-4 rounded">
          <h3 className="font-semibold mb-2">Quotation Status History</h3>
          {Array.isArray(data.histories) && data.histories.length > 0 ? (
            <div className="space-y-3">
              {data.histories.map((history) => {
                const meta = parseHistoryMeta(history.meta)
                const previousStatus = meta.previousStatus || meta.status || ''
                const newStatus = meta.newStatus || meta.status || ''
                const historyLabel = history.action === 'STATUS_CHANGED'
                  ? previousStatus && newStatus && previousStatus !== newStatus
                    ? `Status changed from ${previousStatus} to ${newStatus}`
                    : `Status changed to ${newStatus}`
                  : history.action

                return (
                  <div key={history.id} className="border rounded p-3 bg-gray-50">
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-semibold">{historyLabel}</div>
                      <div className="text-xs text-gray-500">{new Date(history.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-gray-600">Updated by: {history.adminName || 'System'}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-600">No status change history recorded yet.</div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={downloadPdf} disabled={downloadLoading} className="px-4 py-2 border rounded inline-flex items-center gap-2">
                <Download className="w-4 h-4" /> {downloadLoading ? 'Generating...' : 'Download PDF'}
              </button>
              <button type="button" onClick={handlePrint} className="px-4 py-2 border rounded inline-flex items-center gap-2"><Printer /> Print</button>
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
