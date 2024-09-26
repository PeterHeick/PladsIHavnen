import { API_URL } from "@/config";
import axios from "axios";

const URL = `${API_URL}/`

class SystemService {
  async getServerVersion(): Promise<string> {
    const response = await axios.get(`${URL}version`)
    return response.data.version;
    }
}
export default new SystemService();