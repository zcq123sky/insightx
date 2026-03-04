<script lang="ts">
import { onMount } from "svelte";
import { getApiUrl } from "$lib/api";

let history = $state<any[]>([]);
let loading = $state(true);
let error = $state("");

onMount(async () => {
	try {
		const res = await fetch(getApiUrl("/api/history"));
		const data = await res.json();
		history = data.data || [];
	} catch (e: any) {
		error = e.message;
	} finally {
		loading = false;
	}
});

function formatDate(date: string) {
	return new Date(date).toLocaleString("zh-CN", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}
</script>

<div class="max-w-4xl mx-auto">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-gray-900">分析历史</h1>
		<a
			href="/"
			class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
		>
			+ 新分析
		</a>
	</div>

	{#if loading}
		<div class="text-center py-12 text-gray-500">加载中...</div>
	{:else if error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
	{:else if history.length === 0}
		<div class="text-center py-12 text-gray-500">
			<p class="mb-4">暂无分析记录</p>
			<a href="/" class="text-blue-600 hover:underline">开始第一次分析</a>
		</div>
	{:else}
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
			<table class="w-full">
				<thead class="bg-gray-50 border-b border-gray-200">
					<tr>
						<th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">PR</th>
						<th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">仓库</th>
						<th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">评分</th>
						<th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">时间</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each history as item}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3">
								<a href={item.url} target="_blank" class="text-blue-600 hover:underline font-medium">
									#{item.number}
								</a>
								<p class="text-sm text-gray-500 truncate max-w-xs">{item.title}</p>
							</td>
							<td class="px-4 py-3 text-sm text-gray-600">{item.repository}</td>
							<td class="px-4 py-3">
								{#if item.qualityScore}
									<span
										class="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium"
										class:bg-green-100={item.qualityScore >= 7}
										class:text-green-800={item.qualityScore >= 7}
										class:bg-yellow-100={item.qualityScore >= 4 && item.qualityScore < 7}
										class:text-yellow-800={item.qualityScore >= 4 && item.qualityScore < 7}
										class:bg-red-100={item.qualityScore < 4}
										class:text-red-800={item.qualityScore < 4}
									>
										{item.qualityScore}/10
									</span>
								{:else}
									<span class="text-gray-400">-</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-sm text-gray-500">{formatDate(item.createdAt)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
