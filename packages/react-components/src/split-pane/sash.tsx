import { mergeClasses } from "@fluentui/react-components";
import { useState, type ReactNode } from "react";
import style from "./split-pane.module.css";

export interface DraggingEvent {
  readonly originalEvent: MouseEvent | TouchEvent;
  readonly pageX: number;
  readonly pageY: number;
}
export interface SashProps {
  className?: string;
  style: React.CSSProperties;
  render: (dragging: boolean) => ReactNode;
  onReset: () => void;
  onDragStart: (evt: DraggingEvent) => void;
  onDragging: (evt: DraggingEvent) => void;
  onDragEnd: (evt: DraggingEvent) => void;
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

  const handleMouseMove = (e: MouseEvent) => onDragging(createDraggingEventFromMouseEvent(e));

  const handleMouseUp = (e: MouseEvent) => {
    setDrag(false);
    onDragEnd(createDraggingEventFromMouseEvent(e));
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  const handleTouchMove = (e: TouchEvent) => onDragging(createDraggingEventFromTouchEvent(e));
  const handleTouchUp = (e: TouchEvent) => {
    setDrag(false);
    onDragEnd(createDraggingEventFromTouchEvent(e));
    window.removeEventListener("touchmove", handleTouchMove);
    window.removeEventListener("touchend", handleTouchUp);
  };

  return (
    <div
      role="separator"
      className={mergeClasses(style["sash"], className)}
      onMouseDown={(e) => {
        setDrag(true);
        onDragStart(createDraggingEventFromMouseEvent(e as any));

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
      }}
      onTouchStart={(e) => {
        setDrag(true);
        onDragStart(createDraggingEventFromTouchEvent(e as any));

        window.addEventListener("touchmove", handleTouchMove);
        window.addEventListener("touchend", handleTouchUp);
      }}
      onDoubleClick={onReset}
      {...others}
    >
      {render(draging)}
    </div>
  );
};

function createDraggingEventFromMouseEvent(originalEvent: MouseEvent): DraggingEvent {
  return {
    originalEvent,
    pageX: originalEvent.pageX,
    pageY: originalEvent.pageY,
  };
}
function createDraggingEventFromTouchEvent(originalEvent: TouchEvent): DraggingEvent {
  const lastTouch = originalEvent.touches[originalEvent.touches.length - 1];
  return {
    originalEvent,
    pageX: lastTouch.clientX,
    pageY: lastTouch.clientY,
  };
}
