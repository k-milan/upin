import axios from "axios";

const http = axios.create({ baseURL: "/api", timeout: 15_000 });

export default http;
