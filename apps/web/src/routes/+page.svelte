<script lang="ts">
import { getApiUrl } from "$lib/api";

let prUrl = $state("");
let githubToken = $state("");
let loading = $state(false);
let result = $state<any>(null);
let error = $state("");

async function analyze() {
	if (!prUrl) {
		error = "请输入 PR URL";
		return;
	}

	loading = true;
	error = "";
	result = null;

	try {
		const res = await fetch(getApiUrl("/api/analyze"), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				prUrl,
				githubToken: githubToken || undefined,
			}),
		});

		const data = await res.json();

		if (!res.ok) {
			throw new Error(data.error || "分析失败");
		}

		result = data;
	} catch (e: any) {
		error = e.message;
	} finally {
		loading = false;
	}
}

const exampleUrls = [
	"https://github.com/facebook/react/pull/30419",
	"https://github.com/vercel/next.js/pull/78945",
];
</script>

<div class="max-w-2xl mx-auto">
	<h1 class="text-3xl font-bold text-gray-900 mb-2">AI PR 分析工具</h1>
	<p class="text-gray-600 mb-8">输入 GitHub Pull Request URL，使用 AI 进行代码评审</p>

	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
		<div class="space-y-4">
			<div>
				<label for="prUrl" class="block text-sm font-medium text-gray-700 mb-1">
					PR URL
				</label>
				<input
					id="prUrl"
					type="url"
					bind:value={prUrl}
					placeholder="https://github.com/owner/repo/pull/123"
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
				/>
			</div>

			<div>
				<label for="githubToken" class="block text-sm font-medium text-gray-700 mb-1">
					GitHub Token <span class="text-gray-400 font-normal">(可选，私有仓库需要)</span>
				</label>
				<input
					id="githubToken"
					type="password"
					bind:value={githubToken}
					placeholder="ghp_xxxx"
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
				/>
			</div>

			<button
				onclick={analyze}
				disabled={loading}
				class="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
			>
				{loading ? '分析中...' : '开始分析'}
			</button>
		</div>

		{#if error}
			<div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
				{error}
			</div>
		{/if}
	</div>

	{#if result}
		<div class="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-semibold text-gray-900">分析结果</h2>
				<span class="text-2xl font-bold text-blue-600">{result.analysis.qualityScore}/10</span>
			</div>

			<div class="mb-4">
				<h3 class="text-sm font-medium text-gray-500 mb-1">PR 信息</h3>
				<p class="text-gray-900">{result.pr.title}</p>
				<p class="text-sm text-gray-500">{result.pr.url}</p>
				<p class="text-sm text-gray-500">
					{result.pr.filesChanged} 个文件，+{result.pr.additions} -{result.pr.deletions}
				</p>
			</div>

			<div class="mb-4">
				<h3 class="text-sm font-medium text-gray-500 mb-1">概要</h3>
				<p class="text-gray-700">{result.analysis.summary}</p>
			</div>

			{#if result.analysis.suggestions?.length}
				<div class="mb-4">
					<h3 class="text-sm font-medium text-gray-500 mb-2">建议</h3>
					<ul class="space-y-2">
						{#each result.analysis.suggestions as suggestion}
							<li class="flex items-start gap-2 text-sm text-gray-700">
								<span class="text-blue-500 mt-1">•</span>
								{suggestion}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if result.analysis.potentialRisks?.length}
				<div>
					<h3 class="text-sm font-medium text-gray-500 mb-2">潜在风险</h3>
					<ul class="space-y-2">
						{#each result.analysis.potentialRisks as risk}
							<li class="flex items-start gap-2 text-sm text-red-600">
								<span class="mt-1">⚠️</span>
								{risk}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{/if}

	<div class="mt-8">
		<h3 class="text-sm font-medium text-gray-500 mb-3">示例</h3>
		<div class="flex flex-wrap gap-2">
			{#each exampleUrls as url}
				<button
					onclick={() => (prUrl = url)}
					class="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
				>
					{url.split('/').slice(-2).join('/')}
				</button>
			{/each}
		</div>
	</div>
</div>
