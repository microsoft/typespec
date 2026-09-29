import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePlaygroundState } from "../src/react/use-playground-state.js";

const pythonConfig =
  'emit:\n  - "@typespec/http-client-python"\nlinter:\n  extends:\n    - "@typespec/http/all"\n';
const samples = {
  "REST framework": {
    content: "model Widget {}",
    preferredEmitter: "@typespec/openapi3",
  },
  "JSON schema": {
    content: "model Other {}",
    preferredEmitter: "@typespec/json-schema",
  },
};

describe("sample initialization", () => {
  it("preserves an explicit config from a shared URL while loading the sample content", () => {
    const { result } = renderHook(() =>
      usePlaygroundState({
        libraries: [],
        samples,
        defaultPlaygroundState: {
          sampleName: "REST framework",
          tspconfig: pythonConfig,
        },
        defaultEmitter: "@typespec/openapi3",
      }),
    );

    expect(result.current.content).toBe(samples["REST framework"].content);
    expect(result.current.tspconfig).toBe(pythonConfig);
    expect(result.current.selectedEmitter).toBe("@typespec/http-client-python");

    act(() => result.current.onSelectedSampleNameChange("JSON schema"));
    expect(result.current.content).toBe(samples["JSON schema"].content);
    expect(result.current.selectedEmitter).toBe("@typespec/json-schema");
  });

  it("applies the sample's preferred emitter when no config was supplied", () => {
    const { result } = renderHook(() =>
      usePlaygroundState({
        libraries: [],
        samples,
        defaultPlaygroundState: { sampleName: "JSON schema" },
        defaultEmitter: "@typespec/openapi3",
      }),
    );

    expect(result.current.selectedEmitter).toBe("@typespec/json-schema");
    expect(result.current.content).toBe(samples["JSON schema"].content);
  });
});
