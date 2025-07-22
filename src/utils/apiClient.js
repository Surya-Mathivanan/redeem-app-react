const handleApiResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "API request failed");
  }
  return response.json();
};

export const apiClient = {
  get: async (url) => {
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });
    return handleApiResponse(response);
  },

  post: async (url, data) => {
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  },
};
