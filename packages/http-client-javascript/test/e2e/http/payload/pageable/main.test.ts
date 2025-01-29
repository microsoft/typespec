import { describe, expect, it } from "vitest";
import { PayloadPageableClient } from "../../../generated/http/payload/pageable/http-client-javascript/src/index.js";

describe("Payload.Pageable", () => {
  describe("list", () => {
    const client = new PayloadPageableClient("http://localhost:3000");

    it("should list users with pagination", async () => {
      const users = client.list({
        maxpagesize: 3,
      });

      const firstPage = await users.next();
      expect(firstPage.value).toEqual([
        { name: "user5" },
        { name: "user6" },
        { name: "user7" },
      ]);

      expect(firstPage.nextLink).toBe(
        "http://localhost:3000/payload/pageable?skipToken=name-user7&maxpagesize=3",
      );

      const secondPage = await users.next();
      expect(secondPage.value).toEqual([{ name: "user8" }]);
      expect(secondPage.nextLink).toBeUndefined();
    });
  });
});
