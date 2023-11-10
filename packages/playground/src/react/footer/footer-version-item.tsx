import {
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Select,
  SelectOnChangeData,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title3,
} from "@fluentui/react-components";
import { ChangeEvent, FunctionComponent, useCallback } from "react";
import { usePlaygroundContext } from "../context/playground-context.js";
import { FooterItem } from "./footer-item.js";

export interface VersionSelectorVersion {
  name: string;
  label: string;
}

export interface VersionSelectorProps {
  versions: VersionSelectorVersion[];

  /** Currently selected version , must match one of the version name. */
  selected: string;

  /** Latest released version, must match one of the version name. */
  latest?: string;

  /** Callback when a new version has been selected */
  onChange: (version: VersionSelectorVersion) => void;
}

export interface FooterVersionItemProps {
  /** Provide a way to change the version of packages in the playground */
  versionSelector?: VersionSelectorProps;
}

export const FooterVersionItem = ({ versionSelector }: FooterVersionItemProps) => {
  const { host } = usePlaygroundContext();
  return (
    <FooterItem>
      <Popover>
        <PopoverTrigger disableButtonEnhancement>
          <div>
            <span>TypeSpec Version </span>
            <span>{host.compiler.MANIFEST.version}</span>
          </div>
        </PopoverTrigger>

        <PopoverSurface>
          <VersionsPopup versionSelector={versionSelector} />
        </PopoverSurface>
      </Popover>
    </FooterItem>
  );
};

interface VersionsPopupProps {
  versionSelector?: VersionSelectorProps;
}

const VersionsPopup: FunctionComponent<VersionsPopupProps> = ({ versionSelector }) => {
  const { host } = usePlaygroundContext();

  return (
    <div style={{ maxWidth: "400px" }}>
      {versionSelector && <VersionSelector {...versionSelector} />}
      <div>
        <Title3>Loaded libraries</Title3>
        <Table size="small">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHeaderCell key={column.columnKey}>{column.label}</TableHeaderCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.values(host.libraries).map((item) => (
              <TableRow key={item.name}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.packageJson.version}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const columns = [
  { columnKey: "name", label: "Library" },
  { columnKey: "version", label: "Version" },
];

const VersionSelector = ({ versions, selected, latest, onChange }: VersionSelectorProps) => {
  const changeVersion = useCallback(
    (ev: ChangeEvent<HTMLSelectElement>, data: SelectOnChangeData) => {
      onChange(versions.find((x) => x.name === data.value)!);
    },
    [versions, onChange]
  );
  return (
    <div>
      <Title3>Select release</Title3>
      <Select value={selected} onChange={changeVersion}>
        {versions.map((version) => (
          <option key={version.name} value={version.name}>
            {version.label} {version.name === latest ? "(latest)" : ""}
          </option>
        ))}
      </Select>
    </div>
  );
};
