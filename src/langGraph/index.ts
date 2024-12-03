import { ChatOpenAI } from '@langchain/openai';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
} from '@langchain/langgraph';
import last from 'lodash/last';
import { tools } from './prompts/tools';

const model = new ChatOpenAI({
  model: 'gpt-4o',
  temperature: 0,
  apiKey: process.env.OPENAI_KEY,
}).bind({ tools });

const callModel = async (state: typeof MessagesAnnotation.State) => {
  const response = await model.invoke(state.messages);

  return { messages: [response] };
};

function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = last(messages) as AIMessage;

  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return 'tools';
  }
  return END;
}

const workflow = new StateGraph(MessagesAnnotation)
  .addNode('agent', callModel)
  .addEdge(START, 'agent')
  .addNode('tools', new ToolNode(tools))
  .addEdge('tools', 'agent')
  .addConditionalEdges('agent', shouldContinue);
const app = workflow.compile();

export const langGraph = async () => {
  const firstState = (await app.invoke({
    messages: [new HumanMessage('what is the weather in sf')],
  })) as typeof MessagesAnnotation.State;
  console.log('First State:', last(firstState.messages)?.content);

  const nextState = (await app.invoke({
    messages: [...firstState.messages, new HumanMessage('what about ny')],
  })) as typeof MessagesAnnotation.State;
  console.log('Next State:', last(nextState.messages)?.content);
};
