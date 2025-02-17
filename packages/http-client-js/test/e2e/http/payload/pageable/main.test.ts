import { describe } from "vitest";
// import { ServerDrivenPaginationClient } from "../../../generated/payload/pageable/src/index.js";

describe.skip("Payload.Pageable", () => {
  // describe("list", () => {
  //   const client = new ServerDrivenPaginationClient({
  //     allowInsecureConnection: true,
  //   });
  //   it("should list users with pagination", async () => {
  //     const users = client.list({
  //       maxpagesize: 3,
  //     });
  //     const firstPage = await users.next();
  //     expect(firstPage.value).toEqual([{ name: "user5" }, { name: "user6" }, { name: "user7" }]);
  //     expect(firstPage.nextLink).toBe(
  //       "http://localhost:3000/payload/pageable?skipToken=name-user7&maxpagesize=3",
  //     );
  //     const secondPage = await users.next();
  //     expect(secondPage.value).toEqual([{ name: "user8" }]);
  //     expect(secondPage.nextLink).toBeUndefined();
  //   });
  // });
});
