import { apiClient } from '../../lib/axios';

export const getAuditLogs = async (): Promise<any[]> => {
  const response = await apiClient.get('/audit-logs');
  return response.data.data;
};
