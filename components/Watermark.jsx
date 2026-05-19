export default function Watermark() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center opacity-5">
      <img 
        src="/stamp-logo.jpeg" 
        alt="Watermark" 
        className="w-[600px] h-[600px] object-contain"
      />
    </div>
  )
}
