import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Hook to manage a value that could be either controlled or uncontrolled, such as a checked state or
 * text box string.
 * @param controlledValue - The controlled value passed in the props. This value will always be used if provided,
 * and the internal state will be updated to reflect it.
 * @param defaultUncontrolledValue - Initial value for the internal state in the uncontrolled case.
 * @returns An array of the current value and an updater callback. Like `React.useState`, the updater
 * callback always has the same identity, and it can take either a new value, or a function which
 * is passed the previous value and returns the new value.
 * @see https://reactjs.org/docs/uncontrolled-components.html
 */
export function useControllableValue<TValue>(
  controlledValue: TValue | undefined,
  defaultUncontrolledValue: TValue | undefined,
  onChange?: (value: TValue) => void | undefined,
): readonly [TValue, (update: TValue) => void] {
  const [value, setValue] = useState<TValue | undefined>(defaultUncontrolledValue);
  const isControlled = useMemo(() => controlledValue !== undefined, []);
  const currentValue = isControlled ? controlledValue : value;

  // Duplicate the current value and onChange in refs so they're accessible from
  // setValueOrCallOnChange without creating a new callback every time
  const valueRef = useRef(currentValue);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    valueRef.current = currentValue;
    onChangeRef.current = onChange;
  });

  // To match the behavior of the setter returned by React.useState, this callback's identity
  // should never change. This means it MUST NOT directly reference variables that can change.
  const setValueOrCallOnChange = useMemo(
    () => (update: React.SetStateAction<TValue | undefined>) => {
      // Assuming here that TValue is not a function, because a controllable value will typically
      // be something a user can enter as input
      const newValue = typeof update === "function" ? (update as any)(valueRef.current) : update;

      if (onChangeRef.current) {
        onChangeRef.current(newValue);
      }

      if (!isControlled) {
        setValue(newValue);
      }
    },
    [],
  );

  return [currentValue, setValueOrCallOnChange] as any;
}
