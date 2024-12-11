import { Caption1, Text } from "@fluentui/react-components";
import { FunctionComponent, ReactElement } from "react";

export const InfoReport = ({ children }: { children: ReactElement<InfoEntryProps>[] }) => {
  return (
    <table>
      <tbody>{children}</tbody>
    </table>
  );
};
export type InfoEntryProps = {
  readonly label: string;
  readonly caption: string;
  readonly value: string | any;
  readonly valueTitle?: string;
};

export const InfoEntry: FunctionComponent<InfoEntryProps> = ({
  label,
  caption,
  value,
  valueTitle,
}) => {
  return (
    <tr css={{ margin: "10px 0" }}>
      <td>
        <label>
          <Text block weight="semibold">
            {label}
          </Text>

          <Caption1 block>{caption}</Caption1>
        </label>
      </td>
      <td css={{ paddingLeft: 20, textAlign: "right" }}>
        <Text title={valueTitle}>{value}</Text>
      </td>
    </tr>
  );
};
