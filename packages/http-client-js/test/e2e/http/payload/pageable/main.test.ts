/* eslint-disable vitest/no-commented-out-tests */
import { describe, expect, it } from "vitest";
import { ServerDrivenPaginationClient, Pet } from "../../../generated/payload/pageable/src/index.js";

describe("Payload.Pageable", () => {
  describe("list", () => {
    const client = new ServerDrivenPaginationClient({
      allowInsecureConnection: true,
    });
    const pets = [
      { id: "1", name: "dog" },
      { id: "2", name: "cat" },
      { id: "3", name: "bird" },
      { id: "4", name: "fish" }
    ]
    it("Payload Pageable ServerDriven Pagination link", async () => {
      const iter = await client.link();
      const items: Array<Pet> = [];
      for await (const user of iter) {
        items.push(user);
      }
      expect(items.length).toEqual(4);
      expect(items).toStrictEqual(pets);
    });

    it("continuation token for requestHeaderResponseBody", async () => {
      const iter = await client.continuationTokenClient.requestHeaderResponseBody({ bar: "bar", foo: "foo" });
      const items: Array<Pet> = [];
      for await (const user of iter) {
        items.push(user);
      }
      expect(items.length).toEqual(4);
      expect(items).toStrictEqual(pets);
    });

    it("continuation token for requestQueryResponseBody", async () => {
      const iter = await client.continuationTokenClient.requestQueryResponseBody({ bar: "bar", foo: "foo" });
      const items: Array<Pet> = [];
      for await (const user of iter) {
        items.push(user);
      }
      expect(items.length).toEqual(4);
      expect(items).toStrictEqual(pets);
    });

    it("continuation token for requestHeaderResponseHeader", async () => {
      const iter = await client.continuationTokenClient.requestHeaderResponseHeader({ bar: "bar", foo: "foo" });
      const items: Array<Pet> = [];
      for await (const user of iter) {
        items.push(user);
      }
      expect(items.length).toEqual(4);
      expect(items).toStrictEqual(pets);
    });

    it("continuation token for requestQueryResponseHeader", async () => {
      const iter = await client.continuationTokenClient.requestQueryResponseHeader({ bar: "bar", foo: "foo" });
      const items: Array<Pet> = [];
      for await (const user of iter) {
        items.push(user);
      }
      expect(items.length).toEqual(4);
      expect(items).toStrictEqual(pets);
    });
  });
});
