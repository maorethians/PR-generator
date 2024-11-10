export const evaluateContext = `
Consider commit C with changes made to a repository.

The list below is the Ground Truth, directly written by the developer of commit C, consisting of the actual goals they had in mind for the changes:
\`\`\`
{ground_truth}
\`\`\`

The list below is the Candidate, written by someone other than the developer of commit C, detailing their perceived goals from inspecting the changes:
\`\`\`
{candidate}
\`\`\`

Your objectives are to:
1. Determine the mappings between the goals in the Ground Truth and Candidate lists.
2. Utilize the provided "report" tool to document the identified mappings.

When performing this task, strictly adhere to the following guideline:
- Map two goals only if they reflect the intention behind the same group of changes.
`;

// - As the lists may address the changes differently,
