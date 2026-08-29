import type { InputType } from "../type/input-type.js";

/**
 * C# name normalization rules.
 *
 * The generator consumes the names produced here verbatim (after its own identifier casing, which is
 * idempotent for already-normalized names). Whenever a name is changed by one of these rules the
 * converters record the original spec name in `originalName` so the generator can still restore a
 * previously shipped spelling for back-compatibility.
 */

const acronymRenamingRules: readonly (readonly [string, string])[] = [
  ["Ipv4", "IPv4"],
  ["Ipv6", "IPv6"],
  ["IpV4", "IPv4"],
  ["IpV6", "IPv6"],
  ["Ip", "IP"],
  ["Db", "DB"],
  ["Os", "OS"],
];

const identifierStartRegex = /[\p{L}\p{Nl}_]/u;
const identifierPartRegex = /[\p{L}\p{Nl}\p{Nd}\p{Mn}\p{Mc}\p{Pc}\p{Cf}]/u;

function isIdentifierStartCharacter(c: string): boolean {
  return identifierStartRegex.test(c);
}

function isIdentifierPartCharacter(c: string): boolean {
  return identifierPartRegex.test(c);
}

function isWordSeparator(c: string, preserveUnderscores: boolean): boolean {
  return !isIdentifierPartCharacter(c) || (!preserveUnderscores && c === "_");
}

function isUpper(c: string): boolean {
  return c !== c.toLowerCase() && c === c.toUpperCase();
}

function isLower(c: string): boolean {
  return c !== c.toUpperCase() && c === c.toLowerCase();
}

function isDigit(c: string): boolean {
  return c >= "0" && c <= "9";
}

/**
 * TypeScript port of the generator's `StringExtensions.ToIdentifierName`. Names are only replaced with
 * their identifier form when a normalization rule actually applies, so any divergence is limited to
 * names that contain one of the recognized patterns.
 */
export function toIdentifierName(
  name: string,
  useCamelCase: boolean = false,
  preserveUnderscores: boolean = false,
): string {
  if (!name) {
    return name;
  }

  let nameBuilder = "";
  let i = 0;

  if (isDigit(name[0])) {
    nameBuilder = "_";
  } else {
    while (i < name.length && !isIdentifierStartCharacter(name[i])) {
      i++;
    }
  }

  let upperCase = false;
  let firstWordLength = 1;
  for (; i < name.length; i++) {
    let c = name[i];
    if (isWordSeparator(c, preserveUnderscores)) {
      upperCase = true;
      continue;
    }

    if (nameBuilder.length === 0 && !useCamelCase) {
      c = c.toUpperCase();
      upperCase = false;
    } else if (nameBuilder.length < firstWordLength && useCamelCase) {
      c = c.toLowerCase();
      upperCase = false;
      // grow the first word length when this letter follows by two other upper case letters
      // this happens in OSProfile, where OS is the first word
      if (
        i + 2 < name.length &&
        isUpper(name[i + 1]) &&
        (isUpper(name[i + 2]) || isWordSeparator(name[i + 2], preserveUnderscores))
      ) {
        firstWordLength++;
      }
      // grow the first word length when this letter follows by another upper case letter and an end of the string
      // this happens when the string only has one word, like OS, DNS
      if (i + 2 === name.length && isUpper(name[i + 1])) {
        firstWordLength++;
      }
    }

    if (upperCase) {
      c = c.toUpperCase();
      upperCase = false;
    }

    nameBuilder += c;
  }

  return nameBuilder;
}

/**
 * Replaces well known acronyms with their idiomatic C# casing, e.g. `IpAddress` -> `IPAddress`.
 */
export function normalizeAcronyms(name: string): string {
  let normalizedName: string | undefined;
  let segmentStart = 0;
  for (let index = 0; index < name.length - 1; index++) {
    for (const [source, replacement] of acronymRenamingRules) {
      if (!name.startsWith(source, index)) {
        continue;
      }

      const boundaryIndex = index + source.length;
      if (boundaryIndex < name.length && !isUpper(name[boundaryIndex])) {
        continue;
      }

      normalizedName ??= "";
      normalizedName += name.substring(segmentStart, index) + replacement;
      segmentStart = boundaryIndex;
      index = boundaryIndex - 1;
      break;
    }
  }

  if (normalizedName === undefined) {
    return name;
  }

  return normalizedName + name.substring(segmentStart);
}

const AtSuffix = "At";
const DateSuffix = "Date";
const DateTimeSuffix = "DateTime";
const FirstName = "First";
const FromName = "From";
const LastName = "Last";
const LowercaseOnSuffix = "on";
const OnSuffix = "On";
const PointInTimeName = "PointInTime";
const StatusTimeStampName = "StatusTimeStamp";
const StatusTimestampName = "StatusTimestamp";
const TimeStampSuffix = "TimeStamp";
const TimeSuffix = "Time";
const TimestampSuffix = "Timestamp";
const ToName = "To";

// Complete prefixes that read better as verbs when combined with the "On" suffix. Keep the
// collection ordered so adding overlapping suffixes in the future cannot make compound matching
// depend on enumeration order.
const nounToVerbRules: readonly (readonly [string, string])[] = [
  ["Change", "Changed"],
  ["Creation", "Created"],
  ["Deletion", "Deleted"],
  ["End", "Ends"],
  ["Expiration", "Expires"],
  ["Expire", "Expires"],
  ["Modification", "Modified"],
  ["Start", "Starts"],
];

function equalsIgnoreCase(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function endsWithIgnoreCase(name: string, suffix: string): boolean {
  return name.length >= suffix.length && equalsIgnoreCase(name.slice(name.length - suffix.length), suffix);
}

function startsWithIgnoreCase(name: string, prefix: string): boolean {
  return name.length >= prefix.length && equalsIgnoreCase(name.slice(0, prefix.length), prefix);
}

function toVerbForm(prefix: string): string {
  // Resolve all exact rules before considering compound suffixes so an overlapping rule added
  // later cannot be preempted by an earlier compound match.
  for (const [noun, verb] of nounToVerbRules) {
    if (equalsIgnoreCase(prefix, noun)) {
      return isLower(prefix[0]) ? verb[0].toLowerCase() + verb.substring(1) : verb;
    }
  }

  for (const [noun, compoundVerb] of nounToVerbRules) {
    if (
      prefix.length > noun.length &&
      endsWithIgnoreCase(prefix, noun) &&
      isUpper(prefix[prefix.length - noun.length])
    ) {
      return prefix.substring(0, prefix.length - noun.length) + compoundVerb;
    }
  }

  return prefix;
}

function hasExcludedComponent(name: string, suffixLength: number): boolean {
  // StatusTimestamp is a semantic compound. Keep the exclusion exact so names such as
  // LastSyncTimestamp continue to normalize.
  const prefix = name.substring(0, name.length - suffixLength);
  return (
    equalsIgnoreCase(prefix, FirstName) ||
    equalsIgnoreCase(prefix, LastName) ||
    startsWithIgnoreCase(name, FromName) ||
    startsWithIgnoreCase(name, ToName) ||
    endsWithIgnoreCase(name, PointInTimeName) ||
    equalsIgnoreCase(name, StatusTimestampName) ||
    equalsIgnoreCase(name, StatusTimeStampName)
  );
}

function getSuffixLength(name: string): number {
  if (
    name.endsWith(TimestampSuffix) ||
    name.endsWith(TimeStampSuffix) ||
    equalsIgnoreCase(name, TimestampSuffix)
  ) {
    return TimestampSuffix.length;
  }

  if (name.length > DateTimeSuffix.length && name.endsWith(DateTimeSuffix)) {
    return DateTimeSuffix.length;
  }

  if (name.length > TimeSuffix.length && name.endsWith(TimeSuffix)) {
    return TimeSuffix.length;
  }

  if (equalsIgnoreCase(name, DateSuffix) || name.endsWith(DateSuffix)) {
    return DateSuffix.length;
  }

  if (name.length > OnSuffix.length && name.endsWith(OnSuffix)) {
    return OnSuffix.length;
  }

  return name.length > AtSuffix.length && name.endsWith(AtSuffix) ? AtSuffix.length : 0;
}

/**
 * Renames date-time members to the `<verb>On` convention, e.g. `CreationTime` -> `CreatedOn`.
 */
export function normalizeDateTimeSuffix(name: string): string {
  const suffixLength = getSuffixLength(name);
  if (
    suffixLength === 0 ||
    suffixLength === name.length ||
    hasExcludedComponent(name, suffixLength)
  ) {
    return name;
  }

  const prefix = toVerbForm(name.substring(0, name.length - suffixLength));
  const onSuffix = prefix.length === 0 && isLower(name[0]) ? LowercaseOnSuffix : OnSuffix;
  return prefix + onSuffix;
}

/**
 * Renames a trailing `Url` to `Uri` to match .NET conventions.
 */
export function normalizeUrlSuffix(name: string): string {
  return name.endsWith("Url") ? `${name.substring(0, name.length - 3)}Uri` : name;
}

/**
 * Determines whether the input type represents a date-time value.
 */
export function isDateTimeInputType(type: InputType | undefined): boolean {
  if (type === undefined) {
    return false;
  }
  switch (type.kind) {
    case "utcDateTime":
    case "offsetDateTime":
      return true;
    case "plainDate":
      return true;
    case "nullable":
      return isDateTimeInputType(type.type);
    default:
      return false;
  }
}

/** A named object that can carry the original spec name when its name was normalized. */
interface NormalizableName {
  name: string;
  originalName?: string;
  isExactName?: boolean;
}

function applyNormalization<T extends NormalizableName>(
  target: T,
  candidate: string,
  normalize: (name: string) => string,
): T {
  const normalized = normalize(candidate);
  if (normalized === candidate) {
    return target;
  }

  target.originalName = target.name;
  target.name = normalized;
  return target;
}

/**
 * Applies the given normalization to the C# identifier form of `target.name`, recording the original
 * spec name in `originalName` when the name changes. Names flagged as exact are left untouched.
 *
 * The name is only replaced when a rule applies, so names that do not match any rule keep their
 * original spec spelling and are cased by the generator as before.
 */
export function normalizeIdentifierName<T extends NormalizableName>(
  target: T,
  normalize: (identifierName: string) => string,
): T {
  if (target.isExactName || !target.name) {
    return target;
  }

  return applyNormalization(target, toIdentifierName(target.name), normalize);
}

/**
 * Applies the given normalization directly to `target.name` without any identifier casing. Used for
 * parameters, whose declared spelling is preserved by the generator.
 */
export function normalizeVerbatimName<T extends NormalizableName>(
  target: T,
  normalize: (name: string) => string,
): T {
  if (target.isExactName || !target.name) {
    return target;
  }

  return applyNormalization(target, target.name, normalize);
}

/** Normalizes a model or enum type name. */
export function normalizeTypeName<T extends NormalizableName>(target: T): T {
  return normalizeIdentifierName(target, normalizeAcronyms);
}

/** Normalizes a model property name, including the date-time naming convention. */
export function normalizePropertyName<T extends NormalizableName & { type?: InputType }>(
  target: T,
): T {
  const isDateTime = isDateTimeInputType(target.type);
  return normalizeIdentifierName(target, (name) =>
    normalizeAcronyms(isDateTime ? normalizeDateTimeSuffix(name) : name),
  );
}

/** Normalizes a parameter name, applying only the date-time naming convention. */
export function normalizeParameterName<T extends NormalizableName & { type?: InputType }>(
  target: T,
): T {
  if (!isDateTimeInputType(target.type)) {
    return target;
  }
  return normalizeVerbatimName(target, normalizeDateTimeSuffix);
}

/** Normalizes an operation or service method name. */
export function normalizeOperationName<T extends NormalizableName>(target: T): T {
  return normalizeIdentifierName(target, normalizeUrlSuffix);
}

/** Normalizes an enum value name. */
export function normalizeEnumValueName<T extends NormalizableName>(target: T): T {
  return normalizeIdentifierName(target, normalizeUrlSuffix);
}
