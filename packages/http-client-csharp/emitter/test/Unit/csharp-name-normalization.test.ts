import { describe, expect, it } from "vitest";
import {
  isDateTimeInputType,
  normalizeAcronyms,
  normalizeDateTimeSuffix,
  normalizeName,
  normalizeUrlSuffix,
  toIdentifierName,
} from "../../src/lib/csharp-name-normalization.js";
import type { CSharpEmitterContext } from "../../src/sdk-context.js";
import type { InputType } from "../../src/type/input-type.js";

const debugMessages: string[] = [];
const context = {
  logger: { debug: (message: string) => debugMessages.push(message) },
} as unknown as CSharpEmitterContext;

function normalize<T extends { name: string; originalName?: string }>(target: T): T {
  target.originalName ??= target.name;
  return normalizeName(context, target);
}

const utcDateTime: InputType = {
  kind: "utcDateTime",
  name: "utcDateTime",
  encode: "rfc3339",
  wireType: { kind: "string", name: "string", crossLanguageDefinitionId: "TypeSpec.string" },
  crossLanguageDefinitionId: "TypeSpec.utcDateTime",
} as InputType;

const plainDate: InputType = {
  kind: "plainDate",
  name: "plainDate",
  crossLanguageDefinitionId: "TypeSpec.plainDate",
} as InputType;

const stringType: InputType = {
  kind: "string",
  name: "string",
  crossLanguageDefinitionId: "TypeSpec.string",
} as InputType;

const types: Record<string, InputType> = {
  utcDateTime,
  plainDate,
  string: stringType,
};

describe("toIdentifierName", () => {
  it.each([
    ["ipAddress", "IpAddress"],
    ["ip_address", "IpAddress"],
    ["IPAddress", "IPAddress"],
    ["IPv4Address", "IPv4Address"],
    ["1st", "_1st"],
    ["", ""],
  ])("converts %s to %s", (name, expected) => {
    expect(toIdentifierName(name)).toBe(expected);
  });
});

describe("normalizeAcronyms", () => {
  it.each([
    ["IpAddress", "IPAddress"],
    ["IpV4Address", "IPv4Address"],
    ["Ipv4Address", "IPv4Address"],
    ["IpV6Address", "IPv6Address"],
    ["DbName", "DBName"],
    ["OsProfile", "OSProfile"],
    ["Ipsum", "Ipsum"],
    ["Address", "Address"],
  ])("normalizes %s to %s", (name, expected) => {
    expect(normalizeAcronyms(name)).toBe(expected);
  });
});

describe("normalizeUrlSuffix", () => {
  it.each([
    ["CallbackUrl", "CallbackUri"],
    ["Url", "Uri"],
    ["CallbackUrlValue", "CallbackUrlValue"],
    ["CallbackUrls", "CallbackUrls"],
    ["CallbackURL", "CallbackURL"],
    ["", ""],
  ])("normalizes %s to %s", (name, expected) => {
    expect(normalizeUrlSuffix(name)).toBe(expected);
  });
});

describe("normalizeDateTimeSuffix", () => {
  it.each([
    ["startTime", "utcDateTime", "startsOn"],
    ["StartDate", "utcDateTime", "StartsOn"],
    ["startOn", "utcDateTime", "startsOn"],
    ["EndOn", "utcDateTime", "EndsOn"],
    ["startsOn", "utcDateTime", "startsOn"],
    ["endsOn", "utcDateTime", "endsOn"],
    ["endTimestamp", "utcDateTime", "endsOn"],
    ["EndAt", "utcDateTime", "EndsOn"],
    ["leaseStartDateTime", "utcDateTime", "leaseStartsOn"],
    ["MaintenanceEndTime", "utcDateTime", "MaintenanceEndsOn"],
    ["createdOn", "utcDateTime", "createdOn"],
    ["turnOn", "utcDateTime", "turnOn"],
    ["firstOn", "utcDateTime", "firstOn"],
    ["lastOn", "utcDateTime", "lastOn"],
    ["firstTimestamp", "utcDateTime", "firstTimestamp"],
    ["FirstTime", "utcDateTime", "FirstTime"],
    ["lastDateTime", "utcDateTime", "lastDateTime"],
    ["LastAt", "utcDateTime", "LastAt"],
    ["Date", "plainDate", "Date"],
    ["date", "plainDate", "date"],
    ["Timestamp", "utcDateTime", "Timestamp"],
    ["timestamp", "utcDateTime", "timestamp"],
    ["fromTime", "utcDateTime", "fromTime"],
    ["toDate", "utcDateTime", "toDate"],
    ["pointInTime", "utcDateTime", "pointInTime"],
    ["recoveryPointInTime", "utcDateTime", "recoveryPointInTime"],
    ["startTime", "string", "startTime"],
    ["startOn", "string", "startOn"],
    ["createdAt", "utcDateTime", "createdOn"],
    ["expiresAt", "utcDateTime", "expiresOn"],
    ["deletedTime", "utcDateTime", "deletedOn"],
    ["finishedTime", "utcDateTime", "finishedOn"],
    ["CreationTime", "utcDateTime", "CreatedOn"],
    ["creationTime", "utcDateTime", "createdOn"],
    ["ExpirationDate", "utcDateTime", "ExpiresOn"],
    ["expirationDate", "utcDateTime", "expiresOn"],
    ["ExpireOn", "utcDateTime", "ExpiresOn"],
    ["expireOn", "utcDateTime", "expiresOn"],
    ["ExpirationDateTime", "utcDateTime", "ExpiresOn"],
    ["expirationDateTime", "utcDateTime", "expiresOn"],
    ["modelExpirationDate", "utcDateTime", "modelExpiresOn"],
    ["AccountExpirationDate", "utcDateTime", "AccountExpiresOn"],
    ["accountExpirationDate", "utcDateTime", "accountExpiresOn"],
    ["AccountCreationDate", "utcDateTime", "AccountCreatedOn"],
    ["AccessTierChangeTime", "utcDateTime", "AccessTierChangedOn"],
    ["accessTierChangeTime", "utcDateTime", "accessTierChangedOn"],
    ["RecreationTime", "utcDateTime", "RecreationOn"],
    ["recreationTime", "utcDateTime", "recreationOn"],
    ["TotalTime", "utcDateTime", "TotalTime"],
    ["totalTime", "utcDateTime", "totalTime"],
    ["TopicTimestamp", "utcDateTime", "TopicTimestamp"],
    ["topicTimestamp", "utcDateTime", "topicTimestamp"],
    ["TokenExpirationDate", "utcDateTime", "TokenExpirationDate"],
    ["tokenExpirationDate", "utcDateTime", "tokenExpirationDate"],
    ["FromageTime", "utcDateTime", "FromageTime"],
    ["fromageTime", "utcDateTime", "fromageTime"],
    ["StatusTimestamp", "utcDateTime", "StatusTimestamp"],
    ["statusTimestamp", "utcDateTime", "statusTimestamp"],
    ["StatusTimeStamp", "utcDateTime", "StatusTimeStamp"],
    ["statusTimeStamp", "utcDateTime", "statusTimeStamp"],
    ["LastSyncTimestamp", "utcDateTime", "LastSyncOn"],
    ["lastSyncTimestamp", "utcDateTime", "lastSyncOn"],
    ["stateTransitionTime", "utcDateTime", "stateTransitionOn"],
    ["notBefore", "utcDateTime", "notBefore"],
  ])("normalizes %s (%s) to %s", (name, kind, expected) => {
    const type = types[kind];
    expect(isDateTimeInputType(type) ? normalizeDateTimeSuffix(name) : name).toBe(expected);
  });
});

describe("isDateTimeInputType", () => {
  it.each([
    ["utcDateTime", utcDateTime, true],
    ["plainDate", plainDate, true],
    ["string", stringType, false],
    ["nullable utcDateTime", { kind: "nullable", type: utcDateTime } as InputType, true],
    ["nullable string", { kind: "nullable", type: stringType } as InputType, false],
    ["undefined", undefined, false],
  ])("returns %s -> %s", (_, type, expected) => {
    expect(isDateTimeInputType(type as InputType | undefined)).toBe(expected);
  });
});

describe("normalizeName", () => {
  it.each(["model", "enum"])("normalizes acronyms in %s names", (kind) => {
    expect(normalize({ kind, name: "ipAddress" })).toMatchObject({
      name: "IPAddress",
      originalName: "ipAddress",
    });
  });

  it("does not apply the date-time convention to type names", () => {
    expect(normalize({ kind: "model", name: "startTime" })).toMatchObject({ name: "startTime" });
  });

  it("normalizes the trailing url suffix on enum values", () => {
    expect(normalize({ kind: "enumvalue", name: "callbackUrl" })).toMatchObject({
      name: "CallbackUri",
      originalName: "callbackUrl",
    });
  });

  it("normalizes the date-time suffix and acronyms of a property in a single pass", () => {
    expect(normalize({ kind: "property", name: "ipStartTime", type: utcDateTime })).toMatchObject({
      name: "IPStartsOn",
      originalName: "ipStartTime",
    });
  });

  it("normalizes acronyms of a non date-time property", () => {
    expect(normalize({ kind: "property", name: "ipAddress", type: stringType })).toMatchObject({
      name: "IPAddress",
      originalName: "ipAddress",
    });
  });

  it("leaves the spec name untouched when no rule applies", () => {
    expect(normalize({ kind: "property", name: "address", type: stringType })).toMatchObject({
      name: "address",
      originalName: "address",
    });
  });

  it("does not normalize exact names", () => {
    expect(
      normalize({ kind: "property", name: "ipAddress", type: stringType, isExactName: true }),
    ).toMatchObject({ name: "ipAddress", originalName: "ipAddress" });
  });

  it.each(["body", "header", "method", "path", "query"])(
    "preserves the casing of %s parameters",
    (kind) => {
      expect(normalize({ kind, name: "startTime", type: utcDateTime })).toMatchObject({
        name: "startsOn",
        originalName: "startTime",
      });
    },
  );

  it("does not apply identifier casing to parameter names that do not normalize", () => {
    expect(normalize({ kind: "query", name: "start_time", type: utcDateTime })).toMatchObject({
      name: "start_time",
      originalName: "start_time",
    });
  });

  it("does not apply the date-time convention to non date-time parameters", () => {
    expect(normalize({ kind: "query", name: "startTime", type: stringType })).toMatchObject({
      name: "startTime",
      originalName: "startTime",
    });
  });

  it("does not apply acronym normalization to parameters", () => {
    expect(normalize({ kind: "query", name: "ipAddress", type: stringType })).toMatchObject({
      name: "ipAddress",
      originalName: "ipAddress",
    });
  });

  it.each(["basic", "lro", "lropaging", "paging"])(
    "normalizes the url suffix of %s service methods",
    (kind) => {
      expect(normalize({ kind, name: "getUrl" })).toMatchObject({
        name: "GetUri",
        originalName: "getUrl",
      });
    },
  );

  it("normalizes operations, which carry no kind of their own", () => {
    expect(normalize({ name: "getUrl" })).toMatchObject({
      name: "GetUri",
      originalName: "getUrl",
    });
  });

  it("ignores unknown kinds", () => {
    expect(normalize({ kind: "union", name: "ipAddress" })).toMatchObject({ name: "ipAddress" });
  });

  it("ignores empty names", () => {
    expect(normalize({ kind: "model", name: "" })).toMatchObject({ name: "" });
  });

  it("logs the kind, original name and normalized name when a name changes", () => {
    debugMessages.length = 0;
    normalize({ kind: "property", name: "ipAddress", type: stringType });
    expect(debugMessages).toEqual(["Normalized property name 'ipAddress' to 'IPAddress' for C#."]);
  });

  it("does not log when the name is unchanged", () => {
    debugMessages.length = 0;
    normalize({ kind: "property", name: "address", type: stringType });
    expect(debugMessages).toEqual([]);
  });
});
