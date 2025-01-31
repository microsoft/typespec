import { Model } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/experimental/typekit";
import { isHttpFile } from "../../../private.decorators.js";

export interface HttpModel {
  isHttpFile(model: Model): boolean;
}

interface TypekitExtension {
  model: HttpModel;
}

declare module "@typespec/compiler/experimental/typekit" {
  interface ModelKit extends HttpModel {}
}

defineKit<TypekitExtension>({
  model: {
    isHttpFile(model: Model) {
      return isHttpFile(this.program, model);
    },
  },
});
