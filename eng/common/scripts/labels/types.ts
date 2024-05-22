export interface RepoConfig {
  repo: {
    owner: string;
    repo: string;
  },
  labels: LabelsConfig;
  areaPaths: Record<string, string[]>;
  areaLabels: Record<string, { color: string; description: string }>;
}


export interface LabelsConfig {
  [key: string]: {
    description: string;
    labels: Record<string, { color: string; description: string }>;
  }
}
