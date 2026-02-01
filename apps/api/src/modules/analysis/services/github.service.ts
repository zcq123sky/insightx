/**
 * GitHub API 服务
 * 公司规范：
 * 1. 所有外部API调用必须有重试机制
 * 2. 必须处理速率限制
 * 3. 必须有完整的错误类型定义
 * 4. 必须支持可观测性（日志、指标）
 */

import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";
import { retry } from "@octokit/plugin-retry";
import { logger } from "../../../lib/logger";
import { AppError, ErrorCode } from "../../../lib/errors";

const EnhancedOctokit = Octokit.plugin(throttling, retry);

export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  base: {
    ref: string;
    repo: {
      full_name: string;
    };
  };
  head: {
    ref: string;
    sha: string;
  };
}

export interface GitHubFile {
  filename: string;
  status: "added" | "removed" | "modified" | "renamed";
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface GitHubReview {
  id: number;
  body: string | null;
  state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED";
  user: {
    login: string;
  };
}

/**
 * GitHub API 客户端
 * 实现公司的重试和监控标准
 */
export class GitHubService {
  private octokit: Octokit;
  private logger = logger.child({ context: "GitHubService" });

  constructor(token: string) {
    this.octokit = new EnhancedOctokit({
      auth: token,
      throttle: {
        onRateLimit: (retryAfter: number, options: any, octokit: Octokit) => {
          this.logger.warn(
            `GitHub API 速率限制: ${options.method} ${options.url}`,
          );

          if (options.request.retryCount < 2) {
            this.logger.info(`⏳ 将在 ${retryAfter} 秒后重试`);
            return true;
          }
          return false;
        },
        onSecondaryRateLimit: (
          retryAfter: number,
          options: any,
          octokit: Octokit,
        ) => {
          this.logger.warn(
            `GitHub API 二级速率限制: ${options.method} ${options.url}`,
          );
          return false;
        },
      },
      retry: {
        doNotRetry: ["400", "401", "403", "404", "422"],
        retries: 3,
        backoff: (retryCount: number) => {
          return Math.min(2 ** retryCount * 1000, 30000);
        },
      },
    });
  }

  /**
   * 获取PR详细信息
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param pullNumber PR编号
   * @throws {AppError} 如果PR不存在或访问被拒绝
   */
  async getPRDetails(
    owner: string,
    repo: string,
    pullNumber: number,
  ): Promise<GitHubPR> {
    try {
      this.logger.debug(`获取PR详情: ${owner}/${repo}#${pullNumber}`);

      const { data } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
      });

      return this.transformPRData(data);
    } catch (error: any) {
      this.logger.error({ error }, "获取PR详情失败");

      if (error.status === 404) {
        throw new AppError(
          ErrorCode.PR_NOT_FOUND,
          `未找到PR: ${owner}/${repo}#${pullNumber}`,
        );
      }

      if (error.status === 403) {
        throw new AppError(
          ErrorCode.ACCESS_DENIED,
          "没有权限访问此仓库，请检查GitHub Token",
        );
      }

      throw new AppError(
        ErrorCode.EXTERNAL_API_ERROR,
        `GitHub API错误: ${error.message}`,
      );
    }
  }

  /**
   * 获取PR变更的文件列表
   */
  async getPRFiles(
    owner: string,
    repo: string,
    pullNumber: number,
  ): Promise<GitHubFile[]> {
    try {
      this.logger.debug(`获取PR文件列表: ${owner}/${repo}#${pullNumber}`);

      const { data } = await this.octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber,
        per_page: 100,
      });

      return data.map((file) => ({
        filename: file.filename,
        status: file.status as any,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
      }));
    } catch (error: any) {
      this.logger.error({ error }, "获取PR文件列表失败");
      throw new AppError(
        ErrorCode.EXTERNAL_API_ERROR,
        `获取PR文件失败: ${error.message}`,
      );
    }
  }

  /**
   * 获取PR的评论和审查
   */
  async getPRComments(
    owner: string,
    repo: string,
    pullNumber: number,
  ): Promise<GitHubReview[]> {
    try {
      this.logger.debug(`获取PR评论: ${owner}/${repo}#${pullNumber}`);

      const [reviews, comments] = await Promise.all([
        this.octokit.pulls.listReviews({
          owner,
          repo,
          pull_number: pullNumber,
          per_page: 100,
        }),
        this.octokit.issues.listComments({
          owner,
          repo,
          issue_number: pullNumber,
          per_page: 100,
        }),
      ]);

      const allComments = [
        ...reviews.data.map((review) => ({
          id: review.id,
          body: review.body,
          state: review.state as any,
          user: { login: review.user?.login || "unknown" },
          type: "review" as const,
        })),
        ...comments.data.map((comment) => ({
          id: comment.id,
          body: comment.body,
          state: "COMMENTED" as const,
          user: { login: comment.user?.login || "unknown" },
          type: "comment" as const,
        })),
      ];

      return allComments;
    } catch (error: any) {
      this.logger.error({ error }, "获取PR评论失败");
      throw new AppError(
        ErrorCode.EXTERNAL_API_ERROR,
        `获取PR评论失败: ${error.message}`,
      );
    }
  }

  /**
   * 获取仓库的README
   */
  async getRepoReadme(owner: string, repo: string): Promise<string | null> {
    try {
      const { data } = await this.octokit.repos.getReadme({
        owner,
        repo,
      });

      return Buffer.from(data.content, "base64").toString("utf-8");
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 转换原始GitHub数据到我们的类型
   */
  private transformPRData(data: any): GitHubPR {
    return {
      id: data.id,
      number: data.number,
      title: data.title,
      body: data.body,
      state: data.state,
      html_url: data.html_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user: {
        login: data.user?.login || "unknown",
        avatar_url: data.user?.avatar_url || "",
      },
      base: {
        ref: data.base.ref,
        repo: {
          full_name: data.base.repo?.full_name || `${owner}/${repo}`,
        },
      },
      head: {
        ref: data.head.ref,
        sha: data.head.sha,
      },
    };
  }

  /**
   * 解析GitHub PR URL
   * @returns { owner: string, repo: string, pullNumber: number }
   * @throws {AppError} 如果URL格式无效
   */
  static parsePRUrl(prUrl: string): {
    owner: string;
    repo: string;
    pullNumber: number;
  } {
    try {
      const url = new URL(prUrl);

      if (!url.hostname.includes("github.com")) {
        throw new Error("必须是GitHub URL");
      }

      const parts = url.pathname.split("/").filter(Boolean);

      if (parts.length < 4 || parts[2] !== "pull") {
        throw new Error("无效的PR URL格式");
      }

      const owner = parts[0];
      const repo = parts[1];
      const pullNumber = parseInt(parts[3], 10);

      if (isNaN(pullNumber)) {
        throw new Error("PR编号必须是数字");
      }

      return { owner, repo, pullNumber };
    } catch (error: any) {
      throw new AppError(
        ErrorCode.INVALID_INPUT,
        `无效的GitHub PR URL: ${error.message}`,
      );
    }
  }
}
