import * as vscode from "vscode";
import { UserAbortedError } from "../utils";
import { outputChannel } from "../elements/output-channel";

// export const getSections = async (fileCode: FileCode, thoughts?: string) => {
//   return await vscode.window.withProgress(
//     {
//       location: vscode.ProgressLocation.Notification,
//       title: "Breaking it down for you...",
//       cancellable: true,
//     },
//     async (_progress, token) => {
//       const lineCount = fileCode.code.split("\n").length;
//       outputChannel.appendLine(`Processing file with ${lineCount} lines`);

//       if (lineCount === 0) {
//         vscode.window.showErrorMessage("File is empty!");
//         return;
//       }

//       // const { sections, error } = await sectionCode(
//       //   fileCode.code,
//       //   thoughts,
//       //   token
//       // );
//       // if (error instanceof UserAbortedError) {
//       //   return;
//       // }
//       // if (error) {
//       //   vscode.window.showErrorMessage(`Code review failed: ${error}`);
//       //   return;
//       // }

//       // if (!sections || sections.length === 0) {
//       //   vscode.window.showErrorMessage("No sections detected!");
//       //   return;
//       // }
//       // return sections;
//     }
//   );
// };
