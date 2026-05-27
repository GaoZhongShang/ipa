import { mockApi } from "./mockData";

// ─── 开关：设为 true 使用本地 Mock 数据，false 使用真实 API ─────────────────
export const USE_MOCK = true;

// API 配置
const BASE_URL = 'http://121.40.174.122:3000/api';

// Token 管理
function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function clearToken(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function getUser(): { userId: number; name: string; phone: string } | null {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user: { userId: number; name: string; phone: string }): void {
  localStorage.setItem('user', JSON.stringify(user));
}

export function getSavedUser() {
  return getUser();
}

// 通用请求方法
async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `请求失败 (${response.status})`);
  }

  const result = await response.json();
  if (result.code !== 200) {
    throw new Error(result.message || '请求失败');
  }

  return result.data as T;
}

// ─── DTO 类型定义 ─────────────────────────────────────────────────────────

export interface JobListDTO {
  id: number;
  title: string;
  companyName: string;
  companyLogo: string | null;
  city: string;
  salary: string;
  educationRequirement: string;
  createTime: string;
  viewCount: number;
}

export interface JobDetailDTO {
  id: number;
  title: string;
  companyName: string;
  companyLogo: string | null;
  city: string;
  salary: string;
  educationRequirement: string;
  description: string;
  companyInfo: string;
  hrContact: string;
  createTime: string;
  viewCount: number;
  collected: boolean | null;
  delivered: boolean | null;
}

export interface LoginResponse {
  token: string;
  userId: number;
  name: string;
  phone: string;
}

export interface PageData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface Education {
  id: number;
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface WorkExperience {
  id: number;
  company: string;
  position: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface UserProfile {
  id: number;
  phone: string;
  name: string;
  avatar: string | null;
  expectedPosition: string;
  city: string;
  salaryExpectation: string;
  createTime: string;
  educations: Education[];
  works: WorkExperience[];
}

export interface DeliveryRecordDTO {
  id: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  companyLogo: string | null;
  city: string;
  salary: string;
  status: number; // 0=已查看, 1=邀请面试, 2=不合适
  createTime: string;
}

export interface CollectionDTO {
  id: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  companyLogo: string | null;
  city: string;
  salary: string;
  createTime: string;
}

// ─── Auth 接口 ────────────────────────────────────────────────────────────

export async function login(phone: string, password: string): Promise<LoginResponse> {
  if (USE_MOCK) return mockApi.login(phone, password);
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });
}

export async function register(phone: string, password: string, name: string): Promise<void> {
  if (USE_MOCK) return mockApi.register(phone, password, name);
  return request<void>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ phone, password, name }),
  });
}

// ─── Jobs 接口 ────────────────────────────────────────────────────────────

export async function getJobs(page = 0, size = 10): Promise<PageData<JobListDTO>> {
  if (USE_MOCK) return mockApi.getJobs(page, size);
  return request<PageData<JobListDTO>>(`/jobs?page=${page}&size=${size}`);
}

export async function searchJobs(
  params: { keyword?: string; city?: string; education?: string; page?: number; size?: number },
): Promise<PageData<JobListDTO>> {
  if (USE_MOCK) return mockApi.searchJobs(params);
  const query = new URLSearchParams();
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.city) query.set('city', params.city);
  if (params.education) query.set('education', params.education);
  query.set('page', String(params.page ?? 0));
  query.set('size', String(params.size ?? 10));
  return request<PageData<JobListDTO>>(`/jobs/search?${query.toString()}`);
}

export async function getJobDetail(id: number): Promise<JobDetailDTO> {
  if (USE_MOCK) return mockApi.getJobDetail(id);
  return request<JobDetailDTO>(`/jobs/${id}`);
}

export async function getHotJobs(): Promise<JobListDTO[]> {
  if (USE_MOCK) return mockApi.getHotJobs();
  return request<JobListDTO[]>('/jobs/hot');
}

// ─── User 接口 ────────────────────────────────────────────────────────────

export async function getUserProfile(): Promise<UserProfile> {
  if (USE_MOCK) return mockApi.getUserProfile();
  return request<UserProfile>('/user/profile');
}

export async function updateUserProfile(data: {
  name?: string;
  avatar?: string;
  expectedPosition?: string;
  city?: string;
  salaryExpectation?: string;
}): Promise<void> {
  if (USE_MOCK) return mockApi.updateUserProfile(data as Record<string, string>);
  return request<void>('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ─── Collections 接口 ─────────────────────────────────────────────────────

export async function addCollection(jobId: number): Promise<void> {
  if (USE_MOCK) return mockApi.addCollection(jobId);
  return request<void>(`/collections?jobId=${jobId}`, { method: 'POST' });
}

export async function removeCollection(jobId: number): Promise<void> {
  if (USE_MOCK) return mockApi.removeCollection(jobId);
  return request<void>(`/collections/${jobId}`, { method: 'DELETE' });
}

export async function getCollections(page = 0, size = 20): Promise<PageData<CollectionDTO>> {
  if (USE_MOCK) return mockApi.getCollections(page, size);
  return request<PageData<CollectionDTO>>(`/collections?page=${page}&size=${size}`);
}

// ─── Deliveries 接口 ──────────────────────────────────────────────────────

export async function deliverJob(jobId: number): Promise<void> {
  if (USE_MOCK) return mockApi.deliverJob(jobId);
  return request<void>(`/deliveries?jobId=${jobId}`, { method: 'POST' });
}

export async function getDeliveries(page = 0, size = 20): Promise<PageData<DeliveryRecordDTO>> {
  if (USE_MOCK) return mockApi.getDeliveries(page, size);
  return request<PageData<DeliveryRecordDTO>>(`/deliveries?page=${page}&size=${size}`);
}
