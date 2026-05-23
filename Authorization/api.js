import axios from 'axios';

const api = axios.create({
  // baseURL: 'http://192.168.31.237:5021/api/', 
  baseURL: 'http://103.217.247.236/LabApp/api/', 
  // http://192.168.31.205:5021
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const API_BASE_URL = 'http://103.217.247.236/LabApp/api/';
// export const API_BASE_URL = 'http://192.168.31.237:5021/api/';

export default api;
