<script lang="ts">
import "../app.css";
import favicon from "$lib/assets/favicon.svg";

const { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<nav class="bg-white shadow-sm border-b border-gray-200">
		<div class="max-w-6xl mx-auto px-4">
			<div class="flex justify-between h-14">
				<a href="/" class="flex items-center font-semibold text-gray-900">
					InsightX
				</a>
				<div class="flex items-center space-x-6">
					<a href="/" class="text-gray-600 hover:text-gray-900">分析</a>
					<a href="/history" class="text-gray-600 hover:text-gray-900">历史</a>
					<a href="/stats" class="text-gray-600 hover:text-gray-900">统计</a>
				</div>
			</div>
		</div>
	</nav>
	<main class="max-w-6xl mx-auto px-4 py-8">
		{@render children()}
	</main>
</div>
