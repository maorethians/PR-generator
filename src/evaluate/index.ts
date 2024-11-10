import { readXLSX } from "../readXLSX";
import { Evaluation, Intentions } from "../types";
import { ChatOpenAI } from "@langchain/openai";
import { storeXLSX } from "../storeXLSX";
import { evaluateContext } from "./prompts/evaluateContext";
import { evaluateTool } from "./prompts/evaluateTool";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ToolCall } from "@langchain/core/dist/messages/tool";

const chatClient = new ChatOpenAI({
  apiKey: process.env.OPENAI_KEY,
  model: "gpt-4o",
});
const clientWithTools = chatClient.bind({
  tools: [evaluateTool],
});
const prompt = ChatPromptTemplate.fromMessages([["system", evaluateContext]]);
const runnable = prompt.pipe(clientWithTools);

export const evaluate = async () => {
  const intentions = readXLSX<Intentions>("./evaluate/input.xlsx");

  let index = 0;
  const result: Evaluation[] = [];
  // It costs about 0.0035$ for each row with gpt-4o
  for (const intention of intentions) {
    const { generatedIntentions, groundIntentions } = intention;

    let retry = 0;
    let report: ToolCall | undefined;
    while (!report && retry < 3) {
      const res = await runnable.invoke({
        ground_truth: groundIntentions,
        candidate: generatedIntentions,
      });

      report = res.tool_calls?.[0];
      if (!report) {
        console.log(
          `No report found. retry ${++retry}. here is the content of the model: ${res.content}`,
        );
      }
    }

    const { covered, uncovered, additional } = report?.args ?? {
      covered: [],
      uncovered: [""],
      additional: [""],
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

  await storeXLSX(result, "./evaluate/output.xlsx");
};
