export const api = async (path, options = {}) => {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('hv_token')
      : null;

  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (!res.ok) throw data;
  return data;
};