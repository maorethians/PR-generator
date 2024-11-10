import { Octokit } from "octokit";
import { MadePR } from "../../types";

export const codium = async (
  auth: string,
  owner: string,
  PR: MadePR,
): Promise<string> => {
  const octokit = new Octokit({ auth });

  const { data: PRDetail } = await octokit.rest.pulls.get({
    owner,
    repo: PR.repo,
    pull_number: PR.number,
  });

  // const { data: comments } = await octokit.rest.issues.listComments({
  //   owner: me.login,
  //   repo: PR.repo,
  //   issue_number: PR.number,
  //   per_page: 10,
  // });

  const description = PRDetail.body
    ?.split("___")
    .find((section: string) => section.includes("### **Description**"));
  if (!description) {
    throw new Error("There is no codium generation in this PR");
  }

  return description;
};