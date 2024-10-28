import { defineKit, $ as orig$ } from "@typespec/compiler/typekit";

interface SdkProgramKit {
  _language: string;
}

declare module "@typespec/compiler/typekit" {
  interface ProgramKit extends SdkModelKit {}
}
