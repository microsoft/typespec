import { SettingName } from "./types.js";

export const EmitterSettingName: Record<string, string> = {
  client: SettingName.ClientEmitter,
  server: SettingName.ServerEmitter,
  schema: SettingName.SchemaEmitter,
};

export const StartFileName = "main.tsp";
