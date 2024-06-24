/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext } from 'react';

export const ExpandedPathsContext = createContext<[any, (...args: any[]) => any]>([{}, () => {}]);
