<script lang="ts">
import { onMount } from "svelte";
import { getApiUrl } from "$lib/api";

let stats = $state<any>(null);
let loading = $state(true);
let error = $state("");

onMount(async () => {
	try {
		const res = await fetch(getApiUrl("/api/stats"));
		const data = await res.json();
		stats = data.data;
	} catch (e: any) {
		error = e.message;
	} finally {
		loading = false;
	}
});
</script>

<div class="max-w-4xl mx-auto">
	<h1 class="text-2xl font-bold text-gray-900 mb-6">统计分析</h1>

	{#if loading}
		<div class="text-center py-12 text-gray-500">加载中...</div>
	{:else if error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
	{:else if stats}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
				<p class="text-sm text-gray-500 mb-1">总分析数</p>
				<p class="text-3xl font-bold text-gray-900">{stats.total}</p>
			</div>
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
				<p class="text-sm text-gray-500 mb-1">平均分</p>
				<p class="text-3xl font-bold text-blue-600">{stats.average}</p>
			</div>
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
				<p class="text-sm text-gray-500 mb-1">最高分</p>
				<p class="text-3xl font-bold text-green-600">{stats.highest}</p>
			</div>
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
				<p class="text-sm text-gray-500 mb-1">最低分</p>
				<p class="text-3xl font-bold text-red-600">{stats.lowest}</p>
			</div>
		</div>

		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">分数分布</h2>
			<div class="flex items-end gap-2 h-40">
				{#each stats.distribution as count, i}
					<div class="flex-1 flex flex-col items-center">
						<div
							class="w-full bg-blue-500 rounded-t transition-all"
							style="height: {stats.total ? (count / Math.max(...stats.distribution)) * 100 : 0}%"
						></div>
						<span class="text-xs text-gray-500 mt-2">{i + 1}</span>
					</div>
				{/each}
			</div>
			<div class="flex justify-between text-xs text-gray-500 mt-2">
				<span>1分</span>
				<span>10分</span>
			</div>
		</div>
	{:else}
		<div class="text-center py-12 text-gray-500">
			<p>暂无数据</p>
			<a href="/" class="text-blue-600 hover:underline">开始分析</a>
		</div>
	{/if}
</div>
