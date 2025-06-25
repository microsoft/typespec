import { describe, expect, it } from "vitest";
import { RecursiveClient } from "../../../../../generated/type/model/inheritance/recursive/src/index.js";

describe("Type.Model.Inheritance.Recursive", () => {
  const client = new RecursiveClient({ allowInsecureConnection: true });

  it("should send a PUT request with a recursive Extension model", async () => {
    await client.put({
      level: 0,
      extension: [
        {
          level: 1,
          extension: [
            {
              level: 2,
            },
          ],
        },
        {
          level: 1,
        },
      ],
    });
    // Assert successful request
  });

  it("should handle a GET request returning a recursive Extension model", async () => {
    const response = await client.get();
    expect(response).toEqual({
      level: 0,
      extension: [
        {
          level: 1,
          extension: [
            {
              level: 2,
            },
          ],
        },
        {
          level: 1,
        },
      ],
    }); // Mock API expected value
  });
});
