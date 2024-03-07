import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import {
  getAnyExtensionFromPath,
  getBaseFileName,
  getDirectoryPath,
  getPathComponents,
  getRootLength,
  isUrl,
  joinPaths,
  normalizeSlashes,
  reducePathComponents,
  resolvePath,
} from "../src/core/path-utils.js";

describe("compiler: path utils", () => {
  it("normalizeSlashes", () => {
    strictEqual(normalizeSlashes("a"), "a");
    strictEqual(normalizeSlashes("a/b"), "a/b");
    strictEqual(normalizeSlashes("a\\b"), "a/b");
    strictEqual(normalizeSlashes("\\\\server\\path"), "//server/path");
  });

  it("getRootLength", () => {
    strictEqual(getRootLength("a"), 0);
    strictEqual(getRootLength("/"), 1);
    strictEqual(getRootLength("/path"), 1);
    strictEqual(getRootLength("c:"), 2);
    strictEqual(getRootLength("c:d"), 0);
    strictEqual(getRootLength("c:/"), 3);
    strictEqual(getRootLength("c:\\"), 3);
    strictEqual(getRootLength("//server"), 8);
    strictEqual(getRootLength("//server/share"), 9);
    strictEqual(getRootLength("\\\\server"), 8);
    strictEqual(getRootLength("\\\\server\\share"), 9);
    strictEqual(getRootLength("file:///"), 8);
    strictEqual(getRootLength("file:///path"), 8);
    strictEqual(getRootLength("file:///c:"), 10);
    strictEqual(getRootLength("file:///c:d"), 8);
    strictEqual(getRootLength("file:///c:/path"), 11);
    strictEqual(getRootLength("file:///c%3a"), 12);
    strictEqual(getRootLength("file:///c%3ad"), 8);
    strictEqual(getRootLength("file:///c%3a/path"), 13);
    strictEqual(getRootLength("file:///c%3A"), 12);
    strictEqual(getRootLength("file:///c%3Ad"), 8);
    strictEqual(getRootLength("file:///c%3A/path"), 13);
    strictEqual(getRootLength("file://localhost"), 16);
    strictEqual(getRootLength("file://localhost/"), 17);
    strictEqual(getRootLength("file://localhost/path"), 17);
    strictEqual(getRootLength("file://localhost/c:"), 19);
    strictEqual(getRootLength("file://localhost/c:d"), 17);
    strictEqual(getRootLength("file://localhost/c:/path"), 20);
    strictEqual(getRootLength("file://localhost/c%3a"), 21);
    strictEqual(getRootLength("file://localhost/c%3ad"), 17);
    strictEqual(getRootLength("file://localhost/c%3a/path"), 22);
    strictEqual(getRootLength("file://localhost/c%3A"), 21);
    strictEqual(getRootLength("file://localhost/c%3Ad"), 17);
    strictEqual(getRootLength("file://localhost/c%3A/path"), 22);
    strictEqual(getRootLength("file://server"), 13);
    strictEqual(getRootLength("file://server/"), 14);
    strictEqual(getRootLength("file://server/path"), 14);
    strictEqual(getRootLength("file://server/c:"), 14);
    strictEqual(getRootLength("file://server/c:d"), 14);
    strictEqual(getRootLength("file://server/c:/d"), 14);
    strictEqual(getRootLength("file://server/c%3a"), 14);
    strictEqual(getRootLength("file://server/c%3ad"), 14);
    strictEqual(getRootLength("file://server/c%3a/d"), 14);
    strictEqual(getRootLength("file://server/c%3A"), 14);
    strictEqual(getRootLength("file://server/c%3Ad"), 14);
    strictEqual(getRootLength("file://server/c%3A/d"), 14);
    strictEqual(getRootLength("http://server"), 13);
    strictEqual(getRootLength("http://server/path"), 14);
  });

  it("isUrl", () => {
    // NOT url
    ok(!isUrl("a"));
    ok(!isUrl("/"));
    ok(!isUrl("c:"));
    ok(!isUrl("c:d"));
    ok(!isUrl("c:/"));
    ok(!isUrl("c:\\"));
    ok(!isUrl("//server"));
    ok(!isUrl("//server/share"));
    ok(!isUrl("\\\\server"));
    ok(!isUrl("\\\\server\\share"));

    // Is Url
    ok(isUrl("file:///path"));
    ok(isUrl("file:///c:"));
    ok(isUrl("file:///c:d"));
    ok(isUrl("file:///c:/path"));
    ok(isUrl("file://server"));
    ok(isUrl("file://server/path"));
    ok(isUrl("http://server"));
    ok(isUrl("http://server/path"));
  });

  it("getDirectoryPath", () => {
    strictEqual(getDirectoryPath(""), "");
    strictEqual(getDirectoryPath("a"), "");
    strictEqual(getDirectoryPath("a/b"), "a");
    strictEqual(getDirectoryPath("/"), "/");
    strictEqual(getDirectoryPath("/a"), "/");
    strictEqual(getDirectoryPath("/a/"), "/");
    strictEqual(getDirectoryPath("/a/b"), "/a");
    strictEqual(getDirectoryPath("/a/b/"), "/a");
    strictEqual(getDirectoryPath("c:"), "c:");
    strictEqual(getDirectoryPath("c:d"), "");
    strictEqual(getDirectoryPath("c:/"), "c:/");
    strictEqual(getDirectoryPath("c:/path"), "c:/");
    strictEqual(getDirectoryPath("c:/path/"), "c:/");
    strictEqual(getDirectoryPath("//server"), "//server");
    strictEqual(getDirectoryPath("//server/"), "//server/");
    strictEqual(getDirectoryPath("//server/share"), "//server/");
    strictEqual(getDirectoryPath("//server/share/"), "//server/");
    strictEqual(getDirectoryPath("\\\\server"), "//server");
    strictEqual(getDirectoryPath("\\\\server\\"), "//server/");
    strictEqual(getDirectoryPath("\\\\server\\share"), "//server/");
    strictEqual(getDirectoryPath("\\\\server\\share\\"), "//server/");
    strictEqual(getDirectoryPath("file:///"), "file:///");
    strictEqual(getDirectoryPath("file:///path"), "file:///");
    strictEqual(getDirectoryPath("file:///path/"), "file:///");
    strictEqual(getDirectoryPath("file:///c:"), "file:///c:");
    strictEqual(getDirectoryPath("file:///c:d"), "file:///");
    strictEqual(getDirectoryPath("file:///c:/"), "file:///c:/");
    strictEqual(getDirectoryPath("file:///c:/path"), "file:///c:/");
    strictEqual(getDirectoryPath("file:///c:/path/"), "file:///c:/");
    strictEqual(getDirectoryPath("file://server"), "file://server");
    strictEqual(getDirectoryPath("file://server/"), "file://server/");
    strictEqual(getDirectoryPath("file://server/path"), "file://server/");
    strictEqual(getDirectoryPath("file://server/path/"), "file://server/");
    strictEqual(getDirectoryPath("http://server"), "http://server");
    strictEqual(getDirectoryPath("http://server/"), "http://server/");
    strictEqual(getDirectoryPath("http://server/path"), "http://server/");
    strictEqual(getDirectoryPath("http://server/path/"), "http://server/");
  });

  it("getBaseFileName", () => {
    strictEqual(getBaseFileName(""), "");
    strictEqual(getBaseFileName("a"), "a");
    strictEqual(getBaseFileName("a/"), "a");
    strictEqual(getBaseFileName("/"), "");
    strictEqual(getBaseFileName("/a"), "a");
    strictEqual(getBaseFileName("/a/"), "a");
    strictEqual(getBaseFileName("/a/b"), "b");
    strictEqual(getBaseFileName("c:"), "");
    strictEqual(getBaseFileName("c:d"), "c:d");
    strictEqual(getBaseFileName("c:/"), "");
    strictEqual(getBaseFileName("c:\\"), "");
    strictEqual(getBaseFileName("c:/path"), "path");
    strictEqual(getBaseFileName("c:/path/"), "path");
    strictEqual(getBaseFileName("//server"), "");
    strictEqual(getBaseFileName("//server/"), "");
    strictEqual(getBaseFileName("//server/share"), "share");
    strictEqual(getBaseFileName("//server/share/"), "share");
    strictEqual(getBaseFileName("file:///"), "");
    strictEqual(getBaseFileName("file:///path"), "path");
    strictEqual(getBaseFileName("file:///path/"), "path");
    strictEqual(getBaseFileName("file:///c:"), "");
    strictEqual(getBaseFileName("file:///c:/"), "");
    strictEqual(getBaseFileName("file:///c:d"), "c:d");
    strictEqual(getBaseFileName("file:///c:/d"), "d");
    strictEqual(getBaseFileName("file:///c:/d/"), "d");
    strictEqual(getBaseFileName("http://server"), "");
    strictEqual(getBaseFileName("http://server/"), "");
    strictEqual(getBaseFileName("http://server/a"), "a");
    strictEqual(getBaseFileName("http://server/a/"), "a");
  });

  it("getAnyExtensionFromPath", () => {
    strictEqual(getAnyExtensionFromPath(""), "");
    strictEqual(getAnyExtensionFromPath(".ext"), ".ext");
    strictEqual(getAnyExtensionFromPath("a.ext"), ".ext");
    strictEqual(getAnyExtensionFromPath("/a.ext"), ".ext");
    strictEqual(getAnyExtensionFromPath("a.ext/"), ".ext");
    strictEqual(getAnyExtensionFromPath(".EXT"), ".ext");
    strictEqual(getAnyExtensionFromPath("a.EXT"), ".ext");
    strictEqual(getAnyExtensionFromPath("/a.EXT"), ".ext");
    strictEqual(getAnyExtensionFromPath("a.EXT/"), ".ext");
  });

  it("getPathComponents", () => {
    deepStrictEqual(getPathComponents(""), [""]);
    deepStrictEqual(getPathComponents("a"), ["", "a"]);
    deepStrictEqual(getPathComponents("./a"), ["", ".", "a"]);
    deepStrictEqual(getPathComponents("/"), ["/"]);
    deepStrictEqual(getPathComponents("/a"), ["/", "a"]);
    deepStrictEqual(getPathComponents("/a/"), ["/", "a"]);
    deepStrictEqual(getPathComponents("c:"), ["c:"]);
    deepStrictEqual(getPathComponents("c:d"), ["", "c:d"]);
    deepStrictEqual(getPathComponents("c:/"), ["c:/"]);
    deepStrictEqual(getPathComponents("c:/path"), ["c:/", "path"]);
    deepStrictEqual(getPathComponents("//server"), ["//server"]);
    deepStrictEqual(getPathComponents("//server/"), ["//server/"]);
    deepStrictEqual(getPathComponents("//server/share"), ["//server/", "share"]);
    deepStrictEqual(getPathComponents("file:///"), ["file:///"]);
    deepStrictEqual(getPathComponents("file:///path"), ["file:///", "path"]);
    deepStrictEqual(getPathComponents("file:///c:"), ["file:///c:"]);
    deepStrictEqual(getPathComponents("file:///c:d"), ["file:///", "c:d"]);
    deepStrictEqual(getPathComponents("file:///c:/"), ["file:///c:/"]);
    deepStrictEqual(getPathComponents("file:///c:/path"), ["file:///c:/", "path"]);
    deepStrictEqual(getPathComponents("file://server"), ["file://server"]);
    deepStrictEqual(getPathComponents("file://server/"), ["file://server/"]);
    deepStrictEqual(getPathComponents("file://server/path"), ["file://server/", "path"]);
    deepStrictEqual(getPathComponents("http://server"), ["http://server"]);
    deepStrictEqual(getPathComponents("http://server/"), ["http://server/"]);
    deepStrictEqual(getPathComponents("http://server/path"), ["http://server/", "path"]);
  });

  it("reducePathComponents", () => {
    deepStrictEqual(reducePathComponents([]), []);
    deepStrictEqual(reducePathComponents([""]), [""]);
    deepStrictEqual(reducePathComponents(["", "."]), [""]);
    deepStrictEqual(reducePathComponents(["", ".", "a"]), ["", "a"]);
    deepStrictEqual(reducePathComponents(["", "a", "."]), ["", "a"]);
    deepStrictEqual(reducePathComponents(["", ".."]), ["", ".."]);
    deepStrictEqual(reducePathComponents(["", "..", ".."]), ["", "..", ".."]);
    deepStrictEqual(reducePathComponents(["", "..", ".", ".."]), ["", "..", ".."]);
    deepStrictEqual(reducePathComponents(["", "a", ".."]), [""]);
    deepStrictEqual(reducePathComponents(["", "..", "a"]), ["", "..", "a"]);
    deepStrictEqual(reducePathComponents(["/"]), ["/"]);
    deepStrictEqual(reducePathComponents(["/", "."]), ["/"]);
    deepStrictEqual(reducePathComponents(["/", ".."]), ["/"]);
    deepStrictEqual(reducePathComponents(["/", "a", ".."]), ["/"]);
  });

  it("joinPaths", () => {
    strictEqual(joinPaths("/", "/node_modules/@types"), "/node_modules/@types");
    strictEqual(joinPaths("/a/..", ""), "/a/..");
    strictEqual(joinPaths("/a/..", "b"), "/a/../b");
    strictEqual(joinPaths("/a/..", "b/"), "/a/../b/");
    strictEqual(joinPaths("/a/..", "/"), "/");
    strictEqual(joinPaths("/a/..", "/b"), "/b");
  });

  it("resolvePath", () => {
    strictEqual(resolvePath(""), "");
    strictEqual(resolvePath("."), "");
    strictEqual(resolvePath("./"), "");
    strictEqual(resolvePath(".."), "..");
    strictEqual(resolvePath("../"), "../");
    strictEqual(resolvePath("/"), "/");
    strictEqual(resolvePath("/."), "/");
    strictEqual(resolvePath("/./"), "/");
    strictEqual(resolvePath("/../"), "/");
    strictEqual(resolvePath("/a"), "/a");
    strictEqual(resolvePath("/a/"), "/a/");
    strictEqual(resolvePath("/a/."), "/a");
    strictEqual(resolvePath("/a/./"), "/a/");
    strictEqual(resolvePath("/a/./b"), "/a/b");
    strictEqual(resolvePath("/a/./b/"), "/a/b/");
    strictEqual(resolvePath("/a/.."), "/");
    strictEqual(resolvePath("/a/../"), "/");
    strictEqual(resolvePath("/a/../b"), "/b");
    strictEqual(resolvePath("/a/../b/"), "/b/");
    strictEqual(resolvePath("/a/..", "b"), "/b");
    strictEqual(resolvePath("/a/..", "/"), "/");
    strictEqual(resolvePath("/a/..", "b/"), "/b/");
    strictEqual(resolvePath("/a/..", "/b"), "/b");
    strictEqual(resolvePath("/a/.", "b"), "/a/b");
    strictEqual(resolvePath("/a/.", "."), "/a");
    strictEqual(resolvePath("a", "b", "c"), "a/b/c");
    strictEqual(resolvePath("a", "b", "/c"), "/c");
    strictEqual(resolvePath("a", "b", "../c"), "a/c");
  });
});
