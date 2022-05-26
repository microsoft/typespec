import React, { FunctionComponent, PropsWithChildren } from "react";
import _styled from "styled-components";
export const styled = typeof _styled === "function" ? _styled : (_styled as any).default;

export interface SectionProps {
  title: string;
  id?: string;
  hide?: boolean;
}

const SectionDiv = styled.div`
  border: 1px solid #c5c5c5;
`;
const SectionTitle = styled.div`
  border-bottom: 1px solid #c5c5c5;
  background-color: #4875ca;
  color: #f5f5f5;
  padding: 2px 5px;
`;
const SectionContent = styled.div`
  padding: 1rem;
`;
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
    <SectionDiv id={id}>
      <SectionTitle>{title}</SectionTitle>
      <SectionContent>{children}</SectionContent>
    </SectionDiv>
  );
};

const ItemDiv = styled.div`
  border: 1px solid #c5c5c5;
`;
const ItemTitle = styled.div`
  border-bottom: 1px solid #c5c5c5;
  background-color: #dedede;
  padding: 2px 5px;
`;
const ItemContent = styled.div`
  padding: 1rem;
`;
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
    <ItemDiv id={id}>
      <ItemTitle>{title}</ItemTitle>
      <ItemContent>{children}</ItemContent>
    </ItemDiv>
  );
};

export const Literal = styled.div`
  color: #5da713;
  display: inline;
`;
