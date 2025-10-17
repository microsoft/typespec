import z from "zod";

export const zRenameData = z.object({
  originalName: z
    .string()
    .describe("The exact original name given by user to check whether it needs to be changed."),
  description: z
    .string()
    .describe(
      "Description about the name, including requirements about the name and other related information that can help to decide whether the name is good or not.",
    ),
});
export type RenameData = z.infer<typeof zRenameData>;

export const zRenameCheckResult = z.object({
  renameNeeded: z.boolean().describe("Indicates if the name needs to be changed. "),
  originalName: z
    .string()
    .describe("The exact original name given by user to check whether it needs to be changed."),
  suggestedNames: z
    .array(z.string())
    .describe(
      "An array of suggested names if it needs to be changed. The suggested names should meet the requirements provided by user and can describe itself well. The suggested names should be listed in a way that the first one is the most preferred name. Provide 3 suggestions at most. Double check you are not suggesting the original name as one of the suggestions.",
    ),
});
export type RenameCheckResult = z.infer<typeof zRenameCheckResult>;
