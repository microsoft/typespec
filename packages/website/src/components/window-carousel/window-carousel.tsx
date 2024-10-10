import { Tab, TabList } from "@fluentui/react-components";
import { Window } from "@site/src/components/window/window";
import clsx from "clsx";
import { ReactNode, useCallback, useState } from "react";
import { useCarousel } from "./use-carousel";
import style from "./window-carousel.module.css";

export interface WindowCarouselProps {
  defaultValue?: string;
  children: ReactNode;
}

export const WindowCarousel = ({ defaultValue, children }: WindowCarouselProps) => {
  const { items } = useCarousel({ children });

  const [value, setValue] = useState(defaultValue ?? items[0].value);

  const handleTabChange = useCallback(
    (_, data) => {
      setValue(data.value);
    },
    [setValue],
  );
  return (
    <div>
      <div className={style["items"]}>
        {items.map((x) => {
          return (
            <WindowCarouselItemRender
              key={x.value}
              value={x.value}
              selected={value === x.value}
              onSelected={setValue}
            >
              {x.content}
            </WindowCarouselItemRender>
          );
        })}
      </div>
      <TabList selectedValue={value} onTabSelect={handleTabChange}>
        {items.map((x) => (
          <Tab key={x.value} value={x.value}>
            {x.label}
          </Tab>
        ))}
      </TabList>
    </div>
  );
};

export interface WindowCarouselItemRenderProps {
  value: string;
  selected: boolean;
  onSelected: (value: string) => void;
  children: ReactNode;
}

const WindowCarouselItemRender = ({
  value,
  onSelected,
  selected,
  children,
}: WindowCarouselItemRenderProps) => {
  const onClick = useCallback(() => {
    onSelected(value);
  }, [onSelected, value]);
  return (
    <Window className={clsx(style["item"], selected && style["item-selected"])} onClick={onClick}>
      {children}
    </Window>
  );
};

export interface WindowCarouselItemProps {
  value: string;
  children: ReactNode;
}

export const WindowCarouselItem = ({ children }: WindowCarouselItemProps) => {
  return <>{children}</>;
};
