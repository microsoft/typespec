import React, { FunctionComponent, PropsWithChildren } from "react";

export const Group: FunctionComponent<PropsWithChildren<{}>> = ({ children }) => {
  return <div className="group">{children}</div>;
};

export interface SectionProps {
  title: string;
  id?: string;
  hide?: boolean;
}

export const Section: FunctionComponent<PropsWithChildren<SectionProps>> = ({
  id,
  title,
  hide,
  children,
}) => {
  if (hide) {
    return <div></div>;
  }
  return (
    <div className="section" id={id}>
      <div className="section-title">{title}</div>
      <div className="section-content">{children}</div>
    </div>
  );
};

export const Item: FunctionComponent<PropsWithChildren<SectionProps>> = ({
  id,
  title,
  hide,
  children,
}) => {
  if (hide) {
    return <div></div>;
  }
  return (
    <div className="item" id={id}>
      <div className="item-title">{title}</div>
      <div className="item-content">{children}</div>
    </div>
  );
};

export const Literal: FunctionComponent<PropsWithChildren<{}>> = ({ children }) => {
  return <div className="literal">{children}</div>;
};
