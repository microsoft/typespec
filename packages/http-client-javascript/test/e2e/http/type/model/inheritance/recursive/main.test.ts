import { describe, expect, it } from "vitest";
import { TypeModelInheritanceRecursiveClient } from "../../../../../generated/http/type/model/inheritance/recursive/http-client-javascript/src/index.js";

describe("Type.Model.Inheritance.Recursive", () => {
  const client = new TypeModelInheritanceRecursiveClient(
    "http://localhost:3000",
  );

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
