import { describe, expect, it } from "vitest";
import { isLoopbackAddress } from "./network-utils.js";

describe("isLoopbackAddress", () => {
  it.each([
    ["127.0.0.1", true],
    ["127.1.2.3", true],
    ["::1", true],
    ["::ffff:127.0.0.1", true],
  ])("treats %s as loopback", (address, expected) => {
    expect(isLoopbackAddress(address)).toBe(expected);
  });

  it.each([
    ["0.0.0.0", false],
    ["10.0.0.5", false],
    ["192.168.1.10", false],
    ["::ffff:10.0.0.5", false],
    ["2001:db8::1", false],
    ["", false],
    [undefined, false],
  ])("treats %s as non-loopback", (address, expected) => {
    expect(isLoopbackAddress(address)).toBe(expected);
  });
});
