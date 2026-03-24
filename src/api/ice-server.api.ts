import apiClient from './axios';

export async function fetchIceServers() {
  const response = await apiClient.get('/get-ice-servers');
  return response.data;
}
