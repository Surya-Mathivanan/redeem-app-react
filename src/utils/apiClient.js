const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

function getToken() {
  return localStorage.getItem("token");
}

const handleApiResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "API request failed");
  }
  return response.json();
};

export const apiClient = {
  get: async (url) => {
    const response = await fetch(API_BASE_URL + url, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return handleApiResponse(response);
  },

  post: async (url, data) => {
    const response = await fetch(API_BASE_URL + url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  },
};
