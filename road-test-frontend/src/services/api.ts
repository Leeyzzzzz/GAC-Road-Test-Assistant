
import axios from 'axios';
import type { Project, Worksheet, Category, TestCase, TestCaseCreate, TestCaseUpdate } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
});

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export const projectApi = {
  getProjects: () => api.get<ApiResponse<Project[]>>('/api/hierarchy/projects'),
};

export const worksheetApi = {
  getWorksheets: (projectId: number) => 
    api.get<ApiResponse<Worksheet[]>>(`/api/hierarchy/projects/${projectId}/worksheets`),
};

export const categoryApi = {
  getCategories: (projectId: number, worksheetId: number) => 
    api.get<ApiResponse<Category[]>>(`/api/hierarchy/projects/${projectId}/worksheets/${worksheetId}/categories`),
};

export const testCaseApi = {
  getTestCases: (params?: { plan_id?: number; category_id?: number }) => 
    api.get<ApiResponse<TestCase[]>>('/api/testcases', { params }),
  getTestCase: (caseId: number) => 
    api.get<ApiResponse<TestCase>>(`/api/testcases/${caseId}`),
  createTestCase: (data: TestCaseCreate) => 
    api.post<ApiResponse<TestCase>>('/api/testcases', data),
  updateTestCase: (caseId: number, data: TestCaseUpdate) => 
    api.put<ApiResponse<TestCase>>(`/api/testcases/${caseId}`, data),
  deleteTestCase: (caseId: number) => 
    api.delete<ApiResponse<void>>(`/api/testcases/${caseId}`),
  batchDeleteTestCases: (ids: number[]) => 
    api.post<ApiResponse<{ id: number; success: boolean; error?: string }[]>>('/api/testcases/batch-delete', { ids }),
};

export default api;
