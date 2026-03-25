"use client"
import { useState, useRef, useEffect } from "react"
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
// ===== Icons =====
import { 
  FiRotateCw, FiEye, FiEyeOff, FiChevronUp, FiChevronDown, 
  FiTrash2, FiType, FiImage, FiDownload, FiRefreshCw,
  FiPlus, FiX, FiMinus, FiMaximize, FiMinimize,FiLayers,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi'
import { MdOutlinePreview } from 'react-icons/md'


export default function PDFEditor({ pdfFile, onClose }) {
  // ===== ALL YOUR EXISTING STATE & FUNCTIONS GO HERE =====
  // Core state
const [pdfLib, setPdfLib] = useState(null)
  const [isClient, setIsClient] = useState(false)
  const [librariesLoaded, setLibrariesLoaded] = useState(false)
  const [pdfDocument, setPdfDocument] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [scale, setScale] = useState(1.0)
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 })

  // PDF data
  const [pdfData, setPdfData] = useState(null)
  const [originalFile, setOriginalFile] = useState(null)

  // Pages array
  const [pages, setPages] = useState([])
  const [selectedPages, setSelectedPages] = useState([])
  const [pageRotations, setPageRotations] = useState({})
  const [hiddenPages, setHiddenPages] = useState([])

  // Text overlays
  const [textElements, setTextElements] = useState([])
  const [textMode, setTextMode] = useState(false)
  const [currentText, setCurrentText] = useState("")
  const [textStyle, setTextStyle] = useState({ fontSize: 14, color: "#000000" })
  const [isPlacingText, setIsPlacingText] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [showTextPreview, setShowTextPreview] = useState(false)

  // New page from image
  const [newPageImageFile, setNewPageImageFile] = useState(null)
  const [newPagePosition, setNewPagePosition] = useState('after')

  // Merge PDF
  const [mergeFile, setMergeFile] = useState(null)
  const [showMerge, setShowMerge] = useState(false)
  const [mergeDocument, setMergeDocument] = useState(null)
  const [mergePages, setMergePages] = useState([])
  const [showMergePreview, setShowMergePreview] = useState(false)

  // Window size for responsive design
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  })

  // Refs
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const newPageImageInputRef = useRef(null)
  const sidebarRef = useRef(null)
  const resizeObserverRef = useRef(null)

  // User zoom flag
  const userZoomed = useRef(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Load libraries
 useEffect(() => {
  setIsClient(true)

  const loadLibraries = async () => {
    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf")
      pdfjs.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
        setPdfLib(pdfjs)     
        setLibrariesLoaded(true)
    } catch (err) {
      setError("Failed to load PDF libraries: " + err.message)
    }
  }

  loadLibraries()
}, [])

  // Load original PDF
  useEffect(() => {
    if (pdfFile && librariesLoaded && pdfLib && isClient) {
      loadPDF()
    }
  }, [pdfFile, librariesLoaded, pdfLib, isClient])

  // Observe container size changes
  useEffect(() => {
    if (!containerRef.current || !pdfDocument) return

    resizeObserverRef.current = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setContainerDimensions({ width, height })
      if (!userZoomed.current) {
        fitPageToContainer(pdfDocument)
      }
    })

    resizeObserverRef.current.observe(containerRef.current)

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
    }
  }, [pdfDocument])

  const loadPDF = async () => {
    try {
      setLoading(true)
      const arrayBuffer = await pdfFile.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer.slice(0))
      setPdfData(uint8Array)
      setOriginalFile(pdfFile)

      const loadingTask = pdfLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      setPdfDocument(pdf)
      setNumPages(pdf.numPages)

      const initialPages = []
      for (let i = 1; i <= pdf.numPages; i++) {
        initialPages.push({
          id: `orig-${i}`,
          number: i,
          type: 'original',
          originalIndex: i - 1,
          hidden: false
        })
      }
      setPages(initialPages)

      setTextElements([])

      // Fit first page to container
      await fitPageToContainer(pdf)

      setLoading(false)
    } catch (err) {
      setError("Failed to load PDF: " + err.message)
      setLoading(false)
    }
  }

  // Fit page to container with proper scaling
  const fitPageToContainer = async (pdf) => {
    if (!containerRef.current || !pdf) return

    await new Promise(resolve => requestAnimationFrame(resolve))

    const container = containerRef.current
    const containerWidth = container.clientWidth - 40
    const containerHeight = container.clientHeight - 40

    if (containerWidth <= 0 || containerHeight <= 0) {
      setScale(1.0)
      return
    }

    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1 })

    // Calculate scale to fit both width and height
    const scaleWidth = containerWidth / viewport.width
    const scaleHeight = containerHeight / viewport.height
    let newScale = Math.min(scaleWidth, scaleHeight)

    // Responsive min/max scale
    const minScale = 0.3
    const maxScale = 2.5
    
    newScale = Math.max(newScale, minScale)
    newScale = Math.min(newScale, maxScale)

    setScale(newScale)
  }

  // Render current page with proper centering
  // Add these refs near your other refs
const [renderingTask, setRenderingTask] = useState(null);
const renderCancelled = useRef(false);
// Add these refs near your other refs

// Update the renderPage function with better error handling
const renderPage = async (pageNum) => {
  if (!canvasRef.current || !pdfDocument) return;
  
  // Cancel previous rendering task if exists
  if (renderingTask) {
    renderCancelled.current = true;
    try {
      // Don't await cancel - let it happen in background
      renderingTask.cancel().catch(() => {});
    } catch (e) {
      // Ignore cancellation errors
    }
    setRenderingTask(null);
  }

  renderCancelled.current = false;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const pageObj = pages.find(p => p.number === pageNum);
  if (!pageObj) return;

  if (pageObj.type === 'original') {
    try {
      const page = await pdfDocument.getPage(pageObj.originalIndex + 1);
      const rotation = pageRotations[pageNum] || 0;
      const viewport = page.getViewport({ scale, rotation });
      
      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = { 
        canvasContext: ctx, 
        viewport,
        intent: 'display'
      };
      
      // Store the rendering task
      const task = page.render(renderContext);
      setRenderingTask(task);
      
      try {
        await task.promise;
        if (!renderCancelled.current) {
          drawTextOverlays(ctx, pageNum);
        }
      } catch (renderErr) {
        // Only log if it's not a cancellation error
        if (renderErr?.message !== 'Rendering cancelled' && 
            !renderErr?.message?.includes('cancel')) {
          console.error("Render error:", renderErr);
        }
      } finally {
        if (!renderCancelled.current) {
          setRenderingTask(null);
        }
      }
    } catch (err) {
      console.error("Page get error:", err);
    }
  } else if (pageObj.type === 'image') {
    const img = new Image();
    img.src = URL.createObjectURL(pageObj.file);
    await new Promise((resolve) => {
      img.onload = () => {
        if (!renderCancelled.current) {
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          drawTextOverlays(ctx, pageNum);
        }
        URL.revokeObjectURL(img.src);
        resolve();
      };
    });
  }

  if (!renderCancelled.current && isPlacingText && currentText && showTextPreview) {
    ctx.font = `${textStyle.fontSize}px Arial`;
    ctx.fillStyle = textStyle.color;
    ctx.globalAlpha = 0.5;
    ctx.fillText(currentText, mousePosition.x, mousePosition.y);
    ctx.globalAlpha = 1;
  }
};

// Cleanup on component unmount
useEffect(() => {
  return () => {
    renderCancelled.current = true;
    if (renderingTask) {
      try {
        renderingTask.cancel().catch(() => {});
      } catch (e) {
        // Ignore cancellation errors
      }
    }
  };
}, []); // Empty dependency array - only on unmount

// Update the useEffect that triggers render
useEffect(() => {
  let isActive = true;
  
  const doRender = async () => {
    if (pdfDocument && currentPage && isActive) {
      await renderPage(currentPage);
    }
  };
  
  doRender();
  
  // Cleanup function
  return () => {
    isActive = false;
    renderCancelled.current = true;
    if (renderingTask) {
      try {
        renderingTask.cancel().catch(() => {});
      } catch (e) {
        // Ignore cancellation errors
      }
    }
  };
}, [currentPage, scale, pdfDocument, pageRotations, textElements, pages, isPlacingText, mousePosition, showTextPreview]);


  const drawTextOverlays = (ctx, pageNum) => {
    const pageTexts = textElements.filter(t => t.page === pageNum)
    pageTexts.forEach(t => {
      ctx.font = `${t.fontSize}px Arial`
      ctx.fillStyle = t.color
      ctx.fillText(t.text, t.x, t.y)
    })
  }

  // ========== COORDINATE MAPPING ==========
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const canvasX = (e.clientX - rect.left) * scaleX
    const canvasY = (e.clientY - rect.top) * scaleY
    return { x: canvasX, y: canvasY }
  }

  const handleMouseMove = (e) => {
    if (!canvasRef.current || !isPlacingText) return
    const { x, y } = getCanvasCoordinates(e)
    setMousePosition({ x, y })
    setShowTextPreview(true)
  }

  const handleMouseLeave = () => {
    setShowTextPreview(false)
  }

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return
    const { x, y } = getCanvasCoordinates(e)

    if (textMode && isPlacingText && currentText.trim()) {
      setTextElements([...textElements, {
        id: Date.now(),
        text: currentText,
        x, y,
        page: currentPage,
        fontSize: textStyle.fontSize,
        color: textStyle.color
      }])
      setCurrentText("")
      setIsPlacingText(false)
      setTextMode(false)
      setError(`Text placed on page ${currentPage}`)
      setTimeout(() => setError(""), 2000)
    }
  }

  // ========== PAGE MANAGEMENT ==========
  const rotatePage = (pageNum, degrees = 90) => {
    setPageRotations(prev => ({
      ...prev,
      [pageNum]: ((prev[pageNum] || 0) + degrees) % 360
    }))
  }

  const deleteSelectedPages = () => {
    if (selectedPages.length === 0) return
    const newPages = pages.filter(p => !selectedPages.includes(p.number))
    if (newPages.length === 0) {
      setError("Cannot delete all pages")
      return
    }
    setPages(newPages)
    setHiddenPages([...hiddenPages, ...selectedPages])
    setSelectedPages([])
    setNumPages(newPages.length)
    if (selectedPages.includes(currentPage)) {
      setCurrentPage(newPages[0]?.number || 1)
    }
  }

  const toggleHidePage = (pageNum) => {
    setHiddenPages(prev =>
      prev.includes(pageNum) ? prev.filter(p => p !== pageNum) : [...prev, pageNum]
    )
  }

  const movePage = (pageNum, direction) => {
    const index = pages.findIndex(p => p.number === pageNum)
    if (index === -1) return
    const newPages = [...pages]
    if (direction === 'up' && index > 0) {
      [newPages[index-1], newPages[index]] = [newPages[index], newPages[index-1]]
    } else if (direction === 'down' && index < pages.length-1) {
      [newPages[index], newPages[index+1]] = [newPages[index+1], newPages[index]]
    } else return
    newPages.forEach((p, i) => { p.number = i+1 })
    setPages(newPages)
  }

  // ========== TEXT TOOLS ==========
  const enableTextMode = () => {
    setTextMode(true)
    setIsPlacingText(true)
    setCurrentText("")
    setError(`Enter text and click on page ${currentPage}`)
  }

  const deleteTextElement = (id) => {
    setTextElements(textElements.filter(t => t.id !== id))
  }

  // ========== NEW PAGE FROM IMAGE ==========
  const handleNewPageImageSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setNewPageImageFile(file)
    } else {
      setError("Please select a valid image")
    }
  }

  const addPageFromImage = async () => {
    if (!newPageImageFile) return
    try {
      setLoading(true)
      const currentIndex = pages.findIndex(p => p.number === currentPage)
      let insertIndex = newPagePosition === 'after' ? currentIndex + 1 : currentIndex
      if (insertIndex < 0) insertIndex = 0
      if (insertIndex > pages.length) insertIndex = pages.length

      const img = new Image()
      img.src = URL.createObjectURL(newPageImageFile)
      await new Promise((resolve) => { img.onload = resolve })

      const newPageObj = {
        id: `img-${Date.now()}`,
        number: 0,
        type: 'image',
        file: newPageImageFile,
        width: img.width,
        height: img.height,
        hidden: false
      }
      URL.revokeObjectURL(img.src)

      const newPages = [...pages]
      newPages.splice(insertIndex, 0, newPageObj)
      newPages.forEach((p, idx) => { p.number = idx + 1 })
      setPages(newPages)
      setNumPages(newPages.length)
      setCurrentPage(newPageObj.number)
      setNewPageImageFile(null)
      if (newPageImageInputRef.current) newPageImageInputRef.current.value = ''
      setError(`New page added from image`)
      setLoading(false)
    } catch (err) {
      setError("Failed to add page: " + err.message)
      setLoading(false)
    }
  }

  // ========== MERGE ==========
  const handleMergeFile = async (e) => {
    const file = e.target.files[0]
    if (file && file.type === "application/pdf") {
      setMergeFile(file)
      try {
        const arrayBuffer = await file.arrayBuffer()
        const loadingTask = pdfLib.getDocument({ data: arrayBuffer })
        const pdf = await loadingTask.promise
        setMergeDocument(pdf)
        const previewPages = []
        for (let i = 1; i <= pdf.numPages; i++) {
          previewPages.push({ number: i })
        }
        setMergePages(previewPages)
        setShowMergePreview(true)
      } catch (err) {
        setError("Failed to load merge PDF preview")
      }
    }
  }

  const previewMergedPDF = async () => {
    if (!mergeFile) return
    try {
      setLoading(true)
      const dataCopy = pdfData.slice(0)
      const pdfDoc = await PDFDocument.load(dataCopy)
      const mergeArrayBuffer = await mergeFile.arrayBuffer()
      const mergeDoc = await PDFDocument.load(mergeArrayBuffer)

      const previewPdf = await PDFDocument.create()
      const visibleIndices = pages.filter(p => !p.hidden && p.type === 'original').map(p => p.originalIndex)
      const origPages = await previewPdf.copyPages(pdfDoc, visibleIndices)
      origPages.forEach(p => previewPdf.addPage(p))

      const mergePagesCopy = await previewPdf.copyPages(mergeDoc, mergeDoc.getPageIndices())
      mergePagesCopy.forEach(p => previewPdf.addPage(p))

      const previewBytes = await previewPdf.save()
      const blob = new Blob([previewBytes], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      setLoading(false)
    } catch (err) {
      setError("Failed to preview merged PDF")
      setLoading(false)
    }
  }

  const clearMergeFile = () => {
    setMergeFile(null)
    setMergeDocument(null)
    setMergePages([])
    setShowMergePreview(false)
  }

  // ========== DOWNLOAD ==========
  const applyEditsAndDownload = async () => {
    if (!pdfData) return
    try {
      setLoading(true)
      const pdfDoc = await PDFDocument.load(pdfData.slice(0))
      const newPdf = await PDFDocument.create()

      for (const page of pages) {
        if (page.hidden) continue
        if (page.type === 'original') {
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [page.originalIndex])
          const rotation = pageRotations[page.number]
          if (rotation) copiedPage.setRotation(rotation)

          const pageTexts = textElements.filter(t => t.page === page.number)
          if (pageTexts.length > 0) {
            const font = await newPdf.embedFont(StandardFonts.Helvetica)
            const pageHeight = copiedPage.getHeight()
            pageTexts.forEach(t => {
              copiedPage.drawText(t.text, {
                x: t.x,
                y: pageHeight - t.y,
                size: t.fontSize,
                font,
                color: rgb(
                  parseInt(t.color.slice(1,3),16)/255,
                  parseInt(t.color.slice(3,5),16)/255,
                  parseInt(t.color.slice(5,7),16)/255
                )
              })
            })
          }
          newPdf.addPage(copiedPage)
        } else if (page.type === 'image') {
          const arrayBuffer = await page.file.arrayBuffer()
          let image
          if (page.file.type === 'image/jpeg' || page.file.type === 'image/jpg') {
            image = await newPdf.embedJpg(arrayBuffer)
          } else if (page.file.type === 'image/png') {
            image = await newPdf.embedPng(arrayBuffer)
          } else continue
          const imgPage = newPdf.addPage([image.width, image.height])
          imgPage.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
        }
      }

      if (mergeFile) {
        const mergeArrayBuffer = await mergeFile.arrayBuffer()
        const mergeDoc = await PDFDocument.load(mergeArrayBuffer)
        const mergePagesCopy = await newPdf.copyPages(mergeDoc, mergeDoc.getPageIndices())
        mergePagesCopy.forEach(p => newPdf.addPage(p))
      }

      const modifiedPdfBytes = await newPdf.save()
      const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `edited_${originalFile?.name?.replace(/\.[^/.]+$/, "") || 'document'}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
      setLoading(false)
    } catch (err) {
      setError("Failed to apply edits: " + err.message)
      setLoading(false)
    }
  }

  const resetEdits = () => {
    if (pdfDocument) {
      const origPages = []
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        origPages.push({
          id: `orig-${i}`,
          number: i,
          type: 'original',
          originalIndex: i - 1,
          hidden: false
        })
      }
      setPages(origPages)
      setNumPages(pdfDocument.numPages)
      setCurrentPage(1)
      setPageRotations({})
      setHiddenPages([])
      setSelectedPages([])
      setTextElements([])
      setTextMode(false)
      setMergeFile(null)
      setMergeDocument(null)
      setMergePages([])
      setShowMergePreview(false)
      setNewPageImageFile(null)
      if (newPageImageInputRef.current) newPageImageInputRef.current.value = ''
    }
  }

  // Zoom handlers
  const zoomIn = () => {
    userZoomed.current = true;
    setScale(prev => Math.min(prev + 0.1, 2.5));
  }
  
  const zoomOut = () => {
    userZoomed.current = true;
    setScale(prev => Math.max(prev - 0.1, 0.3));
  }

  const resetZoom = () => {
    userZoomed.current = false;
    if (pdfDocument) {
      fitPageToContainer(pdfDocument);
    }
  }

  // Dynamic styles based on window size
  const getStyles = () => {
    const isMobile = windowSize.width <= 768;
    
    return {
     container: {
      width: '100%',
      backgroundColor: '#f8fafc',
      position: 'relative',
    },
    mainLayout: {
      display: 'flex',
      width: '100%',
      flexDirection: isMobile ? 'column' : 'row',
    },
    sidebar: {
      width: isMobile ? '90%' : '320px',
      margin: isMobile ? '10px auto' : '10px',
      backgroundColor: '#ffffff',
      borderRight: isMobile ? 'none' : '1px solid #e2e8f0',
      borderBottom: isMobile ? '1px solid #e2e8f0' : 'none',
      borderRadius: isMobile ? '0 0 12px 12px' : '0',
      padding: isMobile ? '16px' : '24px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '16px' : '24px',
      boxShadow: isMobile ? '0 4px 12px rgba(0,0,0,0.03)' : '4px 0 12px rgba(0,0,0,0.03)',
      flexShrink: 0,
      // Large screen: FIXED height with overflow auto
      ...(!isMobile && { 
        height: '717px',
        overflow: 'auto'  // YEH IMPORTANT HAI - content scroll hoga
      }),
      // Mobile: no height constraints
      overflow: isMobile ? 'visible' : "auto",
    },

      sidebarTitle: {
        margin: '0 0 16px 0',
        color: '#1e293b',
        fontSize: isMobile ? '1.1rem' : '1.25rem',
        fontWeight: 600,
        borderBottom: '2px solid #3b82f6',
        paddingBottom: '8px',
      },
      pageList: {
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        marginTop: '12px',
        backgroundColor: '#ffffff',
        maxHeight: isMobile ? 'none' : '200px',
        overflowY: isMobile ? 'visible' : 'auto',
      },
      viewer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: isMobile ? '16px' : '24px',
        backgroundColor: '#f8fafc',
        height: '100%', // Ensure viewer takes full height
      },
      viewerControls: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isMobile ? '12px' : '20px',
        backgroundColor: '#ffffff',
        padding: isMobile ? '10px 16px' : '12px 20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        flexWrap: 'wrap',
        gap: '10px',
      },
      pageControls: {
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '10px' : '15px',
      },
      zoomControls: {
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '6px' : '10px',
      },
      canvasContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e2e8f0',
        padding: isMobile ? '10px' : '20px',
        borderRadius: '16px',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)',
        // Canvas height as per requirement: mobile 300px, large screen 100%
        height: isMobile ? '300px' : '100%',
        width: '100%',
        minHeight: isMobile ? '300px' : 'auto',
      },
      thumbnails: {
        display: 'flex',
        gap: isMobile ? '8px' : '12px',
        marginTop: isMobile ? '12px' : '20px',
        overflowX: 'auto',
        padding: isMobile ? '8px' : '12px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        WebkitOverflowScrolling: 'touch',
      },
      thumbnail: {
        minWidth: isMobile ? '60px' : '90px',
        width: isMobile ? '60px' : '90px',
        height: isMobile ? '80px' : '120px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'border-color 0.2s, transform 0.1s',
      },
      thumbnailNumber: {
        fontSize: isMobile ? '10px' : '12px',
        color: '#475569',
        fontWeight: 500,
      },
      error: {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#ef4444',
        color: 'white',
        padding: isMobile ? '10px 20px' : '12px 24px',
        borderRadius: '30px',
        zIndex: 2000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: isMobile ? '0.85rem' : '0.95rem',
        fontWeight: 500,
        maxWidth: '90%',
        textAlign: 'center',
      },
      success: {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#10b981',
        color: 'white',
        padding: isMobile ? '10px 20px' : '12px 24px',
        borderRadius: '30px',
        zIndex: 2000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: isMobile ? '0.85rem' : '0.95rem',
        fontWeight: 500,
        maxWidth: '90%',
        textAlign: 'center',
      },
      loading: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1500,
        backdropFilter: 'blur(3px)',
      },
      loadingSpinner: {
        padding: isMobile ? '16px 32px' : '24px 40px',
        backgroundColor: '#ffffff',
        borderRadius: '40px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        fontSize: isMobile ? '1rem' : '1.2rem',
        color: '#3b82f6',
        fontWeight: 500,
      },
      input: {
        width: '100%',
        padding: isMobile ? '8px 10px' : '10px 12px',
        margin: '8px 0',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: isMobile ? '0.85rem' : '0.95rem',
        transition: 'border-color 0.2s',
        outline: 'none',
      },
      fileInput: {
        width: '100%',
        padding: isMobile ? '6px' : '8px',
        margin: '12px 0',
        border: '1px dashed #3b82f6',
        borderRadius: '8px',
        backgroundColor: '#f0f7ff',
        cursor: 'pointer',
        fontSize: isMobile ? '0.85rem' : '0.95rem',
      },
      hint: {
        fontSize: isMobile ? '0.7rem' : '0.8rem',
        color: '#64748b',
        marginTop: '4px',
        fontStyle: 'italic',
      },
      elementList: {
        marginTop: '12px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        maxHeight: isMobile ? 'none' : '150px',
        overflowY: isMobile ? 'visible' : 'auto',
      },
      elementItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isMobile ? '6px 10px' : '8px 12px',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #f1f5f9',
        fontSize: isMobile ? '0.8rem' : '0.9rem',
      },
      deleteButton: {
        padding: isMobile ? '2px 6px' : '4px 8px',
        backgroundColor: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: isMobile ? '0.7rem' : '0.8rem',
        transition: 'background-color 0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      textStyleControls: {
        display: 'flex',
        gap: '10px',
        marginTop: '8px',
        flexWrap: 'wrap',
      },
      mergeInfo: {
        marginTop: '12px',
        padding: isMobile ? '8px' : '12px',
        backgroundColor: '#e8f5e9',
        borderRadius: '8px',
        border: '1px solid #c8e6c9',
        fontSize: isMobile ? '0.85rem' : '0.95rem',
      },
      mergeActions: {
        display: 'flex',
        gap: '10px',
        marginTop: '12px',
        flexWrap: 'wrap',
      },
      previewButton: {
        flex: 1,
        padding: isMobile ? '6px 10px' : '8px 12px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontSize: isMobile ? '0.8rem' : '0.9rem',
      },
      clearButton: {
        padding: isMobile ? '6px 12px' : '8px 16px',
        backgroundColor: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontSize: isMobile ? '0.8rem' : '0.9rem',
      },
      select: {
        padding: isMobile ? '6px' : '8px',
        margin: '8px 0',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        width: '100%',
        backgroundColor: '#ffffff',
        cursor: 'pointer',
        fontSize: isMobile ? '0.85rem' : '0.95rem',
      },
    };
  }

  const styles = getStyles()

  if (!isClient || !librariesLoaded || !pdfLib) {
    return <div style={styles.loading}><div style={styles.loadingSpinner}>Loading PDF Libraries...</div></div>
  }

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* Mobile styles */
        @media (max-width: 768px) {
          .btn-primary, .btn-success {
            padding: 8px 12px;
            font-size: 0.85rem;
          }
          
          .page-item {
            padding: 8px 12px;
            font-size: 0.85rem;
          }
          
          .page-actions button {
            padding: 4px 6px;
            font-size: 0.75rem;
          }
          
          .control-btn {
            padding: 6px 10px;
          }
          
          .tool-section {
            padding: 16px;
          }
        }
        
        /* Small mobile styles */
        @media (max-width: 480px) {
          .page-controls {
            width: 100%;
            justify-content: center;
          }
          
          .zoom-controls {
            width: 100%;
            justify-content: center;
          }
          
          .viewer-controls {
            flex-direction: column;
          }
        }
        
        /* Thumbnails scrollbar */
        .thumbnails {
          scrollbar-width: thin;
          scrollbar-color: #94a3b8 #e2e8f0;
        }
        
        .thumbnails::-webkit-scrollbar {
          height: 6px;
        }
        
        .thumbnails::-webkit-scrollbar-track {
          background: #e2e8f0;
          border-radius: 10px;
        }
        
        .thumbnails::-webkit-scrollbar-thumb {
          background-color: #94a3b8;
          border-radius: 10px;
        }
        
        /* Button styles */
        .btn-primary {
          padding: ${windowSize.width <= 768 ? '8px 12px' : '10px 16px'};
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          margin: 4px 0;
          width: 100%;
          font-size: ${windowSize.width <= 768 ? '0.85rem' : '0.95rem'};
          font-weight: 500;
          transition: background-color 0.15s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-primary:hover {
          background-color: #2563eb;
        }
        .btn-primary:active {
          transform: scale(0.98);
        }
        .btn-primary:disabled {
          background-color: #94a3b8;
          cursor: not-allowed;
        }

        .btn-success {
          padding: ${windowSize.width <= 768 ? '8px 12px' : '10px 16px'};
          background-color: #10b981;
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          margin: 4px 0;
          width: 100%;
          font-size: ${windowSize.width <= 768 ? '0.85rem' : '0.95rem'};
          font-weight: 500;
          transition: background-color 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-success:hover {
          background-color: #059669;
        }

        .btn-download {
          padding: ${windowSize.width <= 768 ? '12px 16px' : '14px 20px'};
          background-color: #10b981;
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: ${windowSize.width <= 768 ? '0.9rem' : '1rem'};
          font-weight: 600;
          margin-top: 16px;
          transition: background-color 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-download:hover {
          background-color: #059669;
        }

        .btn-reset {
          padding: ${windowSize.width <= 768 ? '12px 16px' : '14px 20px'};
          background-color: #ef4444;
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: ${windowSize.width <= 768 ? '0.9rem' : '1rem'};
          font-weight: 600;
          margin-top: 8px;
          transition: background-color 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-reset:hover {
          background-color: #dc2626;
        }

        .page-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: ${windowSize.width <= 768 ? '8px 12px' : '12px 16px'};
          border-bottom: 1px solid #f1f5f9;
          font-size: ${windowSize.width <= 768 ? '0.85rem' : '0.95rem'};
          transition: background-color 0.1s;
        }
        .page-item:hover {
          background-color: #f8fafc;
        }

        .page-actions {
          display: flex;
          gap: 6px;
          margin-left: auto;
        }
        .page-actions button {
          padding: ${windowSize.width <= 768 ? '4px 6px' : '4px 8px'};
          background-color: transparent;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          font-size: ${windowSize.width <= 768 ? '0.75rem' : '0.85rem'};
          transition: background-color 0.15s, border-color 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .page-actions button:hover {
          background-color: #f1f5f9;
          border-color: #94a3b8;
        }

        .control-btn {
          padding: ${windowSize.width <= 768 ? '6px 10px' : '6px 12px'};
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          transition: background-color 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .control-btn:hover {
          background-color: #e2e8f0;
        }

        .reset-zoom-btn {
          padding: ${windowSize.width <= 768 ? '4px 6px' : '4px 8px'};
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          font-size: ${windowSize.width <= 768 ? '0.7rem' : '0.8rem'};
          margin-left: 4px;
        }
        .reset-zoom-btn:hover {
          background-color: #e2e8f0;
        }

        /* Canvas styles */
        canvas {
          display: block;
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          margin: auto;
        }

        /* Tool section styles */
        .tool-section {
          background-color: #ffffff;
          border-radius: 16px;
          padding: ${windowSize.width <= 768 ? '16px' : '20px'};
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .tool-section:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59,130,246,0.1);
        }
      `}</style>

      <div style={styles.container}>
        {error && (
          <div style={error.includes('✓') ? styles.success : styles.error}>
            {error}
          </div>
        )}
        {loading && (
          <div style={styles.loading}>
            <div style={styles.loadingSpinner}>Processing...</div>
          </div>
        )}

        <div className="main-layout" style={styles.mainLayout}>
          {/* Sidebar */}
          <div className="sidebar" style={styles.sidebar} ref={sidebarRef}>
            <h3 style={styles.sidebarTitle}>PDF Tools - Page {currentPage}</h3>

            {/* Page Management */}
            <div className="tool-section">
              <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Pages</h4>
              <button 
                onClick={deleteSelectedPages} 
                disabled={selectedPages.length === 0} 
                className="btn-primary"
              >
                <FiTrash2 /> Delete Selected ({selectedPages.length})
              </button>
              <div style={styles.pageList}>
                {pages.map(page => (
                  <div key={page.id} className="page-item" style={{
                    backgroundColor: selectedPages.includes(page.number) ? '#e0f2fe' : 'transparent',
                    opacity: page.hidden ? 0.5 : 1,
                    border: currentPage === page.number ? '2px solid #3b82f6' : 'none',
                    borderRadius: currentPage === page.number ? '8px' : '0'
                  }}>
                    <input 
                      type="checkbox" 
                      checked={selectedPages.includes(page.number)}
                      onChange={() => {
                        if (selectedPages.includes(page.number))
                          setSelectedPages(selectedPages.filter(p => p !== page.number))
                        else
                          setSelectedPages([...selectedPages, page.number])
                      }} 
                    />
                    <span 
                      onClick={() => setCurrentPage(page.number)} 
                      style={{ cursor: 'pointer', fontWeight: currentPage === page.number ? 'bold' : 'normal' }}
                    >
                      {page.type === 'image' ? '🖼️' : '📄'} Page {page.number}
                    </span>
                    <div className="page-actions">
                      <button onClick={() => rotatePage(page.number, 90)} title="Rotate"><FiRotateCw /></button>
                      <button onClick={() => toggleHidePage(page.number)} title={page.hidden ? 'Show' : 'Hide'}>
                        {page.hidden ? <FiEyeOff /> : <FiEye />}
                      </button>
                      <button onClick={() => movePage(page.number, 'up')} title="Move Up"><FiChevronUp /></button>
                      <button onClick={() => movePage(page.number, 'down')} title="Move Down"><FiChevronDown /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Page from Image */}
            <div className="tool-section">
              <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Add Page from Image</h4>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleNewPageImageSelect} 
                ref={newPageImageInputRef} 
                style={styles.fileInput} 
              />
              {newPageImageFile && (
                <div>
                  <p style={{ margin: '8px 0', fontSize: windowSize.width <= 768 ? '0.8rem' : '0.9rem', color: '#475569' }}>
                    Selected: {newPageImageFile.name}
                  </p>
                  <div>
                    <label style={{ fontSize: windowSize.width <= 768 ? '0.8rem' : '0.9rem', color: '#475569' }}>Insert: </label>
                    <select 
                      value={newPagePosition} 
                      onChange={(e) => setNewPagePosition(e.target.value)} 
                      style={styles.select}
                    >
                      <option value="before">Before current page</option>
                      <option value="after">After current page</option>
                    </select>
                  </div>
                  <button onClick={addPageFromImage} className="btn-success">
                    <FiPlus /> Add Page
                  </button>
                </div>
              )}
            </div>

            {/* Text Overlay */}
            <div className="tool-section">
              <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Text Overlay</h4>
              <button 
                onClick={enableTextMode} 
                className="btn-primary"
                style={{ backgroundColor: textMode ? '#10b981' : '#3b82f6' }}
              >
                <FiType /> {textMode ? 'Text Mode Active' : 'Add Text'}
              </button>
              {textMode && (
                <div>
                  <input 
                    type="text" 
                    value={currentText} 
                    onChange={(e) => setCurrentText(e.target.value)} 
                    placeholder="Enter text" 
                    style={styles.input} 
                  />
                  <div style={styles.textStyleControls}>
                    <input 
                      type="number" 
                      value={textStyle.fontSize} 
                      onChange={(e) => setTextStyle({...textStyle, fontSize: parseInt(e.target.value) || 14})} 
                      style={{...styles.input, width: '70px'}} 
                      min="8" 
                      max="72" 
                    />
                    <input 
                      type="color" 
                      value={textStyle.color} 
                      onChange={(e) => setTextStyle({...textStyle, color: e.target.value})} 
                      style={{ width: '50px', height: '38px', border: '1px solid #e2e8f0', borderRadius: '8px' }} 
                    />
                  </div>
                  <p style={styles.hint}>
                    {isPlacingText ? "Click on page to place" : "Enter text and start placing"}
                  </p>
                </div>
              )}
              {textElements.length > 0 && (
                <div style={styles.elementList}>
                  <h5 style={{ margin: '8px 0', color: '#475569' }}>Added Text:</h5>
                  {textElements.map(t => (
                    <div key={t.id} style={styles.elementItem}>
                      <span style={{ color: t.color }}>Page {t.page}: "{t.text.substring(0, 10)}..."</span>
                      <button onClick={() => deleteTextElement(t.id)} style={styles.deleteButton}><FiX /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Merge PDF */}
            <div className="tool-section">
              <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Merge PDF</h4>
              <button 
                onClick={() => setShowMerge(!showMerge)} 
                className="btn-primary"
              >
                <FiLayers /> {showMerge ? 'Hide' : 'Merge Another PDF'}
              </button>
              {showMerge && (
                <div>
                  <input 
                    type="file" 
                    accept=".pdf" 
                    onChange={handleMergeFile} 
                    style={styles.fileInput} 
                  />
                  {mergeFile && (
                    <div style={styles.mergeInfo}>
                      <p style={{ margin: 0, color: '#065f46', fontWeight: 500 }}>✓ {mergeFile.name}</p>
                      <p style={{ margin: '4px 0', fontSize: windowSize.width <= 768 ? '0.8rem' : '0.9rem' }}>Pages: {mergePages.length}</p>
                      <div style={styles.mergeActions}>
                        <button onClick={previewMergedPDF} style={styles.previewButton}>
                          <MdOutlinePreview /> Preview
                        </button>
                        <button onClick={clearMergeFile} style={styles.clearButton}>
                          <FiX /> Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <button onClick={applyEditsAndDownload} className="btn-download">
              <FiDownload /> Download Edited PDF
            </button>
            <button onClick={resetEdits} className="btn-reset">
              <FiRefreshCw /> Reset All
            </button>
          </div>

          {/* Viewer */}
          <div className="viewer" style={styles.viewer}>
            <div className="viewer-controls" style={styles.viewerControls}>
              <div className="page-controls" style={styles.pageControls}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="control-btn"
                >
                  <FiChevronLeft />
                </button>
                <span style={{ fontWeight: 500, color: '#1e293b' }}>
                  Page {currentPage} of {numPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                  disabled={currentPage === numPages}
                  className="control-btn"
                >
                  <FiChevronRight />
                </button>
              </div>
              <div className="zoom-controls" style={styles.zoomControls}>
                <button onClick={zoomOut} className="control-btn" title="Zoom Out"><FiMinus /></button>
                <span style={{ minWidth: '60px', textAlign: 'center', fontWeight: 600, color: '#3b82f6' }}>
                  {Math.round(scale * 100)}%
                </span>
                <button onClick={zoomIn} className="control-btn" title="Zoom In"><FiPlus /></button>
                <button onClick={resetZoom} className="reset-zoom-btn" title="Reset Zoom">
                  <FiMaximize size={14} />
                </button>
              </div>
            </div>

            <div 
              style={styles.canvasContainer} 
              onClick={handleCanvasClick} 
              onMouseMove={handleMouseMove} 
              onMouseLeave={handleMouseLeave} 
              ref={containerRef}
              className="canvasContainer"
            >
              <canvas 
                ref={canvasRef} 
                style={{ 
                  cursor: isPlacingText ? 'crosshair' : 'default',
                }} 
              />
            </div>

            <div className="thumbnails" style={styles.thumbnails}>
              {pages.filter(p => !p.hidden).map(page => (
                <div
                  key={page.id}
                  onClick={() => setCurrentPage(page.number)}
                  className="thumbnail"
                  style={{
                    ...styles.thumbnail,
                    border: currentPage === page.number ? '3px solid #3b82f6' : '1px solid #e2e8f0'
                  }}
                >
                  <div style={styles.thumbnailNumber}>
                    {page.type === 'image' ? '🖼️' : '📄'} {page.number}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}