import { Children, ReactElement, ReactNode, isValidElement, useMemo } from "react";
import { WindowCarouselItemProps } from "./window-carousel";

export interface CarouselData {
  items: {
    value: string;
    label: string;
    content: ReactNode;
  }[];
}

export interface UseCarouselOptions {
  children: ReactNode;
}

export function useCarousel({ children }: UseCarouselOptions): CarouselData {
  const items = useMemo(() => {
    const result = sanitizeTabsChildren(children);
    return result.map((child) => {
      return {
        value: child.props.value,
        label: child.props.value,
        content: child.props.children,
      };
    });
  }, [children]);
  return { items };
}

function sanitizeTabsChildren(children: ReactNode) {
  return (Children.toArray(children)
    .filter((child) => child !== "\n")
    .map((child: any) => {
      if (!child || (isValidElement(child) && isCarouselItem(child))) {
        return child;
      }
      throw new Error(
        `Docusaurus error: Bad <WindowCarousel> child <${
          typeof child.type === "string" ? child.type : child.type.name
        }>: all children of the <WindowCarousel> component should be <WindowCarouselItem>, and every <WindowCarouselItem> should have a unique "value" prop.`,
      );
    })
    ?.filter(Boolean) ?? []) as ReactElement<WindowCarouselItemProps>[];
}

function isCarouselItem(
  comp: ReactElement<unknown>,
): comp is ReactElement<WindowCarouselItemProps> {
  const { props } = comp;
  return !!props && typeof props === "object" && "value" in props;
}
