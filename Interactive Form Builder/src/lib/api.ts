
const API_URL = "https://form-builder-two-lac.vercel.app//api";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error ?? "Une erreur est survenue.");
  }

  return body.data as T;
}

export const api = {
  listForms: () => request<any[]>("/forms"),

  getForm: (id: string) => request<any>(`/forms/${id}`),

  createForm: (form: unknown) =>
    request<any>("/forms", {
      method: "POST",
      body: JSON.stringify(form),
    }),

  updateForm: (id: string, form: unknown) =>
    request<any>(`/forms/${id}`, {
      method: "PATCH",
      body: JSON.stringify(form),
    }),

  deleteForm: (id: string) =>
    request<void>(`/forms/${id}`, {
      method: "DELETE",
    }),

  listSubmissions: (id: string) =>
    request<any[]>(`/forms/${id}/submissions`),

  submitAnswers: (id: string, payload: unknown) =>
    request<any>(`/forms/${id}/submissions`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
