import { readXLSX } from '../readXLSX';
import { Evaluation, Intentions } from '../types';
import { ChatOpenAI } from '@langchain/openai';
import { storeXLSX } from '../storeXLSX';
import { evaluateContext } from './prompts/evaluateContext';
import { evaluateTool } from './prompts/evaluateTool';
import { ChatPromptTemplate } from '@langchain/core/prompts';

interface Report {
  covered: string[];
  uncovered: string[];
  additional: string[];
}

const chatClient = new ChatOpenAI({
  apiKey: process.env.OPENAI_KEY,
  model: 'gpt-4o',
});
const clientWithTools = chatClient.bind({
  tools: [evaluateTool],
});
const prompt = ChatPromptTemplate.fromMessages([['system', evaluateContext]]);
const runnable = prompt.pipe(clientWithTools);

export const evaluate = async () => {
  const intentions = readXLSX<Intentions>('./evaluate/input.xlsx');

  let index = 0;
  const result: Evaluation[] = [];
  // It costs about 0.0035$ for each row with gpt-4o
  for (const intention of intentions) {
    const { groundIntentions, generatedIntentions } = intention;
    const report = await getEvaluation(groundIntentions, generatedIntentions);
    const { covered, uncovered, additional } = report ?? {
      covered: [],
      uncovered: [''],
      additional: [''],
    };
    result.push({
      ...intention,
      covered: JSON.stringify(covered),
      coveredLength: covered.length,
      uncovered: JSON.stringify(uncovered),
      uncoveredLength: uncovered.length,
      additional: JSON.stringify(additional),
      additionalLength: additional.length,
      precision: covered.length / (covered.length + additional.length),
      recall: covered.length / (covered.length + uncovered.length),
    });

    console.log(`${++index}/${intentions.length}`);
  }

  await storeXLSX(result, './evaluate/output.xlsx');
};

export const getEvaluation = async (
  ground: string,
  generated: string
): Promise<Report | undefined> => {
  let retry = 0;
  let report: Report | undefined;
  while (!report && retry < 3) {
    const res = await runnable.invoke({
      ground_truth: ground,
      candidate: generated,
    });

    report = res.tool_calls?.[0]?.args as Report | undefined;
    if (!report) {
      console.log(
        `No report found. retry ${++retry}. here is the content of the model: ${res.content}`
      );
    }
  }

  return report;
};
