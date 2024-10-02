import { Menu, MenuItemLink, MenuList, MenuPopover, MenuTrigger } from "@fluentui/react-components";
import { link } from "@site/src/utils";
import type { ReactNode } from "react";

export interface HeaderMenuProps {
  className?: string;
  children: ReactNode;
  links: { label: string; to: string }[];
}

export const HeaderMenu = ({ children, className, links }: HeaderMenuProps) => {
  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <a className={className}>{children}</a>
      </MenuTrigger>

      <MenuPopover>
        <MenuList>
          {links.map((item) => (
            // eslint-disable-next-line react-hooks/rules-of-hooks
            <MenuItemLink key={item.to} href={link(item.to)}>
              {item.label}
            </MenuItemLink>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};
