import { CodeModel } from "./type/code-model.js";

export type CodeModelUpdate = (model: CodeModel) => CodeModel;

export let updateCodeModelCallback: CodeModelUpdate = (model) => model;

export function setUpdateCodeModelCallback(update: CodeModelUpdate) {
  updateCodeModelCallback = update;
}
