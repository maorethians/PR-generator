import { Commit } from "./types";

/*
 * Most of current tools are language-agnostic and may cover the developer intentions in non-java files
 * However, CodeNarrator only works with java and for comparing its results with current tools, we consider
 * commits with java files only
 * */
export const isBigCommit = (commit: Commit) =>
  commit.stats?.additions && commit.stats?.additions > 300;
