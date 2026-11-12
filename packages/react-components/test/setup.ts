import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Use Fluent UI's test fallback until Happy DOM handles animation cancellation correctly.
// https://github.com/capricorn86/happy-dom/issues/2412
Reflect.deleteProperty(Element.prototype, "animate");

// runs a clean after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
