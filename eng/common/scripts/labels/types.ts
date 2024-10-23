export interface RepoConfig {
  repo: {
    owner: string;
    repo: string;
  };
  labels: LabelsConfig;
  areaPaths: Record<string, string[]>;
}

export interface LabelsConfig {
  area: LabelCategory;
  [key: string]: LabelCategory;
}

export interface LabelCategory {
  description: string;
  labels: Record<string, { color: string; description: string }>;
}
