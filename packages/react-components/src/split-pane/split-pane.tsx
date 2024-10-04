import { mergeClasses } from "@fluentui/react-components";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type FunctionComponent,
  type JSX,
  type MouseEvent,
} from "react";
import { useControllableValue } from "../hooks.js";
import { Pane, type PaneProps } from "./pane.js";
import { SashContent } from "./sash-content.js";
import { Sash } from "./sash.js";
import style from "./split-pane.module.css";
import { useElDimensions } from "./use-el-dimensions.js";

export interface SplitPaneProps {
  children: JSX.Element[];
  allowResize?: boolean;
  split?: "vertical" | "horizontal";
  initialSizes?: (string | number | undefined)[];
  sizes?: (string | number | undefined)[];
  sashRender?: (index: number, active: boolean) => React.ReactNode;
  onChange?: (sizes: number[]) => void;
  onDragStart?: (e: MouseEvent) => void;
  onDragEnd?: (e: MouseEvent) => void;
  className?: string;
  sashClassName?: string;
  performanceMode?: boolean;
  resizerSize?: number;
}

interface Axis {
  x: number;
  y: number;
}

interface CacheSizes {
  sizes: (string | number)[];
  sashPosSizes: (string | number)[];
}

export const SplitPane: FunctionComponent<SplitPaneProps> = ({
  children,
  sizes: propSizes,
  initialSizes: defaultSizes,
  allowResize = true,
  split = "vertical",
  className: wrapClassName,
  sashRender = (_, active) => <SashContent dragging={active} />,
  resizerSize = 4,
  performanceMode = false,
  onChange = () => null,
  onDragStart = () => null,
  onDragEnd = () => null,
  ...others
}: SplitPaneProps) => {
  const [resolvedPropSize, updateSizes] = useControllableValue<(string | number | undefined)[]>(
    propSizes,
    defaultSizes,
    onChange as any,
  );
  const axis = useRef<Axis>({ x: 0, y: 0 });
  const wrapper = useRef<HTMLDivElement>(null);
  const cacheSizes = useRef<CacheSizes>({ sizes: [], sashPosSizes: [] });
  const [isDragging, setDragging] = useState<boolean>(false);

  const wrapperRect = useElDimensions(wrapper);

  const { sizeName, splitPos, splitAxis } = useMemo(
    () =>
      ({
        sizeName: split === "vertical" ? "width" : "height",
        splitPos: split === "vertical" ? "left" : "top",
        splitAxis: split === "vertical" ? "x" : "y",
      }) as const,
    [split],
  );

  const wrapSize: number = wrapperRect[sizeName] ?? 0;

  // Get limit sizes via children
  const paneLimitSizes = useMemo(
    () =>
      children.map((childNode) => {
        const limits = [0, Infinity];
        if (childNode?.type === Pane) {
          const { minSize, maxSize } = childNode.props as PaneProps;
          limits[0] = assertsSize(minSize, wrapSize, 0);
          limits[1] = assertsSize(maxSize, wrapSize);
        }
        return limits;
      }),
    [children, wrapSize],
  );

  const sizes = useMemo(
    function () {
      let count = 0;
      let curSum = 0;
      const res = children.map((_, index) => {
        const size = assertsSize(resolvedPropSize[index], wrapSize);
        size === Infinity ? count++ : (curSum += size);
        return size;
      });

      // resize or illegal size input,recalculate pane sizes
      if (curSum > wrapSize || (!count && curSum < wrapSize)) {
        const cacheNum = (curSum - wrapSize) / curSum;
        return res.map((size) => {
          return size === Infinity ? 0 : size - size * cacheNum;
        });
      }

      if (count > 0) {
        const average = (wrapSize - curSum) / count;
        return res.map((size) => {
          return size === Infinity ? average : size;
        });
      }

      return res;
    },
    [children, resolvedPropSize, wrapSize],
  );

  const sashPosSizes = useMemo(
    () => sizes.reduce((a, b) => [...a, a[a.length - 1] + b], [0]),
    [sizes],
  );

  const dragStart = useCallback(
    (e: any) => {
      document?.body?.classList?.add(style["split-disabled"]);
      axis.current = { x: e.pageX, y: e.pageY };
      cacheSizes.current = { sizes, sashPosSizes };
      setDragging(true);
      onDragStart(e);
    },
    [onDragStart, sizes, sashPosSizes],
  );

  const resetPosition = useCallback(() => {
    if (defaultSizes) {
      updateSizes(defaultSizes);
    }
  }, [defaultSizes, updateSizes]);

  const dragEnd = useCallback(
    (e: any) => {
      document?.body?.classList?.remove(style["split-disabled"]);
      axis.current = { x: e.pageX, y: e.pageY };
      cacheSizes.current = { sizes, sashPosSizes };
      setDragging(false);
      onDragEnd(e);
    },
    [onDragEnd, sizes, sashPosSizes],
  );

  const onDragging = useCallback(
    (e: MouseEvent<HTMLDivElement>, i: number) => {
      const curAxis = { x: e.pageX, y: e.pageY };
      let distanceX = curAxis[splitAxis] - axis.current[splitAxis];

      const leftBorder = -Math.min(
        sizes[i] - paneLimitSizes[i][0],
        paneLimitSizes[i + 1][1] - sizes[i + 1],
      );
      const rightBorder = Math.min(
        sizes[i + 1] - paneLimitSizes[i + 1][0],
        paneLimitSizes[i][1] - sizes[i],
      );

      if (distanceX < leftBorder) {
        distanceX = leftBorder;
      }
      if (distanceX > rightBorder) {
        distanceX = rightBorder;
      }

      const nextSizes = [...sizes];
      nextSizes[i] += distanceX;
      nextSizes[i + 1] -= distanceX;

      updateSizes(nextSizes);
    },
    [splitAxis, sizes, paneLimitSizes, updateSizes],
  );

  const paneFollow = !(performanceMode && isDragging);
  const paneSizes = paneFollow ? sizes : cacheSizes.current.sizes;
  const panePoses = paneFollow ? sashPosSizes : cacheSizes.current.sashPosSizes;

  return (
    <div
      className={mergeClasses(
        style["split-pane"],
        split === "vertical" && style["split-pane-vertical"],
        split === "horizontal" && style["split-pane-horizontal"],
        isDragging && style["split-pane-dragging"],
        wrapClassName,
      )}
      ref={wrapper}
      {...others}
    >
      {children.map((childNode, childIndex) => {
        const isPane = childNode.type === Pane;
        const paneProps = isPane ? childNode.props : {};

        return (
          <Pane
            key={childIndex}
            className={mergeClasses(style["pane"], paneProps.className)}
            style={{
              ...paneProps.style,
              [sizeName]: paneSizes[childIndex],
              [splitPos]: panePoses[childIndex],
            }}
          >
            {isPane ? paneProps.children : childNode}
          </Pane>
        );
      })}
      {sashPosSizes.slice(1, -1).map((posSize, index) => (
        <Sash
          key={index}
          className={mergeClasses(
            !allowResize && style["sash-disabled"],
            split === "vertical" ? style["sash-vertical"] : style["sash-horizontal"],
          )}
          style={{
            [sizeName]: resizerSize,
            [splitPos]: posSize - resizerSize / 2,
          }}
          render={sashRender.bind(null, index)}
          onReset={resetPosition}
          onDragStart={dragStart}
          onDragging={(e) => onDragging(e, index)}
          onDragEnd={dragEnd}
        />
      ))}
    </div>
  );
};

/**
 * Convert size to absolute number or Infinity
 * SplitPane allows sizes in string and number, but the state sizes only support number,
 * so convert string and number to number in here
 * 'auto' -> divide the remaining space equally
 * 'xxx px' -> xxx
 * 'xxx%' -> wrapper.size * xxx/100
 *  xxx -> xxx
 */
function assertsSize(size: string | number | undefined, sum: number, defaultValue = Infinity) {
  if (typeof size === "undefined") return defaultValue;
  if (typeof size === "number") return size;
  if (size.endsWith("%")) return sum * (+size.replace("%", "") / 100);
  if (size.endsWith("px")) return +size.replace("px", "");
  return defaultValue;
}
