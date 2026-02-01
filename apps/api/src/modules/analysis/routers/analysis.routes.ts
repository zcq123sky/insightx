import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { GitHubService } from "./github.service";

const analysisRoutes = new Hono();

const prAnalysisSchema = z.object({
  url: z.string().url(),
});

analysisRoutes.post(
  "/analyze",
  zValidator("json", prAnalysisSchema),
  async (c) => {
    const { url } = c.req.valid("json");

    // 解析URL，提取owner、repo、pullNumber
    // 例如：https://github.com/owner/repo/pull/123
    const parsed = parseGitHubPRUrl(url);
    if (!parsed) {
      return c.json({ error: "Invalid GitHub PR URL" }, 400);
    }

    const { owner, repo, pullNumber } = parsed;

    const githubService = new GitHubService(process.env.GITHUB_TOKEN!);
    const [prDetails, prFiles] = await Promise.all([
      githubService.getPRDetails(owner, repo, pullNumber),
      githubService.getPRFiles(owner, repo, pullNumber),
    ]);

    // 目前我们先返回获取到的数据，后续再添加分析逻辑
    return c.json({
      prDetails,
      prFiles,
    });
  },
);

function parseGitHubPRUrl(
  url: string,
): { owner: string; repo: string; pullNumber: number } | null {
  const regex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
  const match = url.match(regex);
  if (!match) {
    return null;
  }
  return {
    owner: match[1],
    repo: match[2],
    pullNumber: parseInt(match[3]),
  };
}

export { analysisRoutes };
