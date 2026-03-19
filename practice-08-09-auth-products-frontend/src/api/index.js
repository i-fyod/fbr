import { http } from "./http";

export const api = {
  register: async (payload) => {
    const r = await http.post("/api/auth/register", payload);
    return r.data;
  },
  login: async (payload) => {
    const r = await http.post("/api/auth/login", payload);
    return r.data;
  },
  me: async () => {
    const r = await http.get("/api/auth/me");
    return r.data;
  },

  listProducts: async () => {
    const r = await http.get("/api/products");
    return r.data;
  },
  createProduct: async (payload) => {
    const r = await http.post("/api/products", payload);
    return r.data;
  },
  getProductById: async (id) => {
    const r = await http.get(`/api/products/${id}`);
    return r.data;
  },
  updateProduct: async (id, payload) => {
    const r = await http.put(`/api/products/${id}`, payload);
    return r.data;
  },
  deleteProduct: async (id) => {
    await http.delete(`/api/products/${id}`);
  },
};
