"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, File, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fileStorage, type FileMetadata } from "@/lib/storage/file-service"

interface FileUploadProps {
  onUploadComplete?: (files: FileMetadata[]) => void
  reportId?: string
  eventId?: string
  maxFiles?: number
  acceptedTypes?: string[]
}

export function FileUpload({ onUploadComplete, reportId, eventId, maxFiles = 10, acceptedTypes }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([])
  const [classification, setClassification] = useState("UNCLASSIFIED")

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      setUploading(true)
      setUploadProgress(0)

      try {
        const uploadPromises = acceptedFiles.map(async (file, index) => {
          const metadata = {
            classification,
            reportId,
            eventId,
            tags: [],
          }

          const result = await fileStorage.uploadFile(file, metadata)
          setUploadProgress(((index + 1) / acceptedFiles.length) * 100)
          return result
        })

        const results = await Promise.all(uploadPromises)
        setUploadedFiles((prev) => [...prev, ...results])
        onUploadComplete?.(results)
      } catch (error) {
        console.error("[v0] Upload error:", error)
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    },
    [classification, reportId, eventId, onUploadComplete],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    accept: acceptedTypes
      ? acceptedTypes.reduce(
          (acc, type) => {
            acc[type] = []
            return acc
          },
          {} as Record<string, string[]>,
        )
      : undefined,
  })

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  return (
    <div className="space-y-4">
      {/* Classification selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-300">Classification:</label>
        <Select value={classification} onValueChange={setClassification}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UNCLASSIFIED">UNCLASSIFIED</SelectItem>
            <SelectItem value="CONFIDENTIAL">CONFIDENTIAL</SelectItem>
            <SelectItem value="SECRET">SECRET</SelectItem>
            <SelectItem value="TOP_SECRET">TOP SECRET</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-400 bg-blue-400/10"
            : "border-slate-600 hover:border-slate-500 hover:bg-slate-800/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-slate-300">Drop files here...</p>
        ) : (
          <div>
            <p className="text-slate-300 mb-2">Drag & drop files here, or click to select</p>
            <p className="text-sm text-slate-500">
              {acceptedTypes ? `Accepted: ${acceptedTypes.join(", ")}` : "All file types accepted"}
            </p>
          </div>
        )}
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Uploading...</span>
            <span className="text-sm text-slate-400">{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {/* Uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-300">Uploaded Files</h4>
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
              <File className="h-4 w-4 text-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{file.originalName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {file.classification}
                  </Badge>
                  <span className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
