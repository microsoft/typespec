import { Spinner } from "@fluentui/react-components";
import style from "./loading-spinner.module.css";

export interface LoadingSpinnerProps {
  message?: string;
}
export const LoadingSpinner = ({ message }: LoadingSpinnerProps) => {
  return (
    <div className={style["container"]}>
      <Spinner />
      <div>{message}</div>
    </div>
  );
};
