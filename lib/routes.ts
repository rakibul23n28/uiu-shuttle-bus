// [project]/lib/routes.ts
import axios from "axios";

export async function getRoutes() {
  const res = await axios.get("http://localhost:4000/api/routes");
  return res.data;
}
