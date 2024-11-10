import { Octokit } from "octokit";
import { filterByMessageLength } from "./filters/filterByMessageLength";
import { filterByAuthor } from "./filters/filterByAuthor";
import { filterByProject } from "./filters/filterByProject";
import { hasJavaChange } from "./filters/hasJavaChange";
import { storeXLSX } from "../storeXLSX";

interface OutputCommit {
  owner: string;
  repo: string;
  sha: string;
  url: string;
}

const octokit = new Octokit({
  auth: "",
});

const extractCommits = async () => {
  const { data: res } = await octokit.rest.search.repos({
    q: "language:java",
    sort: "stars",
    order: "desc",
    per_page: 100,
  });
  const repos = res.items;

  const output: OutputCommit[] = [];
  const validRepos = repos.filter(filterByProject);
  let index = 1;
  for (const repo of validRepos) {
    const { data: commits } = await octokit.rest.repos.listCommits({
      repo: repo.name,
      owner: repo.owner?.login,
      per_page: 100,
    });

    const directFilteredCommits = commits
      .filter(filterByMessageLength)
      .filter(filterByAuthor);

    for (const commit of directFilteredCommits) {
      const { data: commitDetail } = await octokit.rest.repos.getCommit({
        repo: repo.name,
        owner: repo.owner?.login,
        ref: commit.sha,
      });

      if (hasJavaChange(commitDetail)) {
        output.push({
          owner: repo.owner?.login,
          repo: repo.name,
          sha: commit.sha,
          url: commit.html_url,
        });
      }
    }

    console.log(`${index++}/${validRepos.length} - ${output.length}`);
  }

  return output;
};

extractCommits().then((res) => storeXLSX(res, "output.xlsx"));
