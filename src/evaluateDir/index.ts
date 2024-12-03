import { Octokit } from 'octokit';
import { readXLSX } from '../readXLSX';
import { Evaluation, ExtractedCommit, Generation, MadePR } from '../types';
import { storeXLSX } from '../storeXLSX';
import * as fs from 'node:fs';
import { getIntentions } from '../extractIntentions';
import { getEvaluation } from '../evaluate';
import tokenizer from 'gpt-tokenizer';

const octokit = new Octokit({
  auth: process.env.GITHUB_KEY,
});

export const evaluateDir = async () => {
  const commits = readXLSX<ExtractedCommit>('./evaluateDir/input.xlsx');

  // 0.0001696$ per addition
  const result: Evaluation[] = [];
  let index = 0;
  for (const commit of commits) {
    const { commitDetail, report } = await getReport(commit);
    const { covered, uncovered, additional } = report;

    result.push({
      generated: '',
      ground: '',
      additions: commitDetail.stats!.additions,
      deletions: commitDetail.stats!.deletions,
      groundIntentions: '',
      generatedIntentions: '',
      covered: '',
      coveredLength: covered.length,
      uncovered: '',
      uncoveredLength: uncovered.length,
      additional: '',
      additionalLength: additional.length,
      precision: covered.length / (covered.length + additional.length),
      recall: covered.length / (covered.length + uncovered.length),
    });

    console.log(`${++index}/${commits.length}`);
  }

  await storeXLSX(result, './evaluateDir/output.xlsx');
};

const getReport = async ({ owner, repo, sha }: ExtractedCommit) => {
  const { data: commitDetail } = await octokit.rest.repos.getCommit({
    owner,
    repo,
    ref: sha,
  });

  const generated = fs.readFileSync(
    `./evaluateDir/input/${owner}_${repo}_${sha}.txt`,
    'utf8'
  );
  const generatedTokenLength = tokenizer.encode(generated).length;

  // gpt-4o tokens per min (TPM) rate limit
  if (generatedTokenLength > 20000) {
    return {
      commitDetail,
      report: {
        covered: [],
        uncovered: [''],
        additional: [''],
      },
    };
  }

  const generatedIntentions = await getIntentions(generated);
  const groundIntentions = await getIntentions(commitDetail.commit.message);

  const report = await getEvaluation(
    groundIntentions as string,
    generatedIntentions as string
  );

  if (report) {
    writeFile(
      `./evaluateDir/output/${owner}_${repo}_${sha}_generatedIntentions.txt`,
      [generatedIntentions as string]
    );
    writeFile(
      `./evaluateDir/output/${owner}_${repo}_${sha}_covered.txt`,
      report.covered
    );
    writeFile(
      `./evaluateDir/output/${owner}_${repo}_${sha}_uncovered.txt`,
      report.uncovered
    );
    writeFile(
      `./evaluateDir/output/${owner}_${repo}_${sha}_additional.txt`,
      report.additional
    );
  }

  return {
    commitDetail,
    report: report ?? {
      covered: [],
      uncovered: [''],
      additional: [''],
    },
  };
};

const writeFile = (filePath: string, data: string[]) => {
  const stream = fs.createWriteStream(filePath);
  data.forEach((line) => stream.write(line + '\n'));
  stream.end();
};

// 13 - 59235
// 17 - 34079
// 70 - 25710
// 87 - 15491
// 78 - 12379
// 3 - 12146
// 77 - 11531
// 73 - 10797
// 86 - 10428
// 20 - 10098
