import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { createFileViewer } from "../src/react/output-view/file-viewer.js";

vi.mock("../src/react/file-output/file-output.js", () => ({
  FileOutput: ({ content }: { content: string }) => <pre data-testid="content">{content}</pre>,
}));

function createProgram(files: Record<string, string>): any {
  return {
    host: {
      readFile: async (path: string) => {
        const name = path.replace("./tsp-output/", "");
        if (!(name in files)) throw new Error(`File /test/tsp-output/${name} not found.`);
        return { text: files[name] };
      },
    },
  };
}

it("keeps showing the previous content when preserved output files were removed", async () => {
  const viewer = createFileViewer([]);
  const { rerender } = render(
    viewer.render({
      program: createProgram({ "openapi.yaml": "openapi: 3.0.0" }),
      outputFiles: ["openapi.yaml"],
    } as any),
  );
  expect(await screen.findByText("openapi: 3.0.0")).toBeInTheDocument();

  // A failed compile empties tsp-output but the playground keeps the previous file list.
  const unhandled = vi.fn();
  process.on("unhandledRejection", unhandled);
  try {
    rerender(viewer.render({ program: createProgram({}), outputFiles: ["openapi.yaml"] } as any));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(unhandled).not.toHaveBeenCalled();
    expect(screen.getByTestId("content")).toHaveTextContent("openapi: 3.0.0");
  } finally {
    process.off("unhandledRejection", unhandled);
  }
});
