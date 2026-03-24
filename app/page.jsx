"use client"
import { useState } from "react"
import Navbar from "./_component/Navbar"
import Upload from "./_component/Upload"
import PDFEditor from "./_component/PDFEDITOR"
import "./App.css"

export default function Home() {
  const [editingPdf, setEditingPdf] = useState(null)

  const handleEditPDF = (pdfFile) => {
    setEditingPdf(pdfFile)
  }

  if (editingPdf) {
    return <PDFEditor pdfFile={editingPdf} onClose={() => setEditingPdf(null)} />
  }

  return (
    <div>
      {/* <h1 style={{ textAlign: "center" }}>
        PDFCraft - Image to PDF Converter
      </h1> */}
      <Upload onEditPDF={handleEditPDF} />
    </div>
  )
}