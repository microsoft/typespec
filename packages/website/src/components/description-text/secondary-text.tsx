import { makeStyles, mergeClasses, tokens } from "@fluentui/react-components";

const useFluentStyles = makeStyles({
  descriptionText: { color: tokens.colorNeutralForeground3 },
});

export interface DescriptionTextProps {
  children: React.ReactNode;
  className?: string;
}
export const DescriptionText = ({ children, className }: DescriptionTextProps) => {
  const fluentStyles = useFluentStyles();
  return <div className={mergeClasses(fluentStyles.descriptionText, className)}> {children}</div>;
};
