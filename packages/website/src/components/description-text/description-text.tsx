import { makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import style from "./description-text.module.css";

const useFluentStyles = makeStyles({
  descriptionText: { color: tokens.colorNeutralForeground3 },
});

export interface DescriptionTextProps {
  children: React.ReactNode;
  className?: string;
}
export const DescriptionText = ({ children, className }: DescriptionTextProps) => {
  const fluentStyles = useFluentStyles();
  return (
    <div
      className={mergeClasses(fluentStyles.descriptionText, style["description-text"], className)}
    >
      {" "}
      {children}
    </div>
  );
};
