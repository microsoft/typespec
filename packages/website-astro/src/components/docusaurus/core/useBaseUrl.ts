/* eslint-disable unicorn/filename-case */
export default function useBaseUrl(input: string | undefined) {
  return import.meta.env.BASE_URL + input;
}
