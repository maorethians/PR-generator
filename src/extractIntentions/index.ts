import { readXLSX } from "../readXLSX";
import { Generation, Intentions } from "../types";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { extractClaims } from "./prompts/extractClaims";
import { storeXLSX } from "../storeXLSX";

const chatClient = new ChatOpenAI({
  apiKey: process.env.OPENAI_KEY,
  model: "gpt-4o",
});

export const extractIntentions = async () => {
  const generations = readXLSX<Generation>("./extractIntentions/input.xlsx");

  let index = 0;
  const result: Intentions[] = [];
  // It costs about 0.0038$ for each row with gpt-4o
  for (const generation of generations) {
    const [{ content: groundIntentions }, { content: generatedIntentions }] =
      await Promise.all([
        chatClient.invoke([
          new SystemMessage(extractClaims),
          new HumanMessage(generation.ground),
        ]),
        chatClient.invoke([
          new SystemMessage(extractClaims),
          new HumanMessage(generation.generated),
        ]),
      ]);

    result.push({
      ...generation,
      generatedIntentions: generatedIntentions as string,
      groundIntentions: groundIntentions as string,
    });

    console.log(`${++index}/${generations.length}`);
  }

  await storeXLSX(result, "./extractIntentions/output.xlsx");
};