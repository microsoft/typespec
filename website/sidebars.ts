import type { StarlightUserConfig } from "@astrojs/starlight/types";
import { readdir, stat } from "fs/promises";
import { join, parse, resolve } from "path/posix";
import current from "./src/content/current-sidebar";

export type StarlightSidebarUserConfig = StarlightUserConfig["sidebar"];

export interface AutoGenerateItem {
  label?: string;
  autogenerate: { directory: string; order?: "asc" | "desc" };
  index?: string;
  expanded?: boolean;
}

export interface CategoryItem {
  label: string;
  index?: string;
  items: SidebarItem[];
  expanded?: boolean;
}

export interface SlugItem {
  label?: string;
  slug: string;
}

export type SidebarItem = string | CategoryItem | SlugItem | AutoGenerateItem;

export async function resolveSideBars(): Promise<NonNullable<StarlightSidebarUserConfig>> {
  return processSidebar("docs", current);
}

async function processSidebar(
  directory: string,
  items: SidebarItem[],
): Promise<NonNullable<StarlightSidebarUserConfig>> {
  function prefix(name: string) {
    if (name === "") {
      return directory;
    }
    return `${directory}/${name}`;
  }

  function getSlugFromPath(directory: string, path: string) {
    const name = parse(path).name.toLocaleLowerCase();
    const normalizedName = name === "index" ? "" : name;
    return prefix(join(directory, normalizedName)).replaceAll("$", "");
  }

  const base = resolve(import.meta.dirname, "src/content/docs", directory);

  async function autogenerate(
    directory: string,
    order?: "asc" | "desc",
  ): Promise<NonNullable<StarlightSidebarUserConfig>> {
    const items = await readdir(resolve(base, directory));
    const result: NonNullable<StarlightSidebarUserConfig> = [];

    for (const item of items) {
      if (await isDirectory(resolve(base, directory, item))) {
        result.push({
          label: humanize(item),
          items: await autogenerate(join(directory, item), order),
        });
      } else {
        const parsed = parse(item);
        if (parsed.ext === ".mdx" || parsed.ext === ".md") {
          result.push(getSlugFromPath(directory, item));
        }
      }
    }

    if (order === "desc") {
      result.reverse();
    }
    return result;
  }

  function moveIndexFirst(
    items: NonNullable<StarlightSidebarUserConfig>,
    index: string | undefined,
  ): NonNullable<StarlightSidebarUserConfig> {
    if (index === undefined) {
      return items;
    }
    const indexSlug = prefix(index);
    const itemIndex = items.findIndex((x) =>
      typeof x === "string" ? x === indexSlug : (x as any).slug === indexSlug,
    );
    if (itemIndex === -1) {
      return items;
    }
    return [items[itemIndex], ...items.slice(0, itemIndex), ...items.slice(itemIndex + 1)];
  }

  const result: NonNullable<StarlightSidebarUserConfig> = [];
  for (const item of items) {
    if (typeof item === "string") {
      result.push(prefix(item));
    } else if ("items" in item) {
      const { index, ...rest } = item;
      result.push({
        ...rest,
        collapsed: !item.expanded,
        items: moveIndexFirst(await processSidebar(directory, item.items), index),
      });
    } else if ("autogenerate" in item) {
      const items = await autogenerate(item.autogenerate.directory, item.autogenerate.order);
      if (item.label) {
        result.push({
          label: item.label,
          items: moveIndexFirst(items, item.index),
          collapsed: !item.expanded,
        });
      } else {
        items.forEach((x) =>
          result.push(typeof x === "string" ? x : { ...x, collapsed: !item.expanded }),
        );
      }
    } else if ("slug" in item) {
      result.push({ ...item, slug: prefix(item.slug) });
    } else {
      result.push(item);
    }
  }

  return result;
}

function humanize(str: string) {
  return str
    .replace(/^[\s_]+|[\s_]+$/g, "")
    .replace(/[(\-_\s]+/g, " ")
    .replace(/^[a-z]/, function (m) {
      return m.toUpperCase();
    });
}
async function isDirectory(path: string) {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch (e: any) {
    if (e.code === "ENOENT" || e.code === "ENOTDIR") {
      return false;
    }
    throw e;
  }
}
