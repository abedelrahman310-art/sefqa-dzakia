import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { FileQuestion, ArrowRight } from 'lucide-react';

interface PortalNotFoundProps {
  basePath: string;
  baseTitle: string;
}

export function PortalNotFound({ basePath, baseTitle }: PortalNotFoundProps) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto min-h-[350px] space-y-5 rounded-2xl border border-dashed border-border bg-card/50">
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
        <FileQuestion className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-destructive px-2.5 py-1 rounded-full bg-destructive/10">
          404 - غير موجود
        </span>
        <h2 className="text-xl font-bold text-navy-900">الصفحة غير موجودة ضمن هذه البوابة</h2>
        <p className="text-xs text-muted-foreground">
          المسار المطلوب غير معرّف أو لا يتبع لهذه المساحة:
        </p>
        <code className="inline-block px-3 py-1 rounded-lg bg-muted text-foreground text-xs font-mono border border-border" dir="ltr">
          {location}
        </code>
      </div>

      <div className="pt-2">
        <Link href={basePath}>
          <Button className="text-xs gap-2 rounded-xl">
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            <span>العودة إلى {baseTitle}</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
