import React, { FunctionComponent } from "react";

export const Group: FunctionComponent = ({ children }) => {
  return <div className="group">{children}</div>;
};

export interface SectionProps {
  title: string;
  id?: string;
  hide?: boolean;
}

export const Section: FunctionComponent<SectionProps> = ({ id, title, hide, children }) => {
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

export const Literal: FunctionComponent = ({ children }) => {
  return <div className="literal">{children}</div>;
};
