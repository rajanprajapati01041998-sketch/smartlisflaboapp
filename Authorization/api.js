import axios from 'axios';

const URL = 'http://192.168.31.237:5021/api/';
// const URL = 'http://103.217.247.236/LabApp/api/'

const api = axios.create({
  baseURL: URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const API_BASE_URL = `${URL}`;

export default api;
