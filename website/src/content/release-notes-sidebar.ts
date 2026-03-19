import type { SidebarItem } from "@typespec/astro-utils/sidebar";

const sidebar: SidebarItem[] = [
  {
    autogenerate: {
      order: "desc",
      directory: ".",
    },
  },
];

export default sidebar;
