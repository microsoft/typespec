import { describe, expect, it } from "vitest";
import { generateOperationId } from "../../../src/cli/actions/convert/utils/generate-operation-id.js";

describe("basic functionality", () => {
  it("should generate operation ID for simple path", () => {
    const usedIds = new Set<string>();
    const result = generateOperationId("GET", "/users", usedIds);

    expect(result).toBe("get_users");
  });

  it("should generate operation ID for root path", () => {
    const usedIds = new Set<string>();
    const result = generateOperationId("GET", "/", usedIds);

    expect(result).toBe("get_root");
  });
});

describe("HTTP methods", () => {
  it.each(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"])(
    "should handle %s HTTP method",
    (method) => {
      const usedIds = new Set<string>();
      const result = generateOperationId(method, "/test", usedIds);
      expect(result).toBe(`${method.toLowerCase()}_test`);
    },
  );

  it("should handle lowercase HTTP methods", () => {
    const usedIds = new Set<string>();
    const result = generateOperationId("get", "/users", usedIds);

    expect(result).toBe("get_users");
  });

  it("should handle mixed case HTTP methods", () => {
    const usedIds = new Set<string>();
    const result = generateOperationId("GeT", "/users", usedIds);

    expect(result).toBe("get_users");
  });
});

describe("path transformations", () => {
  it("should replace slashes with underscores", () => {
    const usedIds = new Set<string>();
    const result = generateOperationId("GET", "/api/v1/users", usedIds);

    expect(result).toBe("get_api_v1_users");
  });

  it("should include path parameters", () => {
    const usedIds = new Set<string>();
    const result = generateOperationId("GET", "/users/{id}", usedIds);

    expect(result).toBe("get_users_id");
  });

  it("should handle hyphenated path parameters", () => {
    const usedIds = new Set<string>();
    const result = generateOperationId("GET", "/users/{user-id}/posts/{post-id}", usedIds);

    expect(result).toBe("get_users_user_id_posts_post_id");
  });

  it("should replace special characters with underscores", () => {
    const usedIds = new Set<string>();
    const result = generateOperationId("GET", "/api/v1.0/users-list", usedIds);

    expect(result).toBe("get_api_v1_0_users_list");
  });

  it("should handle multiple consecutive special characters", () => {
    const usedIds = new Set<string>();
    const result = generateOperationId("GET", "/api--v1..0//users", usedIds);

    expect(result).toBe("get_api_v1_0_users");
  });

  it("should remove trailing underscores", () => {
    const usedIds = new Set<string>();
    const result = generateOperationId("GET", "/users/", usedIds);

    expect(result).toBe("get_users");
  });
});

describe("uniqueness handling", () => {
  it("should generate unique IDs when duplicates exist", () => {
    const usedIds = new Set<string>();

    const first = generateOperationId("GET", "/users", usedIds);
    const second = generateOperationId("GET", "/users", usedIds);
    const third = generateOperationId("GET", "/users", usedIds);

    expect(first).toBe("get_users");
    expect(second).toBe("get_users_1");
    expect(third).toBe("get_users_2");

    expect(usedIds.size).toBe(3);
    expect(usedIds.has("get_users")).toBe(true);
    expect(usedIds.has("get_users_1")).toBe(true);
    expect(usedIds.has("get_users_2")).toBe(true);
  });

  it("should handle pre-existing IDs in the set", () => {
    const usedIds = new Set(["get_users", "get_users_1"]);

    const result = generateOperationId("GET", "/users", usedIds);

    expect(result).toBe("get_users_2");
    expect(usedIds.has("get_users_2")).toBe(true);
  });
});
