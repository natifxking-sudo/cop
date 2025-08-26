import { useAuth } from "@/lib/auth/context"

export function apiUrl(path: string): string {
	const base = process.env.NEXT_PUBLIC_API_URL || ""
	return `${base}${path}`
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
	const token = typeof window !== "undefined" ? localStorage.getItem("kc_token") : null
	const headers = new Headers(init.headers)
	if (token) headers.set("Authorization", `Bearer ${token}`)
	return fetch(apiUrl(path), { ...init, headers })
}

export function persistKeycloakToken(token?: string | null) {
	if (typeof window === "undefined") return
	if (token) localStorage.setItem("kc_token", token)
}