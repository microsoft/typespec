import { Caption1, Text } from "@fluentui/react-components";
import { FunctionComponent, ReactElement } from "react";
import style from "./info-table.module.css";

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
    <tr className={style["row"]}>
      <td>
        <label>
          <Text block weight="semibold">
            {label}
          </Text>

          <Caption1 block>{caption}</Caption1>
        </label>
      </td>
      <td className={style["value-cell"]}>
        <Text title={valueTitle}>{value}</Text>
      </td>
    </tr>
  );
};
