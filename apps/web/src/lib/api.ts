import { PUBLIC_API_URL } from "$env/static/public";

const API_BASE = PUBLIC_API_URL || "http://localhost:3000";

export function getApiUrl(path: string): string {
	return `${API_BASE}${path}`;
}
