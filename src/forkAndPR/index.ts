import { Octokit } from "octokit";
import { readXLSX } from "../readXLSX";
import { storeXLSX } from "../storeXLSX";
import { ExtractedCommit, MadePR } from "../types";

const octokit = new Octokit({
  auth: process.env.GITHUB_KEY,
});

export const forkAndPR = async () => {
  const PRs: MadePR[] = [];

  const commits = readXLSX<ExtractedCommit>("./forkAndPR/input.xlsx");
  try {
    for (const commit of commits) {
      const { data: fork } = await octokit.rest.repos.createFork({
        owner: commit.owner,
        repo: commit.repo,
      });

      // await BPromise.delay(3000);
      //
      // console.log(`${fork.name}-fork-${commitSubSha}`);
      // const { data: updatedFork } = await octokit.rest.repos.update({
      //   owner: fork.owner.login,
      //   repo: fork.name,
      //   name: `${fork.name}-fork-${commit.sha.substring(0, 5)}`,
      // });

      const { data: commitDetail } = await octokit.rest.repos.getCommit({
        owner: fork.owner.login,
        repo: fork.name,
        ref: commit.sha,
      });
      const commitSubSha = commit.sha.substring(0, 5);

      const commitParent = commitDetail.parents[0];

      await octokit.rest.git.createRef({
        owner: fork.owner.login,
        repo: fork.name,
        ref: `refs/heads/${commitSubSha}`,
        sha: commitDetail.sha,
      });
      await octokit.rest.git.createRef({
        owner: fork.owner.login,
        repo: fork.name,
        ref: `refs/heads/parent${commitSubSha}`,
        sha: commitParent.sha,
      });

      const { data: PR } = await octokit.rest.pulls.create({
        owner: fork.owner.login,
        repo: fork.name,
        head: commitSubSha,
        base: `parent${commitSubSha}`,
        title: "Request to Merge",
      });

      // await octokit.rest.git.updateRef({
      //   owner: updatedFork.owner.login,
      //   repo: updatedFork.name,
      //   ref: "heads/main",
      //   sha: commitParent.sha,
      //   force: true,
      // });

      // const { data: comments } = await octokit.rest.pulls.listReviewComments({
      //   owner: updatedFork.owner.login,
      //   repo: updatedFork.name,
      //   pull_number: PR.number,
      // });

      console.log(PR.url);

      PRs.push({
        repo: fork.name,
        number: PR.number,
        url: PR.html_url,
      });
    }
  } catch (error) {
    console.log(error);

    for (const PR of PRs) {
      const { data: me } = await octokit.rest.users.getAuthenticated();

      await octokit.rest.repos.delete({
        owner: me.login,
        repo: PR.repo,
      });
    }
  }

  await storeXLSX(PRs, "./forkAndPR/output.xlsx");
};
