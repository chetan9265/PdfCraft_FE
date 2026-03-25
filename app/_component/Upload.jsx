  "use client"
  import { useState } from "react"
  import axios from "axios"
import dynamic from "next/dynamic"

const PDFEditor = dynamic(() => import("./PDFEDITOR"), {
  ssr: false,
})
  export default function Upload() {
    const [file, setFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [pdfFile, setPdfFile] = useState(null)
    const [showEditor, setShowEditor] = useState(false)

    const handleFileChange = (e) => {
      const selectedFile = e.target.files[0]
      if (selectedFile) {
        if (!selectedFile.type.startsWith("image/")) {
          setError("Please select an image file")
          setFile(null)
          return
        }
        setFile(selectedFile)
        setError("")
      }
    }

    const convertToPDF = async () => {
      if (!file) {
        setError("Please select an image first")
        return
      }

      setLoading(true)
      setError("")

      const formData = new FormData()
      formData.append("image", file)

      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/pdf/convert`,
          formData,
          { responseType: "blob" }
        )

        const pdfBlob = new Blob([res.data], { type: "application/pdf" })
        const pdfFileObj = new File([pdfBlob], file.name.split('.')[0] + ".pdf", { 
          type: "application/pdf" 
        })
        
        setPdfFile(pdfFileObj)
        setShowEditor(true)
        
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (showEditor && pdfFile) {
      return <PDFEditor pdfFile={pdfFile} onClose={() => setShowEditor(false)} />
    }

    return (
      <>
        <style>{`
          .upload-container {
            max-width: 500px;
            margin: 40px auto;
            background: white;
            border-radius: 24px;
            padding: 32px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.02);
            border: 1px solid #e2e8f0;
            transition: box-shadow 0.2s;
          }
          .upload-container:hover {
            box-shadow: 0 20px 30px -10px rgba(0,0,0,0.1);
          }
          .upload-title {
            text-align: center;
            color: #1e293b;
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 24px;
          }
          .file-input-wrapper {
            position: relative;
            margin: 20px 0;
          }
          .file-input {
            width: 100%;
            padding: 12px;
            border: 2px dashed #cbd5e1;
            border-radius: 16px;
            background-color: #f8fafc;
            cursor: pointer;
            transition: border-color 0.2s, background-color 0.2s;
            font-size: 0.95rem;
          }
          .file-input:hover {
            border-color: #3b82f6;
            background-color: #f0f7ff;
          }
          .file-info {
            background-color: #e0f2fe;
            padding: 12px 16px;
            border-radius: 12px;
            margin: 16px 0;
            display: flex;
            align-items: center;
            gap: 8px;
            border: 1px solid #bae6fd;
          }
          .file-info p {
            margin: 0;
            color: #0369a1;
            font-weight: 500;
          }
          .error-message {
            background-color: #fee2e2;
            color: #b91c1c;
            padding: 12px 16px;
            border-radius: 12px;
            margin: 16px 0;
            border: 1px solid #fecaca;
            font-weight: 500;
          }
          .btn-primary {
            width: 100%;
            padding: 14px 20px;
            background-color: #3b82f6;
            color: white;
            border: none;
            border-radius: 40px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.15s, transform 0.1s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .btn-primary:hover:not(:disabled) {
            background-color: #2563eb;
          }
          .btn-primary:active:not(:disabled) {
            transform: scale(0.98);
          }
          .btn-primary:disabled {
            background-color: #94a3b8;
            cursor: not-allowed;
          }
          @media (max-width: 640px) {
            .upload-container {
              padding: 24px;
              margin: 20px;
            }
          }
        `}</style>

        <div className="upload-container">
          <h2 className="upload-title">Upload Image to Convert to PDF</h2>
          
          <div className="file-input-wrapper">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
            />
          </div>

          {file && (
            <div className="file-info">
              <p>📄 Selected: {file.name}</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button 
            onClick={convertToPDF}
            disabled={!file || loading}
            className="btn-primary"
          >
            {loading ? "Converting..." : "Convert to PDF"}
          </button>
        </div>
      </>
    )
  }