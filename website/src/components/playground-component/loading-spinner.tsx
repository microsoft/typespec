import style from "./loading-spinner.module.css";

export interface LoadingSpinnerProps {
  message?: string;
}
export const LoadingSpinner = ({ message }: LoadingSpinnerProps) => {
  return (
    <div className={style["container"]}>
      <div className={style["progress-bar"]}>
        <span className={style["spinner"]}>
          <span className={style["spinner-tail"]}></span>
        </span>
      </div>
      <div>{message}</div>
    </div>
  );
};
