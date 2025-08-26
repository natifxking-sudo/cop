"use client"

import { useState, useEffect } from "react"
import { Download, FileText, ImageIcon, Video, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { fileStorage, type FileMetadata } from "@/lib/storage/file-service"

interface FileViewerProps {
  fileId: string
  metadata?: FileMetadata
}

export function FileViewer({ fileId, metadata }: FileViewerProps) {
  const [fileData, setFileData] = useState<FileMetadata | null>(metadata || null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(!metadata)

  useEffect(() => {
    if (!metadata) {
      loadFileMetadata()
    } else {
      setFileUrl(fileStorage.getFileUrl(fileId))
    }
  }, [fileId, metadata])

  const loadFileMetadata = async () => {
    try {
      const data = await fileStorage.getFileMetadata(fileId)
      setFileData(data)
      setFileUrl(fileStorage.getFileUrl(fileId))
    } catch (error) {
      console.error("[v0] Failed to load file metadata:", error)
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async () => {
    if (!fileUrl || !fileData) return

    try {
      const blob = await fileStorage.getFile(fileId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileData.originalName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("[v0] Download failed:", error)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="h-5 w-5" />
    if (mimeType.startsWith("video/")) return <Video className="h-5 w-5" />
    if (mimeType.startsWith("audio/")) return <Music className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  const renderPreview = () => {
    if (!fileUrl || !fileData) return null

    if (fileData.mimeType.startsWith("image/")) {
      return (
        <img
          src={fileUrl || "/placeholder.svg"}
          alt={fileData.originalName}
          className="max-w-full max-h-96 rounded-lg"
        />
      )
    }

    if (fileData.mimeType.startsWith("video/")) {
      return (
        <video controls className="max-w-full max-h-96 rounded-lg">
          <source src={fileUrl} type={fileData.mimeType} />
          Your browser does not support video playback.
        </video>
      )
    }

    if (fileData.mimeType.startsWith("audio/")) {
      return (
        <audio controls className="w-full">
          <source src={fileUrl} type={fileData.mimeType} />
          Your browser does not support audio playback.
        </audio>
      )
    }

    return (
      <div className="flex items-center justify-center h-32 bg-slate-800 rounded-lg">
        <div className="text-center">
          {getFileIcon(fileData.mimeType)}
          <p className="text-sm text-slate-400 mt-2">Preview not available</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="animate-pulse bg-slate-800 h-32 rounded-lg" />
  }

  if (!fileData) {
    return <div className="text-center text-slate-400 py-8">File not found</div>
  }

  return (
    <div className="space-y-4">
      {/* File info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getFileIcon(fileData.mimeType)}
          <div>
            <h3 className="font-medium text-slate-200">{fileData.originalName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {fileData.classification}
              </Badge>
              <span className="text-xs text-slate-500">{(fileData.size / 1024 / 1024).toFixed(2)} MB</span>
              <span className="text-xs text-slate-500">{new Date(fileData.uploadedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadFile}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="border border-slate-700 rounded-lg p-4">{renderPreview()}</div>

      {/* Tags */}
      {fileData.tags && fileData.tags.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Tags:</span>
          {fileData.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
