const API_BASE = import.meta.env.VITE_API_BASE || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Request failed");
  }

  return response.json();
}

export function fetchMeta() {
  return request("/meta");
}

export function fetchProducts(city) {
  return request(`/products?city=${encodeURIComponent(city)}`);
}

export function fetchEstimate(payload) {
  return request("/estimate", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
