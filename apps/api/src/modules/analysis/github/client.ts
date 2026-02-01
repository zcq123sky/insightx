// apps/api/src/modules/analysis/github/client.ts
import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";

const EnhancedOctokit = Octokit.plugin(throttling);

export class GitHubClient {
  private octokit: Octokit;

  constructor() {
    this.octokit = new EnhancedOctokit({
      auth: process.env.GITHUB_TOKEN,
      throttle: {
        onRateLimit: (retryAfter: number, options: any) => {
          console.warn(
            `Rate limit exceeded for ${options.method} ${options.url}`,
          );
          return true; // 自动重试
        },
        onSecondaryRateLimit: (retryAfter: number, options: any) => {
          console.warn(
            `Secondary rate limit exceeded for ${options.method} ${options.url}`,
          );
          return true;
        },
      },
    });
  }

  async fetchPRDetails(prUrl: string): Promise<any> {
    const { owner, repo, pull_number } = this.parsePRUrl(prUrl);

    const [pr, files, reviews, comments] = await Promise.all([
      this.octokit.pulls.get({ owner, repo, pull_number }),
      this.octokit.pulls.listFiles({ owner, repo, pull_number }),
      this.octokit.pulls.listReviews({ owner, repo, pull_number }),
      this.octokit.issues.listComments({
        owner,
        repo,
        issue_number: pull_number,
      }),
    ]);

    return {
      metadata: pr.data,
      files: files.data,
      reviews: reviews.data,
      comments: comments.data,
      diff: await this.getPRDiff(owner, repo, pull_number),
    };
  }

  private parsePRUrl(prUrl: string) {
    const url = new URL(prUrl);
    const [, owner, repo, , pull_number] = url.pathname.split("/");
    return { owner, repo, pull_number: parseInt(pull_number) };
  }
}
