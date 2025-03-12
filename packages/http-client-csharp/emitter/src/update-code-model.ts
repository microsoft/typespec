import { CodeModel } from "./type/code-model.js";

export type CodeModelUpdate = (model: CodeModel) => CodeModel;

export function updateCodeModel(codeModel: CodeModel, update: CodeModelUpdate | undefined) : CodeModel {
  if (update) {
    return update(codeModel);
  }
  return codeModel;
}
