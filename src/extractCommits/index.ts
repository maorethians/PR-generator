import { Octokit } from "octokit";
import { filterByMessageLength } from "./filters/filterByMessageLength";
import { filterByAuthor } from "./filters/filterByAuthor";
import { filterByProject } from "./filters/filterByProject";
import { hasJavaChange } from "./filters/hasJavaChange";
import { storeXLSX } from "../storeXLSX";
import { isBigCommit } from "./filters/isBigCommit";
import { Commit } from "./filters/types";

interface OutputCommit {
  owner: string;
  repo: string;
  sha: string;
  url: string;
}

const octokit = new Octokit({
  auth: process.env.GITHUB_KEY,
});

const NUMBER_OF_PAGES = 10;

export const extractCommits = async () => {
  const { data: res } = await octokit.rest.search.repos({
    q: "language:java",
    sort: "stars",
    order: "desc",
    per_page: 100,
  });
  const repos = res.items;
  const validRepos = repos.filter(filterByProject);

  let index = 1;
  const output: OutputCommit[] = [];
  for (const repo of validRepos) {
    const commitResults = await Promise.all(
      Array.from({ length: NUMBER_OF_PAGES }).map((_, index) =>
        octokit.rest.repos.listCommits({
          repo: repo.name,
          owner: repo.owner?.login,
          page: index + 1,
          per_page: 100,
        }),
      ),
    );
    const commits = commitResults
      .map((res: { data: Commit[] }) => res.data)
      .flat();

    const directFilteredCommits = commits
      .filter(filterByMessageLength)
      .filter(filterByAuthor);

    for (const commit of directFilteredCommits) {
      const { data: commitDetail } = await octokit.rest.repos.getCommit({
        repo: repo.name,
        owner: repo.owner?.login,
        ref: commit.sha,
      });

      if (hasJavaChange(commitDetail) && isBigCommit(commitDetail)) {
        output.push({
          owner: repo.owner?.login,
          repo: repo.name,
          sha: commit.sha,
          url: commit.html_url,
        });
      }
    }

    console.log(
      `${index++}/${validRepos.length} - Quota: ${directFilteredCommits.length} - Extracted: ${output.length}`,
    );
  }

  await storeXLSX(output, "./extractCommits/output.xlsx");
};
