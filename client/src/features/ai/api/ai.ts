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
  RecommendationsResponse,
  TenderAnalysisResponse,
} from '../types';

export const priceEstimate = (payload: PriceEstimateRequest): Promise<PriceEstimateResponse> =>
  api.post<PriceEstimateResponse>('/ai/price-estimate/', payload).then((r) => r.data);

export const operatorRecommendations = (limit = 10): Promise<RecommendationsResponse> =>
  api
    .get<RecommendationsResponse>(`/ai/operator/recommendations/?limit=${limit}`)
    .then((r) => r.data);

export const operatorLegalChat = (
  conversationId: string | null | undefined,
  message: string,
  language?: string,
): Promise<ChatResponse> =>
  api
    .post<ChatResponse>('/ai/legal-chat/', {
      conversation_id: conversationId || undefined,
      message,
      language,
    })
    .then((r) => r.data);

export const analyzeTender = (dealId: string): Promise<TenderAnalysisResponse> =>
  api
    .post<TenderAnalysisResponse>('/ai/analyze-tender/', { deal_id: dealId })
    .then((r) => r.data);

export const uploadAndAnalyzeTenderPdf = (file: File): Promise<TenderAnalysisResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  return api
    .post<TenderAnalysisResponse>('/ai/analyze-tender/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

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
  chat: (conversationId: string | null | undefined, message: string): Promise<ChatResponse> => {
    let role = 'central_admin';
    try {
      const stored = localStorage.getItem('safaqat_user');
      if (stored) {
        const u = JSON.parse(stored);
        role = u.role || role;
      }
    } catch {}
    const endpoint = role === 'central_admin' ? '/ai/central/chat/' : '/ai/legal-chat/';
    return api
      .post(endpoint, {
        conversation_id: conversationId || undefined,
        message,
      })
      .then((r) => r.data);
  },

  // KPI Alerts
  getAlerts: (): Promise<SmartAlertsResponse> =>
    api.get('/ai/central/alerts/').then((r) => r.data),

  // AI Health Check
  getHealth: (): Promise<AIHealthResponse> =>
    api.get('/ai/health/').then((r) => r.data),

  // Price Estimate (المساعد الذكي لتقدير الميزانية)
  priceEstimate,

  // Operator Matching Recommendations (التوصيات الذكية للفرص)
  operatorRecommendations,

  // Operator legal assistant & tender analysis
  operatorLegalChat,
  analyzeTender,
  uploadAndAnalyzeTenderPdf,
};

