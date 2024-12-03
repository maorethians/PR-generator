import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
// import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

export const tools = [
  // new TavilySearchResults({ maxResults: 3, apiKey: process.env.TAVILY_KEY }),
  new DynamicStructuredTool({
    name: "getWeather",
    description: "it returns the weather information of a city",
    schema: z.object({
      city: z
        .string()
        .describe("name of the city you want the weather information for it"),
    }),
    func: async ({ city }) => {
      console.log(`Tool call: ${city}`);
      return `
      Temperature: 14 °C
      Feels: 12
      Wind: 25 km/h
      Humidity: 51%`;
    },
  }),
];
