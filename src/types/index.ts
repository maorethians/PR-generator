export interface ExtractedCommit {
  owner: string;
  repo: string;
  sha: string;
  url: string;
}

export interface MadePR {
  repo: string;
  number: number;
  url: string;
}

export interface Generation {
  generated: string;
  ground: string;
  additions: number;
  deletions: number;
}

export type Intentions = Generation & {
  generatedIntentions: string;
  groundIntentions: string;
};

export type Evaluation = Intentions & {
  covered: string;
  coveredLength: number;
  uncovered: string;
  uncoveredLength: number;
  additional: string;
  additionalLength: number;
  precision: number;
  recall: number;
};
