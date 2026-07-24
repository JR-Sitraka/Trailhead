export type RepoStatus = 'queued' | 'analyzing' | 'ready' | 'failed';
export type RepoSource = 'github' | 'zip';

export interface Repository {
  id: string;
  name: string;
  path: string;
  status: RepoStatus;
  commitSha: string | null;
  lastAnalyzed: string;
  source: RepoSource;
}

export interface AnalysisJob {
  id: string;
  status: string;
  truncated: boolean;
  parsingCompletedAt: string | null;
  embeddingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiRepository {
  id: string;
  name: string;
  status: RepoStatus;
  source: RepoSource;
  sourceUrl: string | null;
  commitSha: string | null;
  createdAt: string;
  updatedAt: string;
  analysisJob: AnalysisJob | null;
}
