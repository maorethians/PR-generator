export const extractClaims = `
You will be given the message of a commit written by its developer, explaining the intention behind the changes made in the commit.
Your objective is to extract and list all of the independent goals the developer had in mind based solely on the message.

When performing this task, strictly adhere to the following guidelines:
- Make each list item atomic, addressing only one goal at a time.
- Avoid creating items with overlapping or bundled goals. Separate each goal into its own distinct item.
- Include all details that are explicitly mentioned about each goal in the message.
- Do not infer or assume any additional goals beyond what is explicitly mentioned.

Remember that even minor or seemingly less significant goals should be captured.
`;
