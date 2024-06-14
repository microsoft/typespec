import { mergeClasses } from "@fluentui/react-components";
import { useState, type ReactNode } from "react";
import style from "./split-pane.module.css";

export interface SashProps {
  className?: string;
  style: React.CSSProperties;
  render: (dragging: boolean) => ReactNode;
  onReset: () => void;
  onDragStart: React.MouseEventHandler<HTMLDivElement>;
  onDragging: React.MouseEventHandler<HTMLDivElement>;
  onDragEnd: React.MouseEventHandler<HTMLDivElement>;
}

export const Sash = ({
  className,
  render,
  onDragStart,
  onDragging,
  onDragEnd,
  onReset,
  ...others
}: SashProps) => {
  const [draging, setDrag] = useState(false);

  const handleMouseMove = (e: any) => {
    onDragging(e);
  };

  const handleMouseUp = (e: any) => {
    setDrag(false);
    onDragEnd(e);
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className={mergeClasses(style["sash"], className)}
      onMouseDown={(e) => {
        setDrag(true);
        onDragStart(e);

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
      }}
      onDoubleClick={onReset}
      {...others}
    >
      {render(draging)}
    </div>
  );
};
