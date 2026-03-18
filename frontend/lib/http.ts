import { parseErrorMessage } from "./errors";

type RequestOptions = RequestInit & {
  json?: unknown;
};

export async function http<T>(
  input: RequestInfo | URL,
  options: RequestOptions = {},
): Promise<T> {
  const { json, headers, ...rest } = options;

  const response = await fetch(input, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json() as Promise<T>;
}