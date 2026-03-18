export async function parseErrorMessage(resp: Response): Promise<string> {
  try {
    const data = await resp.json();

    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.message === "string") return data.message;

    return JSON.stringify(data);
  } catch {
    return `Request failed: ${resp.status}`;
  }
}