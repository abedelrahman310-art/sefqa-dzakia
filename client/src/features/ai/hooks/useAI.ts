import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api/ai';
import { toast } from 'sonner';
import type { AIInsightFilters } from '../types';

export const useInsights = (params: AIInsightFilters = {}) =>
  useQuery({
    queryKey: ['ai-insights', params],
    queryFn: () => aiApi.getInsights(params),
    refetchInterval: 60000, // كل دقيقة
  });

export const useGenerateInsights = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: aiApi.generateInsights,
    onSuccess: (data) => {
      toast.success(`تم توليد ${data.generated} توصية ذكية جديدة بنجاح`);
      qc.invalidateQueries({ queryKey: ['ai-insights'] });
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.detail || 'تعذر توليد التوصيات في الوقت الحالي'
      );
    },
  });
};

export const useResolveInsight = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      aiApi.resolveInsight(id, notes),
    onSuccess: () => {
      toast.success('تم توثيق المعالجة وتحديث سجل التدقيق بنجاح');
      qc.invalidateQueries({ queryKey: ['ai-insights'] });
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.resolution_notes?.[0] ||
          err.response?.data?.detail ||
          'تعذر حفظ معالجة التوصية'
      );
    },
  });
};

export const useSuspicions = () =>
  useQuery({
    queryKey: ['ai-suspicions'],
    queryFn: aiApi.getSuspicions,
    refetchInterval: 120000, // كل دقيقتين
  });

export const useChat = () =>
  useMutation({
    mutationFn: ({
      conversationId,
      message,
    }: {
      conversationId?: string | null;
      message: string;
    }) => aiApi.chat(conversationId, message),
  });

export const useAlerts = () =>
  useQuery({
    queryKey: ['ai-alerts'],
    queryFn: aiApi.getAlerts,
    refetchInterval: 60000,
  });

export const useAIHealth = () =>
  useQuery({
    queryKey: ['ai-health'],
    queryFn: aiApi.getHealth,
    staleTime: 300000, // 5 دقائق
  });
