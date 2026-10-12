import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../drizzle.js';
import { operatorProfiles, drafts, users, auditLogs } from '@safaqat/shared/schema';
import { isRecognizedWilayaCode, getWilayaDetails } from '@safaqat/shared/territorial';
import { eq, inArray, desc } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const operatorRouter = Router();

// 1. Get current operator profile
operatorRouter.get('/profile', requireAuth, requireRole('operator'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const db = getDb();

    const records = await db.select().from(operatorProfiles).where(eq(operatorProfiles.userId, user.id));
    const profile = records[0] || null;

    res.json({
      profile,
      territorialRegistryVersion: '2026-69W',
      wilayaDetails: profile ? getWilayaDetails(profile.wilayaCode) : null,
    });
  } catch (err) {
    console.error('Get operator profile error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Put (Create/Update) operator profile
const profileSchema = z.object({
  wilayaCode: z.string().refine(
    (code) => code !== 'national' && isRecognizedWilayaCode(code),
    { message: 'رمز الولاية غير صالح أو غير معتمد في السجل الإقليمي الوطني' }
  ),
  mainSector: z.enum([
    'construction_public_works',
    'hydraulics',
    'it_telecom',
    'supplies',
    'services',
    'studies_consulting',
  ]),
  declaredActivityCodes: z.array(z.string().min(2).max(20)).min(1, 'يجب إدخال رمز نشاط واحد على الأقل'),
  declaredQualificationLevel: z.string().regex(/^[1-9]$/, 'درجة التأهيل يجب أن تكون بين 1 و 9').optional().nullable(),
  declaredQualificationSector: z.string().max(100).optional().nullable(),
});

operatorRouter.put('/profile', requireAuth, requireRole('operator'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const db = getDb();

    const parseResult = profileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'بيانات غير صالحة',
        details: parseResult.error.errors,
      });
    }

    const data = parseResult.data;
    const existing = await db.select().from(operatorProfiles).where(eq(operatorProfiles.userId, user.id));
    const profileId = existing[0] ? existing[0].id : randomUUID();

    if (existing[0]) {
      await db.update(operatorProfiles).set({
        wilayaCode: data.wilayaCode,
        mainSector: data.mainSector,
        declaredActivityCodes: data.declaredActivityCodes,
        declaredQualificationLevel: data.declaredQualificationLevel || null,
        declaredQualificationSector: data.declaredQualificationSector || null,
        updatedAt: new Date(),
      }).where(eq(operatorProfiles.id, profileId));
    } else {
      await db.insert(operatorProfiles).values({
        id: profileId,
        userId: user.id,
        wilayaCode: data.wilayaCode,
        mainSector: data.mainSector,
        declaredActivityCodes: data.declaredActivityCodes,
        declaredQualificationLevel: data.declaredQualificationLevel || null,
        declaredQualificationSector: data.declaredQualificationSector || null,
      });
    }

    // Insert persistent audit log
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    await db.insert(auditLogs).values({
      id: randomUUID(),
      userId: user.id,
      action: 'OPERATOR_PROFILE_UPSERTED',
      entityType: 'operator_profile',
      entityId: profileId,
      metadata: {
        wilayaCode: data.wilayaCode,
        mainSector: data.mainSector,
        activityCodesCount: data.declaredActivityCodes.length,
        qualificationLevel: data.declaredQualificationLevel || null,
      },
      ipAddress: ip,
    });

    const updated = await db.select().from(operatorProfiles).where(eq(operatorProfiles.id, profileId));

    res.json({
      success: true,
      profile: updated[0],
      wilayaDetails: getWilayaDetails(updated[0].wilayaCode),
    });
  } catch (err) {
    console.error('Update operator profile error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Helper: Calculate criteria match between opportunity and profile
function calculateMatching(opp: any, profile: any) {
  const isClassified = !!(
    opp.sector ||
    opp.executionScope === 'national' ||
    opp.executionWilayaCode ||
    opp.minQualificationLevel ||
    (opp.activityCodesRequired && opp.activityCodesRequired.length > 0)
  );

  // 1. Sector
  let sectorStatus: 'matched' | 'mismatched' | 'unknown' = 'unknown';
  let sectorLabel = 'غير محدد بالفرصة';
  if (!opp.sector || !profile) {
    sectorStatus = 'unknown';
  } else if (opp.sector === profile.mainSector) {
    sectorStatus = 'matched';
    sectorLabel = 'تطابق تام مع القطاع الرئيسي المصرح به للمتعامل';
  } else {
    sectorStatus = 'mismatched';
    sectorLabel = 'اختلاف عن القطاع الرئيسي المصرح به للمتعامل';
  }

  // 2. Location
  let locationStatus: 'matched' | 'neutral_cross_wilaya' | 'unknown' = 'unknown';
  let locationReason = 'موقع التنفيذ غير محدد بدقة في ملخص الإعلان';
  if (opp.executionScope === 'national') {
    locationStatus = 'matched';
    locationReason = 'صفقة ذات بعد وطني مفتوحة للمتعاملين من كافة الولايات';
  } else if (!opp.executionWilayaCode || !profile) {
    locationStatus = 'unknown';
    locationReason = 'موقع التنفيذ غير محدد بدقة في ملخص الإعلان أو لم يحدد المتعامل مقر شركته';
  } else if (opp.executionWilayaCode === profile.wilayaCode) {
    locationStatus = 'matched';
    locationReason = `مقر المؤسسة في نفس ولاية موقع تنفيذ المشروع (${getWilayaDetails(opp.executionWilayaCode)?.nameAr || opp.executionWilayaCode})`;
  } else {
    locationStatus = 'neutral_cross_wilaya';
    locationReason = `موقع التنفيذ (${getWilayaDetails(opp.executionWilayaCode)?.nameAr || opp.executionWilayaCode}) خارج ولاية المقر؛ تقتضي دراسة الأعباء اللوجستية دون أن يشكل مانعاً نظامياً ما لم ينص الدفتر على حصر إقليمي`;
  }

  // 3. Qualification Level
  let qualificationStatus: 'matched' | 'mismatched' | 'unknown' = 'unknown';
  let qualificationNote = 'لم يُشترط حد أدنى لدرجة التأهيل في ملخص الإعلان';
  if (!opp.minQualificationLevel) {
    qualificationStatus = 'unknown';
    qualificationNote = 'لم يُشترط حد أدنى لدرجة التأهيل في ملخص الإعلان';
  } else if (!profile?.declaredQualificationLevel) {
    qualificationStatus = 'unknown';
    qualificationNote = 'لم يُصرّح المتعامل بدرجة تأهيل مهنية في ملفه';
  } else {
    const reqLevel = parseInt(opp.minQualificationLevel, 10);
    const decLevel = parseInt(profile.declaredQualificationLevel, 10);
    if (decLevel >= reqLevel) {
      qualificationStatus = 'matched';
      qualificationNote = `الدرجة المصرح بها (${decLevel}) تلبي أو تفوق الحد الأدنى المشترط بالدفتر (${reqLevel}) [تصريح ذاتي]`;
    } else {
      qualificationStatus = 'mismatched';
      qualificationNote = `الدرجة المصرح بها (${decLevel}) أقل من الحد الأدنى المشترط بالدفتر (${reqLevel}) [تتطلب دراسة تجمع مؤقت]`;
    }
  }

  // 4. Activity Codes (Intersection >= 1 rule)
  let activityStatus: 'matched' | 'mismatched' | 'unknown' = 'unknown';
  let matchedCodes: string[] = [];
  let activityNote = 'رموز النشاط غير محددة بالإعلان أو غير مصرح بها من المتعامل';

  if (!opp.activityCodesRequired || opp.activityCodesRequired.length === 0 || !profile?.declaredActivityCodes || profile.declaredActivityCodes.length === 0) {
    activityStatus = 'unknown';
  } else {
    matchedCodes = opp.activityCodesRequired.filter((c: string) => profile.declaredActivityCodes.includes(c));
    if (matchedCodes.length > 0) {
      activityStatus = 'matched';
      activityNote = `تقاطع ${matchedCodes.length} رمز نشاط مصرح به مع المطلوب (${matchedCodes.join(', ')})`;
    } else {
      activityStatus = 'mismatched';
      activityNote = 'لا يوجد أي تقاطع بين رموز النشاط المطلوبة ورموز النشاط المصرح بها من المتعامل';
    }
  }

  // Overall Signal
  let overallSignal: 'relevant' | 'partial' | 'neutral' | 'unclassified' = 'neutral';
  if (!isClassified) {
    overallSignal = 'unclassified';
  } else if (sectorStatus === 'matched' && (locationStatus === 'matched' || locationStatus === 'neutral_cross_wilaya')) {
    overallSignal = 'relevant';
  } else if (sectorStatus === 'matched' || activityStatus === 'matched') {
    overallSignal = 'partial';
  }

  return {
    isClassified,
    overallSignal,
    criteria: {
      sector: {
        status: sectorStatus,
        required: opp.sector || null,
        declared: profile?.mainSector || null,
        note: sectorLabel,
      },
      location: {
        status: locationStatus,
        executionScope: opp.executionScope,
        executionWilayaCode: opp.executionWilayaCode || null,
        operatorWilayaCode: profile?.wilayaCode || null,
        note: locationReason,
      },
      qualification: {
        status: qualificationStatus,
        required: opp.minQualificationLevel || null,
        declared: profile?.declaredQualificationLevel || null,
        note: qualificationNote,
      },
      activity: {
        status: activityStatus,
        required: opp.activityCodesRequired || [],
        declared: profile?.declaredActivityCodes || [],
        matchedCodes,
        note: activityNote,
      },
    },
  };
}

// 3. Get matched opportunities for current operator
operatorRouter.get('/opportunities/matched', requireAuth, requireRole('operator'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const db = getDb();

    // Fetch operator profile
    const profiles = await db.select().from(operatorProfiles).where(eq(operatorProfiles.userId, user.id));
    const profile = profiles[0] || null;

    // Allowed visible statuses for opportunities (includes submission_closed for transparency)
    const visibleStatuses = [
      'published',
      'submission_closed',
      'opening_in_progress',
      'opened_pv_signed',
      'technical_evaluation',
      'financial_evaluation',
      'provisional_award',
      'infructuous',
    ];

    const opps = await db
      .select({
        id: drafts.id,
        title: drafts.title,
        description: drafts.description,
        estimatedBudget: drafts.estimatedBudget,
        status: drafts.status,
        submissionDeadline: drafts.submissionDeadline,
        sector: drafts.sector,
        executionScope: drafts.executionScope,
        executionWilayaCode: drafts.executionWilayaCode,
        minQualificationLevel: drafts.minQualificationLevel,
        activityCodesRequired: drafts.activityCodesRequired,
        updatedAt: drafts.updatedAt,
        authorityName: users.organizationName,
        hasDocument: drafts.documentPath,
      })
      .from(drafts)
      .innerJoin(users, eq(drafts.authorityId, users.id))
      .where(inArray(drafts.status, visibleStatuses as any))
      .orderBy(desc(drafts.updatedAt));

    const matchedOpportunities = opps.map((opp) => {
      const matching = calculateMatching(opp, profile);
      return {
        id: opp.id,
        title: opp.title,
        description: opp.description,
        status: opp.status,
        submissionDeadline: opp.submissionDeadline,
        estimatedBudget: opp.estimatedBudget,
        authorityName: opp.authorityName,
        hasDocument: !!opp.hasDocument,
        matching,
      };
    });

    res.json({
      operatorProfileConfigured: !!profile,
      opportunities: matchedOpportunities,
    });
  } catch (err) {
    console.error('List matched opportunities error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Get detailed suitability breakdown for a specific opportunity
operatorRouter.get('/opportunities/:id/suitability', requireAuth, requireRole('operator'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const db = getDb();

    // Fetch opportunity
    const opp = await db
      .select({
        id: drafts.id,
        title: drafts.title,
        description: drafts.description,
        status: drafts.status,
        submissionDeadline: drafts.submissionDeadline,
        sector: drafts.sector,
        executionScope: drafts.executionScope,
        executionWilayaCode: drafts.executionWilayaCode,
        minQualificationLevel: drafts.minQualificationLevel,
        activityCodesRequired: drafts.activityCodesRequired,
        updatedAt: drafts.updatedAt,
        authorityName: users.organizationName,
        hasDocument: drafts.documentPath,
      })
      .from(drafts)
      .innerJoin(users, eq(drafts.authorityId, users.id))
      .where(eq(drafts.id, id));

    if (!opp || opp.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    const currentOpp = opp[0];
    const hiddenStatuses = ['draft', 'canceled'];
    if (hiddenStatuses.includes(currentOpp.status)) {
      return res.status(404).json({ error: 'Opportunity not available' });
    }

    // Fetch operator profile
    const profiles = await db.select().from(operatorProfiles).where(eq(operatorProfiles.userId, user.id));
    const profile = profiles[0] || null;

    const matching = calculateMatching(currentOpp, profile);

    const reasons: string[] = [];
    if (matching.criteria.sector.status === 'matched') {
      reasons.push('تطابق القطاع مع القطاع الرئيسي المصرح به للمتعامل.');
    }
    if (matching.criteria.location.status === 'matched') {
      reasons.push(matching.criteria.location.note);
    }
    if (matching.criteria.activity.status === 'matched') {
      reasons.push(matching.criteria.activity.note);
    }
    if (reasons.length === 0) {
      reasons.push(matching.isClassified ? 'الفرصة مصنفة بنودها، ولا يظهر تطابق مباشر في النشاط مع ملفك.' : 'صفقة سابقة منشورة غير مصنفة آلياً — يرجى مراجعة نص الإعلان ودفتر الشروط مباشرة.');
    }

    const verificationAlerts = [
      'كافة معطيات ملف المتعامل في هذه المرحلة هي مصرح بها ذاتياً ولم تُدقق بعد بوثائق رسمية مسندة.',
      'ملاءمة الفرصة مؤشر تنظيمي للبحث والمطابقة ولا تمثل إقراراً بالأهلية القانونية أو الفنية التي تفصل فيها لجنة تقييم العروض وحدها.',
    ];

    if (currentOpp.status === 'submission_closed') {
      verificationAlerts.unshift('تنبيه: انقضى أجل إيداع العروض لهذه الصفقة؛ البيانات معروضة لغرض الاطلاع والأرشفة فقط ويُحظر تقديم عروض جديدة.');
    }

    res.json({
      opportunity: {
        id: currentOpp.id,
        title: currentOpp.title,
        status: currentOpp.status,
        submissionDeadline: currentOpp.submissionDeadline,
        authorityName: currentOpp.authorityName,
        hasDocument: !!currentOpp.hasDocument,
      },
      operatorProfileConfigured: !!profile,
      suitability: {
        isClassified: matching.isClassified,
        overallSignal: matching.overallSignal,
        criteria: matching.criteria,
        reasons,
        verificationAlerts,
        disclaimer: 'الملاءمة المعروضة مؤشر أولي ولا تمثل بأي حال إقراراً بالأهلية القانونية أو الفنية التي تفصل فيها المصلحة المتعاقدة ولجنة تقييم العروض بموجب دفتر الشروط وأحكام المرسوم 15-247 والقانون 23-12.',
      },
    });
  } catch (err) {
    console.error('Get opportunity suitability error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
