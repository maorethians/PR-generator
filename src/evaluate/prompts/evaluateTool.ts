import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export const evaluateTool = new DynamicStructuredTool({
  name: "report",
  description: `
This tool is for reporting the result of analyzing and comparing the Ground Truth and Candidate lists.
`,
  schema: z
    .object({
      covered: z
        .array(z.string())
        .describe(
          "The goals in the Ground Truth that had a mapping in the Candidate.",
        ),
      uncovered: z
        .array(z.string())
        .describe(
          "The goals in the Ground Truth that didn't have any mapping in the Candidate.",
        ),
      additional: z
        .array(z.string())
        .describe(
          "The goals in the Candidate that didn't have any mapping in the Ground Truth.",
        ),
    })
    .strict(),
  func: async () => "",
});
