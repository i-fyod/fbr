import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
    accept: "application/json",
  },
});

export const api = {
  getProducts: async () => {
    const response = await apiClient.get("/products");
    return response.data;
  },

  createProduct: async (product) => {
    const response = await apiClient.post("/products", product);
    return response.data;
  },

  updateProduct: async (id, patch) => {
    const response = await apiClient.patch(`/products/${id}`, patch);
    return response.data;
  },

  deleteProduct: async (id) => {
    await apiClient.delete(`/products/${id}`);
  },
};
