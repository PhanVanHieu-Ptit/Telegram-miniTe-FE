import apiClient from './axios';

export async function fetchIceServers() {
  const response = await apiClient.get('/calls/get-ice-servers');
  return response.data;
}
