import { createHash } from "crypto";
import { readFile, stat, writeFile } from "fs/promises";
import { jsonrepair } from "jsonrepair";
import { ZodType } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { logger } from "./log/logger.js";

export function tryParseConnectionString(cs: string) {
  const result: Record<string, string> = {};
  cs.split(";")
    .filter((s) => s.trim().length > 0)
    .forEach((part) => {
      const index = part.indexOf("=");
      if (index < 0) {
        logger.error(`Invalid connection string: ${cs}`);
        return undefined;
      }
      const key = part.substring(0, index).trim();
      const value = part.substring(index + 1).trim();
      if (!key || !value) {
        logger.error(`Invalid connection string: ${cs}`);
        return undefined;
      }
      result[key] = value;
    });
  return result;
}

export function tryRepairAndParseJson<T>(jsonStr: string | undefined): T | undefined {
  if (!jsonStr) {
    return undefined;
  }
  let cleaned = jsonStr.trim();

  // Remove triple backticks at the start and end
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(\w*\n)?/, "");
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/```$/, "");
  }

  try {
    cleaned = jsonrepair(cleaned);
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (e) {
    logger.error(`Error to repare and parsing JSON: ${e}`);
    return undefined;
  }
}

export function toJsonSchemaString(obj: ZodType) {
  return JSON.stringify(zodToJsonSchema(obj), undefined, 2);
}

export async function isFileExists(filePath: string): Promise<boolean> {
  try {
    const s = await stat(filePath);
    return s.isFile();
  } catch {
    return false;
  }
}

export async function tryReadJsonFile<T>(
  filePath: string,
  zType?: ZodType<T>,
): Promise<T | undefined> {
  const data = await tryReadFile(filePath);
  if (!data) {
    return undefined;
  }
  const parsed = tryRepairAndParseJson<T>(data);
  if (!parsed) {
    logger.debug(`Failed to parse JSON from file: ${filePath}`);
    return undefined;
  }
  if (!zType) {
    return parsed;
  }

  const safeParsed = zType.safeParse(parsed);
  if (!safeParsed.success) {
    logger.debug(`Failed to parse JSON from file: ${filePath}. Error: ${safeParsed.error}`);
    return undefined;
  }
  return safeParsed.data as T;
}

export async function tryReadFile(filePath: string): Promise<string | undefined> {
  try {
    const data = await readFile(filePath, "utf-8");
    return data;
  } catch (e) {
    logger.debug(`Failed to read file ${filePath}: ${e}`);
    return undefined;
  }
}

export async function tryWriteFile(filePath: string, content: string): Promise<boolean> {
  try {
    await writeFile(filePath, content, "utf-8");
    return true;
  } catch (e) {
    logger.error(`Failed to write file ${filePath}: ${e}`);
    return false;
  }
}

export function getRecordValue<T>(record: Record<string, T>, key: string): T | undefined {
  return record[key];
}

export function setRecordValue<T>(record: Record<string, T>, key: string, value: T): void {
  record[key] = value;
}

export function hasRecordKey<T>(record: Record<string, T>, key: string): boolean {
  return key in record;
}

export function foreachRecord<T>(
  record: Record<string, T>,
  callback: (key: string, value: T) => void,
): void {
  for (const key in record) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      callback(key, record[key]);
    }
  }
}

export function md5(str: string): string {
  return createHash("md5").update(str).digest("hex");
}
