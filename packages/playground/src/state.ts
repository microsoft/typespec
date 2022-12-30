import { atom } from "recoil";
import { PlaygroundManifest } from "./manifest.js";

export const emittersOptionsState = atom<Record<string, Record<string, unknown>>>({
  key: "emitterOptions",
  default: {},
});

export const selectedEmitterState = atom({
  key: "selectedEmitter",
  default: PlaygroundManifest.defaultEmitter,
});
