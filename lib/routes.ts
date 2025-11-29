// [project]/lib/routes.ts
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export async function getRoutes() {
  const res = await axios.get(`${BASE_URL}/api/routes`);
  return res.data;
}
