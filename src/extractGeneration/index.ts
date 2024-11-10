import { Octokit } from "octokit";
import { readXLSX } from "../readXLSX";
import { ExtractedCommit, Generation, MadePR } from "../types";
import { codium } from "./generators/codium";
import { storeXLSX } from "../storeXLSX";

export const extractGeneration = async (auth: string) => {
  const commits = readXLSX<ExtractedCommit>("./extractGeneration/commits.xlsx");
  const PRs = readXLSX<MadePR>("./extractGeneration/PRs.xlsx");

  const octokit = new Octokit({ auth });
  const { data: me } = await octokit.rest.users.getAuthenticated();

  const result: Generation[] = [];
  let index = 0;
  for (const PR of PRs) {
    const description = await codium(auth, me.login, PR);

    const commit = commits[index++];
    const { data: commitDetail } = await octokit.rest.repos.getCommit({
      owner: me.login,
      repo: PR.repo,
      ref: commit.sha,
    });

    result.push({
      generated: description,
      ground: commitDetail.commit.message,
      url: commitDetail.html_url,
      additions: commitDetail.stats?.additions,
      deletions: commitDetail.stats?.deletions,
    });

    console.log(`${index}/${PRs.length}`);
  }

  await storeXLSX(result, "./extractGeneration/output.xlsx");
};
