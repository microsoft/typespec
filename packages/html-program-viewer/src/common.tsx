import React, { FunctionComponent } from "react";

export const Group: FunctionComponent = ({ children }) => {
  return <div className="group">{children}</div>;
};

export interface SectionProps {
  title: string;
  hide?: boolean;
}

export const Section: FunctionComponent<SectionProps> = ({ title, hide, children }) => {
  if (hide) {
    return <div></div>;
  }
  return (
    <div className="section">
      <div className="section-title">{title}</div>
      <div className="section-content">{children}</div>
    </div>
  );
};
