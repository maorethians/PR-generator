import { readXLSX } from "../readXLSX";
import { Octokit } from "octokit";
import { MadePR } from "../types";
import uniq from "lodash/uniq";

export const deletePRFork = async (auth: string) => {
  const octokit = new Octokit({ auth });

  const { data: me } = await octokit.rest.users.getAuthenticated();

  const PRs = readXLSX<MadePR>("./deletePRFork/input.xlsx");
  const uniqueRepos = uniq(PRs.map((PR) => PR.repo));
  for (const repo of uniqueRepos) {
    try {
      await octokit.rest.repos.delete({
        owner: me.login,
        repo: repo,
      });
    } catch (e) {
      console.log(e);
    }
    console.log(repo);
  }
};
