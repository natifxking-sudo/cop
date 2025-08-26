interface FileMetadata {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  classification: string
  uploadedBy: string
  uploadedAt: string
  reportId?: string
  eventId?: string
  tags: string[]
  checksum: string
}

class FileStorageService {
  private baseUrl = "/api/files"

  async uploadFile(file: File, metadata: Partial<FileMetadata>): Promise<FileMetadata> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("metadata", JSON.stringify(metadata))

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (!response.ok) {
      throw new Error("File upload failed")
    }

    return response.json()
  }

  async getFile(fileId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/${fileId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (!response.ok) {
      throw new Error("File retrieval failed")
    }

    return response.blob()
  }

  async getFileMetadata(fileId: string): Promise<FileMetadata> {
    const response = await fetch(`${this.baseUrl}/${fileId}/metadata`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (!response.ok) {
      throw new Error("File metadata retrieval failed")
    }

    return response.json()
  }

  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (!response.ok) {
      throw new Error("File deletion failed")
    }
  }

  async listFiles(filters?: { reportId?: string; eventId?: string; classification?: string }): Promise<FileMetadata[]> {
    const params = new URLSearchParams()
    if (filters?.reportId) params.append("reportId", filters.reportId)
    if (filters?.eventId) params.append("eventId", filters.eventId)
    if (filters?.classification) params.append("classification", filters.classification)

    const response = await fetch(`${this.baseUrl}?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (!response.ok) {
      throw new Error("File listing failed")
    }

    return response.json()
  }

  getFileUrl(fileId: string): string {
    return `${this.baseUrl}/${fileId}?token=${localStorage.getItem("token")}`
  }
}

export const fileStorage = new FileStorageService()
export type { FileMetadata }
