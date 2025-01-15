import { Model } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/typekit";
import { isHttpFile } from "../../private.decorators.js";

export interface HttpModel {
  isHttpFile(model: Model): boolean;
}

interface TypekitExtension {
  model: HttpModel;
}

declare module "@typespec/compiler/typekit" {
  interface ModelKit extends HttpModel {}
}

defineKit<TypekitExtension>({
  model: {
    isHttpFile(model: Model) {
      return isHttpFile(this.program, model);
    },
  },
});
