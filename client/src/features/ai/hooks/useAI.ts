import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api/ai';
import { toast } from 'sonner';
import type {
  AIInsightFilters,
  PriceEstimateRequest,
  PriceEstimateResponse,
} from '../types';

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

/**
 * Hook لتقدير الميزانية المرجعية تلقائياً مع Debounce وزر تحديث فوري
 */
export function usePriceEstimate(
  payload: PriceEstimateRequest | null,
  debounceMs: number = 800
) {
  const [debouncedPayload, setDebouncedPayload] = useState<PriceEstimateRequest | null>(payload);
  const [estimate, setEstimate] = useState<PriceEstimateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // Debounce effect
  useEffect(() => {
    if (!payload) {
      setEstimate(null);
      setError(null);
      setDebouncedPayload(null);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedPayload(payload);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [
    payload?.template_type,
    payload?.description,
    payload?.category,
    payload?.quantity,
    payload?.unit,
    payload?.wilaya,
    debounceMs,
  ]);

  // Fetch logic
  const fetchEstimate = useCallback((targetPayload: PriceEstimateRequest) => {
    if (!targetPayload.description && !targetPayload.category) {
      setEstimate(null);
      return () => {};
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    aiApi
      .priceEstimate(targetPayload)
      .then((data) => {
        if (cancelled) return;
        setEstimate(data);
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        const status = err?.response?.status;
        if (status === 404) {
          setError('no_match');
        } else if (status === 400) {
          setError('invalid_input');
        } else {
          setError('error');
        }
        setEstimate(null);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Effect to trigger fetch when debounced payload or manual trigger changes
  useEffect(() => {
    if (!debouncedPayload) return;
    const cancel = fetchEstimate(debouncedPayload);
    return cancel;
  }, [debouncedPayload, fetchEstimate, fetchTrigger]);

  // Manual immediate refetch (التحسين 4)
  const refetch = useCallback(() => {
    if (payload) {
      setDebouncedPayload(payload);
      setFetchTrigger((c) => c + 1);
    }
  }, [payload]);

  return { estimate, isLoading, error, refetch };
}

/**
 * Hook لجلب التوصيات الذكية لفرص الصفقات للمتعامل الاقتصادي
 */
export const useOperatorRecommendations = (limit: number = 10) =>
  useQuery({
    queryKey: ['ai-operator-recommendations', limit],
    queryFn: () => aiApi.operatorRecommendations(limit),
    refetchInterval: 120000, // كل دقيقتين
    staleTime: 60000,
  });


