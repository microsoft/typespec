import { describe, expect, it } from "vitest";
import {
  isDateTimeInputType,
  normalizeAcronyms,
  normalizeDateTimeSuffix,
  normalizeParameterName,
  normalizePropertyName,
  normalizeUrlSuffix,
  toIdentifierName,
} from "../../src/lib/csharp-name-normalization.js";
import type { InputType } from "../../src/type/input-type.js";

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

describe("normalizePropertyName", () => {
  it("normalizes the date-time suffix and acronyms in a single pass", () => {
    const property = { name: "ipStartTime", type: utcDateTime };
    normalizePropertyName(property);
    expect(property).toMatchObject({ name: "IPStartsOn", originalName: "ipStartTime" });
  });

  it("records the original name when only acronyms are normalized", () => {
    const property = { name: "ipAddress", type: stringType };
    normalizePropertyName(property);
    expect(property).toMatchObject({ name: "IPAddress", originalName: "ipAddress" });
  });

  it("leaves the spec name untouched when no rule applies", () => {
    const property: { name: string; type: InputType; originalName?: string } = {
      name: "address",
      type: stringType,
    };
    normalizePropertyName(property);
    expect(property.name).toBe("address");
    expect(property.originalName).toBeUndefined();
  });

  it("does not normalize exact names", () => {
    const property: { name: string; type: InputType; isExactName: boolean; originalName?: string } =
      { name: "ipAddress", type: stringType, isExactName: true };
    normalizePropertyName(property);
    expect(property.name).toBe("ipAddress");
    expect(property.originalName).toBeUndefined();
  });
});

describe("normalizeParameterName", () => {
  it("preserves camel casing", () => {
    const parameter = { name: "startTime", type: utcDateTime };
    normalizeParameterName(parameter);
    expect(parameter).toMatchObject({ name: "startsOn", originalName: "startTime" });
  });

  it("does not apply identifier casing to names that do not normalize", () => {
    const parameter: { name: string; type: InputType; originalName?: string } = {
      name: "start_time",
      type: utcDateTime,
    };
    normalizeParameterName(parameter);
    expect(parameter.name).toBe("start_time");
    expect(parameter.originalName).toBeUndefined();
  });

  it("ignores non date-time parameters", () => {
    const parameter: { name: string; type: InputType; originalName?: string } = {
      name: "startTime",
      type: stringType,
    };
    normalizeParameterName(parameter);
    expect(parameter.name).toBe("startTime");
    expect(parameter.originalName).toBeUndefined();
  });
});
