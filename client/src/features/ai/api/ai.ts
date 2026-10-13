import { api } from '@/lib/api';
import type {
  AIInsight,
  AIInsightFilters,
  GenerateInsightsResponse,
  SuspicionsResponse,
  SmartAlertsResponse,
  AIHealthResponse,
  ChatResponse,
  PriceEstimateRequest,
  PriceEstimateResponse,
} from '../types';

export const priceEstimate = (payload: PriceEstimateRequest): Promise<PriceEstimateResponse> =>
  api.post<PriceEstimateResponse>('/ai/price-estimate/', payload).then((r) => r.data);

export const aiApi = {
  // Insights
  getInsights: (params?: AIInsightFilters): Promise<AIInsight[]> =>
    api.get('/ai/central/insights/', { params }).then((r) => r.data),

  generateInsights: (): Promise<GenerateInsightsResponse> =>
    api.post('/ai/central/insights/generate/').then((r) => r.data),

  resolveInsight: (id: string, notes: string): Promise<AIInsight> =>
    api
      .post(`/ai/central/insights/${id}/resolve/`, { resolution_notes: notes })
      .then((r) => r.data),

  // Suspicions
  getSuspicions: (): Promise<SuspicionsResponse> =>
    api.get('/ai/central/suspicions/').then((r) => r.data),

  // Chat Assistant
  chat: (conversationId: string | null | undefined, message: string): Promise<ChatResponse> =>
    api
      .post('/ai/central/chat/', {
        conversation_id: conversationId || undefined,
        message,
      })
      .then((r) => r.data),

  // KPI Alerts
  getAlerts: (): Promise<SmartAlertsResponse> =>
    api.get('/ai/central/alerts/').then((r) => r.data),

  // AI Health Check
  getHealth: (): Promise<AIHealthResponse> =>
    api.get('/ai/health/').then((r) => r.data),

  // Price Estimate (المساعد الذكي لتقدير الميزانية)
  priceEstimate,
};

