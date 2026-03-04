// 精简但完整的 Webhook 事件类型
export interface WebhookPayload {
	installation?: {
		id: number;
	};
	repository?: {
		id: number;
		name: string;
		full_name: string;
		owner: {
			login: string;
		};
	};
	pull_request?: {
		id: number;
		number: number;
		state: string;
		title: string;
		body: string | null;
		user: { login: string };
		head: { sha: string };
		created_at: string;
		updated_at: string;
	};
	action?: string;
}

// 你需要的 GitHub API 返回类型
export interface PullRequestDetails {
	title: string;
	body: string | null;
	diff: string; // 原始 diff 文本
	filesChanged: number;
	additions: number;
	deletions: number;
}

export interface CheckRunOutput {
	title: string;
	summary: string;
	text?: string;
}
