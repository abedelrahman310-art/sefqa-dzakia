import { mysqlTable, varchar, timestamp, boolean, mysqlEnum, unique, text, json, int, decimal, index, foreignKey } from 'drizzle-orm/mysql-core';
export const users = mysqlTable('users', {
    id: varchar('id', { length: 255 }).primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: mysqlEnum('role', ['operator', 'authority', 'central_admin']).notNull(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    organizationName: varchar('organization_name', { length: 255 }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});
export const sessions = mysqlTable('sessions', {
    id: varchar('id', { length: 255 }).primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const drafts = mysqlTable('drafts', {
    id: varchar('id', { length: 255 }).primaryKey(),
    authorityId: varchar('authority_id', { length: 255 })
        .notNull()
        .references(() => users.id),
    title: varchar('title', { length: 255 }).notNull(),
    description: varchar('description', { length: 2000 }).notNull(),
    estimatedBudget: varchar('estimated_budget', { length: 255 }),
    documentPath: varchar('document_path', { length: 500 }),
    status: mysqlEnum('status', [
        'draft',
        'published',
        'submission_closed',
        'opening_in_progress',
        'opened_pv_signed',
        'technical_evaluation',
        'financial_evaluation',
        'provisional_award',
        'infructuous',
        'canceled',
    ]).default('draft').notNull(),
    submissionDeadline: timestamp('submission_deadline'),
    openedAt: timestamp('opened_at'),
    sector: mysqlEnum('sector', [
        'construction_public_works',
        'hydraulics',
        'it_telecom',
        'supplies',
        'services',
        'studies_consulting',
    ]),
    executionScope: mysqlEnum('execution_scope', ['wilaya', 'national']).default('wilaya').notNull(),
    executionWilayaCode: varchar('execution_wilaya_code', { length: 10 }),
    minQualificationLevel: varchar('min_qualification_level', { length: 10 }),
    activityCodesRequired: json('activity_codes_required').$type(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});
export const offers = mysqlTable('offers', {
    id: varchar('id', { length: 255 }).primaryKey(),
    opportunityId: varchar('opportunity_id', { length: 255 })
        .notNull()
        .references(() => drafts.id),
    operatorId: varchar('operator_id', { length: 255 })
        .notNull()
        .references(() => users.id),
    technicalProposal: varchar('technical_proposal', { length: 3000 }).notNull(),
    financialOffer: varchar('financial_offer', { length: 255 }).notNull(),
    deliveryTimeDays: varchar('delivery_time_days', { length: 50 }),
    documentPath: varchar('document_path', { length: 500 }),
    status: mysqlEnum('status', ['draft', 'submitted']).default('draft').notNull(),
    submittedAt: timestamp('submitted_at'),
    evaluationStatus: mysqlEnum('evaluation_status', ['pending', 'admitted', 'rejected']).default('pending').notNull(),
    rejectionReason: varchar('rejection_reason', { length: 2000 }),
    technicalScore: varchar('technical_score', { length: 50 }),
    evaluatorNotes: varchar('evaluator_notes', { length: 3000 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    unqOperatorOpportunity: unique('unq_operator_opportunity').on(table.opportunityId, table.operatorId),
}));
export const dealCommittees = mysqlTable('deal_committees', {
    id: varchar('id', { length: 255 }).primaryKey(),
    draftId: varchar('draft_id', { length: 255 })
        .notNull()
        .references(() => drafts.id),
    userId: varchar('user_id', { length: 255 })
        .notNull()
        .references(() => users.id),
    role: mysqlEnum('committee_role', ['president', 'rapporteur', 'member']).notNull(),
    appointmentReference: varchar('appointment_reference', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const committeeSessions = mysqlTable('committee_sessions', {
    id: varchar('id', { length: 255 }).primaryKey(),
    draftId: varchar('draft_id', { length: 255 })
        .notNull()
        .references(() => drafts.id),
    sessionType: mysqlEnum('session_type', ['opening', 'technical_eval', 'financial_eval']).notNull(),
    scheduledAt: timestamp('scheduled_at'),
    convenedAt: timestamp('convened_at'),
    adjournedAt: timestamp('adjourned_at'),
    quorumReached: boolean('quorum_reached').default(false).notNull(),
    attendeesSnapshot: json('attendees_snapshot'),
    status: mysqlEnum('status', ['scheduled', 'in_progress', 'completed', 'canceled']).default('scheduled').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const dealMinutes = mysqlTable('deal_minutes', {
    id: varchar('id', { length: 255 }).primaryKey(),
    sessionId: varchar('session_id', { length: 255 })
        .notNull()
        .references(() => committeeSessions.id),
    draftId: varchar('draft_id', { length: 255 })
        .notNull()
        .references(() => drafts.id),
    pvNumber: varchar('pv_number', { length: 100 }).notNull().unique(),
    pvType: mysqlEnum('pv_type', ['opening_pv', 'evaluation_pv', 'infructuous_pv']).notNull(),
    contentDigest: varchar('content_digest', { length: 64 }).notNull(),
    bidsSummarySnapshot: json('bids_summary_snapshot').notNull(),
    observations: text('observations'),
    signedBySnapshot: json('signed_by_snapshot').notNull(),
    finalStatus: mysqlEnum('final_status', ['draft', 'signed', 'approved']).default('draft').notNull(),
    approvedAt: timestamp('approved_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const operatorProfiles = mysqlTable('operator_profiles', {
    id: varchar('id', { length: 255 }).primaryKey(),
    userId: varchar('user_id', { length: 255 })
        .notNull()
        .unique()
        .references(() => users.id, { onDelete: 'cascade' }),
    wilayaCode: varchar('wilaya_code', { length: 10 }).notNull(),
    mainSector: mysqlEnum('main_sector', [
        'construction_public_works',
        'hydraulics',
        'it_telecom',
        'supplies',
        'services',
        'studies_consulting',
    ]).notNull(),
    declaredActivityCodes: json('declared_activity_codes').$type().notNull(),
    declaredQualificationLevel: varchar('declared_qualification_level', { length: 10 }),
    declaredQualificationSector: varchar('declared_qualification_sector', { length: 100 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});
export const auditLogs = mysqlTable('audit_logs', {
    id: varchar('id', { length: 255 }).primaryKey(),
    userId: varchar('user_id', { length: 255 }),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: varchar('entity_id', { length: 255 }).notNull(),
    metadata: json('metadata'),
    ipAddress: varchar('ip_address', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// ==========================================
// مشروع «سند»: سلسلة إسناد دفاتر الشروط والمتطلبات
// ==========================================
export const legalCorpusNodes = mysqlTable('legal_corpus_nodes', {
    id: varchar('id', { length: 255 }).primaryKey(),
    textType: mysqlEnum('text_type', [
        'law',
        'presidential_decree',
        'executive_decree',
        'ministerial_order',
        'standard_cahier',
    ]).notNull(),
    referenceNumber: varchar('reference_number', { length: 50 }).notNull(),
    articleNumber: varchar('article_number', { length: 50 }).notNull(),
    subArticle: varchar('sub_article', { length: 50 }),
    titleAr: varchar('title_ar', { length: 500 }).notNull(),
    contentAr: text('content_ar').notNull(),
    officialJournalRef: varchar('official_journal_ref', { length: 100 }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const dealCahierVersions = mysqlTable('deal_cahier_versions', {
    id: varchar('id', { length: 255 }).primaryKey(),
    draftId: varchar('draft_id', { length: 255 })
        .notNull()
        .references(() => drafts.id, { onDelete: 'cascade' }),
    versionNumber: int('version_number').default(1).notNull(),
    templateVersionId: varchar('template_version_id', { length: 255 }),
    status: mysqlEnum('status', [
        'drafting',
        'under_review',
        'ready_for_approval',
        'frozen_published',
        'superseded',
    ]).default('drafting').notNull(),
    frozenDigest: varchar('frozen_digest', { length: 64 }),
    frozenAt: timestamp('frozen_at'),
    changeSummary: varchar('change_summary', { length: 1000 }),
    createdById: varchar('created_by_id', { length: 255 })
        .notNull()
        .references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    unqDraftVersion: unique('unq_draft_version').on(table.draftId, table.versionNumber),
}));
export const dealClauses = mysqlTable('deal_clauses', {
    id: varchar('id', { length: 255 }).primaryKey(),
    cahierVersionId: varchar('cahier_version_id', { length: 255 })
        .notNull()
        .references(() => dealCahierVersions.id, { onDelete: 'cascade' }),
    clauseCode: varchar('clause_code', { length: 50 }).notNull(),
    sectionKey: mysqlEnum('section_key', [
        'general_provisions',
        'administrative',
        'technical_specs',
        'financial_terms',
        'evaluation_criteria',
    ]).notNull(),
    sortOrder: int('sort_order').default(0).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    status: mysqlEnum('status', ['proposed', 'under_review', 'accepted', 'rejected']).default('proposed').notNull(),
    isMandatory: boolean('is_mandatory').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    unqVersionClauseCode: unique('unq_version_clause_code').on(table.cahierVersionId, table.clauseCode),
}));
export const clauseProvenanceRecords = mysqlTable('clause_provenance_records', {
    id: varchar('id', { length: 255 }).primaryKey(),
    clauseId: varchar('clause_id', { length: 255 })
        .notNull()
        .references(() => dealClauses.id, { onDelete: 'cascade' }),
    sourceType: mysqlEnum('source_type', [
        'authority_input',
        'template_clause',
        'legal_reference',
        'ai_prompt_suggestion',
    ]).notNull(),
    sourceNodeId: varchar('source_node_id', { length: 255 }),
    sourceLabel: varchar('source_label', { length: 255 }).notNull(),
    verificationStatus: mysqlEnum('verification_status', [
        'verified_statutory',
        'template_standard',
        'self_declared_authority',
        'ai_proposed_pending_human',
        'ai_accepted_by_human',
    ]).notNull(),
    verifiedById: varchar('verified_by_id', { length: 255 })
        .references(() => users.id),
    verifiedAt: timestamp('verified_at'),
    justificationNotes: text('justification_notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const clauseLifecycleEvents = mysqlTable('clause_lifecycle_events', {
    id: varchar('id', { length: 255 }).primaryKey(),
    clauseId: varchar('clause_id', { length: 255 })
        .notNull()
        .references(() => dealClauses.id, { onDelete: 'cascade' }),
    eventType: mysqlEnum('event_type', [
        'proposed',
        'content_modified',
        'accepted',
        'rejected',
        'flagged_stress',
        'justified_human',
    ]).notNull(),
    actorType: mysqlEnum('actor_type', [
        'authority_officer',
        'authority_expert',
        'central_reviewer',
        'ai_assistant',
    ]).notNull(),
    actorId: varchar('actor_id', { length: 255 }).notNull(),
    previousContent: text('previous_content'),
    proposedContent: text('proposed_content'),
    actionReason: text('action_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const clauseStressFindings = mysqlTable('clause_stress_findings', {
    id: varchar('id', { length: 255 }).primaryKey(),
    clauseId: varchar('clause_id', { length: 255 })
        .notNull()
        .references(() => dealClauses.id, { onDelete: 'cascade' }),
    findingCategory: mysqlEnum('finding_category', [
        'brand_naming',
        'restrictive_qualification',
        'unjustified_urgency',
        'excessive_financial_threshold',
        'territorial_restriction',
    ]).notNull(),
    severity: mysqlEnum('severity', [
        'advisory_notice',
        'warning',
        'critical_attention',
    ]).notNull(),
    detectedTerm: varchar('detected_term', { length: 255 }).notNull(),
    explanationAr: text('explanation_ar').notNull(),
    suggestedRemedy: text('suggested_remedy'),
    resolutionStatus: mysqlEnum('resolution_status', [
        'pending',
        'remedied_by_edit',
        'officially_justified',
        'ignored_by_authority',
    ]).default('pending').notNull(),
    humanJustification: text('human_justification'),
    resolvedById: varchar('resolved_by_id', { length: 255 })
        .references(() => users.id),
    resolvedAt: timestamp('resolved_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const dealRequirements = mysqlTable('deal_requirements', {
    id: varchar('id', { length: 255 }).primaryKey(),
    cahierVersionId: varchar('cahier_version_id', { length: 255 })
        .notNull()
        .references(() => dealCahierVersions.id, { onDelete: 'cascade' }),
    clauseId: varchar('clause_id', { length: 255 })
        .notNull()
        .references(() => dealClauses.id, { onDelete: 'cascade' }),
    requirementCode: varchar('requirement_code', { length: 50 }).notNull(),
    requirementType: mysqlEnum('requirement_type', [
        'mandatory_document',
        'qualification_level',
        'experience_reference',
        'financial_guarantee',
        'technical_capacity',
        'delivery_schedule',
    ]).notNull(),
    positionReference: varchar('position_reference', { length: 100 }).notNull(),
    description: text('description').notNull(),
    isDisqualifying: boolean('is_disqualifying').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const operatorRequirementResponses = mysqlTable('operator_requirement_responses', {
    id: varchar('id', { length: 255 }).primaryKey(),
    offerId: varchar('offer_id', { length: 255 })
        .notNull()
        .references(() => offers.id, { onDelete: 'cascade' }),
    requirementId: varchar('requirement_id', { length: 255 })
        .notNull()
        .references(() => dealRequirements.id, { onDelete: 'cascade' }),
    complianceClaim: mysqlEnum('compliance_claim', [
        'compliant',
        'partially_compliant',
        'non_compliant',
        'not_applicable',
    ]).notNull(),
    evidenceDocId: varchar('evidence_doc_id', { length: 255 }),
    evidenceLocation: varchar('evidence_location', { length: 100 }),
    verificationState: mysqlEnum('verification_state', [
        'unanswered',
        'self_declared_unverified',
        'verified_with_document',
        'contradictory',
    ]).default('unanswered').notNull(),
    operatorNotes: text('operator_notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    unqOfferRequirement: unique('unq_offer_requirement').on(table.offerId, table.requirementId),
}));
export const aiAnalyses = mysqlTable('ai_analyses', {
    id: varchar('id', { length: 255 }).primaryKey(),
    analysisType: mysqlEnum('analysis_type', ['risk', 'anomaly', 'budget', 'operator', 'document', 'assistant']).notNull(),
    entityType: mysqlEnum('entity_type', ['platform', 'deal', 'offer', 'operator', 'authority', 'budget_program', 'document', 'appeal']).notNull(),
    entityId: varchar('entity_id', { length: 255 }),
    status: mysqlEnum('status', ['pending', 'running', 'completed', 'failed', 'unavailable']).notNull(),
    severity: mysqlEnum('severity', ['informational', 'low', 'medium', 'high', 'critical']),
    confidence: decimal('confidence', { precision: 5, scale: 4 }),
    explanation: text('explanation').notNull(),
    summary: text('summary').notNull(),
    requiresHumanReview: boolean('requires_human_review').default(false).notNull(),
    provider: varchar('provider', { length: 100 }),
    model: varchar('model', { length: 150 }),
    contextSnapshot: json('context_snapshot').$type().notNull(),
    createdById: varchar('created_by_id', { length: 255 }).references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    entityIdx: index('ai_analyses_entity_idx').on(table.entityType, table.entityId),
    statusCreatedIdx: index('ai_analyses_status_created_idx').on(table.status, table.createdAt),
}));
export const aiAnalysisFactors = mysqlTable('ai_analysis_factors', {
    id: varchar('id', { length: 255 }).primaryKey(),
    analysisId: varchar('analysis_id', { length: 255 }).notNull().references(() => aiAnalyses.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 100 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    weight: decimal('weight', { precision: 9, scale: 6 }),
    value: decimal('value', { precision: 20, scale: 6 }),
    referenceValue: decimal('reference_value', { precision: 20, scale: 6 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    analysisCodeUnique: unique('ai_analysis_factor_code_unique').on(table.analysisId, table.code),
}));
export const aiAnalysisEvidence = mysqlTable('ai_analysis_evidence', {
    id: varchar('id', { length: 255 }).primaryKey(),
    analysisId: varchar('analysis_id', { length: 255 }).notNull().references(() => aiAnalyses.id, { onDelete: 'cascade' }),
    factorId: varchar('factor_id', { length: 255 }).references(() => aiAnalysisFactors.id, { onDelete: 'set null' }),
    sourceType: mysqlEnum('source_type', ['platform_record', 'document', 'legal_reference', 'business_rule', 'other']).notNull(),
    sourceEntityType: mysqlEnum('source_entity_type', ['deal', 'offer', 'document', 'audit_event', 'budget_record', 'operator_record', 'authority_record', 'legal_reference', 'business_rule', 'other']).notNull(),
    sourceId: varchar('source_id', { length: 255 }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    locator: varchar('locator', { length: 500 }),
    dataVersion: varchar('data_version', { length: 100 }),
    observedAt: timestamp('observed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    analysisIdx: index('ai_analysis_evidence_analysis_idx').on(table.analysisId),
    sourceIdx: index('ai_analysis_evidence_source_idx').on(table.sourceEntityType, table.sourceId),
}));
export const aiAlerts = mysqlTable('ai_alerts', {
    id: varchar('id', { length: 255 }).primaryKey(),
    type: varchar('type', { length: 100 }).notNull(),
    severity: mysqlEnum('severity', ['informational', 'low', 'medium', 'high', 'critical']).notNull(),
    entityType: mysqlEnum('entity_type', ['platform', 'deal', 'offer', 'operator', 'authority', 'budget_program', 'document', 'appeal']).notNull(),
    entityId: varchar('entity_id', { length: 255 }),
    audienceRole: mysqlEnum('audience_role', ['operator', 'authority', 'central_admin']).notNull(),
    scopeSnapshot: json('scope_snapshot').$type().notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    status: mysqlEnum('status', ['new', 'reviewing', 'resolved', 'dismissed']).default('new').notNull(),
    analysisId: varchar('analysis_id', { length: 255 }).references(() => aiAnalyses.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    acknowledgedAt: timestamp('acknowledged_at'),
    acknowledgedById: varchar('acknowledged_by_id', { length: 255 }),
    resolvedAt: timestamp('resolved_at'),
    resolvedById: varchar('resolved_by_id', { length: 255 }).references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
    statusCreatedIdx: index('ai_alerts_status_created_idx').on(table.status, table.createdAt),
    entityIdx: index('ai_alerts_entity_idx').on(table.entityType, table.entityId),
    acknowledgedByFk: foreignKey({
        columns: [table.acknowledgedById],
        foreignColumns: [users.id],
        name: 'ai_alerts_ack_by_user_fk',
    }).onDelete('set null'),
}));
export const aiAssistantSessions = mysqlTable('ai_assistant_sessions', {
    id: varchar('id', { length: 255 }).primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: mysqlEnum('role', ['operator', 'authority', 'central_admin']).notNull(),
    contextSnapshot: json('context_snapshot').$type().notNull(),
    title: varchar('title', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    userUpdatedIdx: index('ai_assistant_sessions_user_updated_idx').on(table.userId, table.updatedAt),
}));
export const aiAssistantMessages = mysqlTable('ai_assistant_messages', {
    id: varchar('id', { length: 255 }).primaryKey(),
    sessionId: varchar('session_id', { length: 255 }).notNull().references(() => aiAssistantSessions.id, { onDelete: 'cascade' }),
    role: mysqlEnum('role', ['user', 'assistant']).notNull(),
    message: text('message').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    sessionCreatedIdx: index('ai_assistant_messages_session_created_idx').on(table.sessionId, table.createdAt),
}));
export const programs = mysqlTable('programs', {
    id: varchar('id', { length: 255 }).primaryKey(),
    authorityId: varchar('authority_id', { length: 255 }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    authorityFk: foreignKey({
        columns: [table.authorityId],
        foreignColumns: [users.id],
        name: 'programs_authority_id_users_fk',
    }).onDelete('set null'),
}));
export const budgets = mysqlTable('budgets', {
    id: varchar('id', { length: 255 }).primaryKey(),
    programId: varchar('program_id', { length: 255 }).notNull().references(() => programs.id),
    fiscalYear: int('fiscal_year').notNull(),
    allocatedAmount: decimal('allocated_amount', { precision: 20, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    programYearUnique: unique('budget_program_year_unique').on(table.programId, table.fiscalYear),
}));
export const budgetTransactions = mysqlTable('budget_transactions', {
    id: varchar('id', { length: 255 }).primaryKey(),
    budgetId: varchar('budget_id', { length: 255 }).notNull().references(() => budgets.id),
    category: mysqlEnum('category', ['allocation', 'commitment', 'spending', 'adjustment']).notNull(),
    amount: decimal('amount', { precision: 20, scale: 2 }).notNull(),
    referenceType: varchar('reference_type', { length: 100 }),
    referenceId: varchar('reference_id', { length: 255 }),
    reference: varchar('reference', { length: 255 }),
    occurredAt: timestamp('occurred_at').notNull(),
    recordedById: varchar('recorded_by_id', { length: 255 }).references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    budgetOccurredIdx: index('budget_transactions_budget_occurred_idx').on(table.budgetId, table.occurredAt),
    referenceIdx: index('budget_transactions_reference_idx').on(table.referenceType, table.referenceId),
}));
export const operatorBlacklistEntries = mysqlTable('operator_blacklist_entries', {
    id: varchar('id', { length: 255 }).primaryKey(),
    operatorProfileId: varchar('operator_profile_id', { length: 255 }).notNull(),
    status: mysqlEnum('status', ['active', 'inactive', 'expired']).notNull(),
    reason: text('reason').notNull(),
    reference: varchar('reference', { length: 255 }),
    startsAt: timestamp('starts_at'),
    endsAt: timestamp('ends_at'),
    createdById: varchar('created_by_id', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    operatorStatusIdx: index('operator_blacklist_operator_status_idx').on(table.operatorProfileId, table.status),
    operatorProfileFk: foreignKey({
        columns: [table.operatorProfileId],
        foreignColumns: [operatorProfiles.id],
        name: 'obl_operator_profile_fk',
    }),
    createdByFk: foreignKey({
        columns: [table.createdById],
        foreignColumns: [users.id],
        name: 'obl_created_by_fk',
    }),
}));
export const appeals = mysqlTable('appeals', {
    id: varchar('id', { length: 255 }).primaryKey(),
    relatedDealId: varchar('related_deal_id', { length: 255 }).notNull().references(() => drafts.id),
    operatorId: varchar('operator_id', { length: 255 }).notNull().references(() => users.id),
    status: varchar('status', { length: 50 }).notNull(),
    submittedAt: timestamp('submitted_at').notNull(),
    resolvedAt: timestamp('resolved_at'),
    resolution: text('resolution'),
    createdById: varchar('created_by_id', { length: 255 }).notNull().references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    dealSubmittedIdx: index('appeals_deal_submitted_idx').on(table.relatedDealId, table.submittedAt),
    operatorSubmittedIdx: index('appeals_operator_submitted_idx').on(table.operatorId, table.submittedAt),
}));
export const aiAuditLog = mysqlTable('ai_audit_log', {
    id: varchar('id', { length: 255 }).primaryKey(),
    userId: varchar('user_id', { length: 255 })
        .notNull()
        .references(() => users.id),
    role: mysqlEnum('role', ['operator', 'authority', 'central_admin']).notNull(),
    question: varchar('question', { length: 1000 }).notNull(),
    toolNames: json('tool_names').$type().notNull(),
    rowCounts: json('row_counts').$type().notNull(),
    status: mysqlEnum('status', ['success', 'error']).notNull(),
    errorCode: varchar('error_code', { length: 100 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    userCreatedIdx: index('ai_audit_log_user_created_idx').on(table.userId, table.createdAt),
}));
export const technicalRequirements = mysqlTable('technical_requirements', {
    id: varchar('id', { length: 255 }).primaryKey(),
    draftId: varchar('draft_id', { length: 255 })
        .notNull()
        .references(() => drafts.id),
    code: varchar('code', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    isMandatory: boolean('is_mandatory').default(true).notNull(),
    sourceDocument: varchar('source_document', { length: 255 }).notNull(),
    sourcePage: int('source_page').notNull(),
    sourceClauseReference: varchar('source_clause_reference', { length: 100 }),
    minThreshold: text('min_threshold'),
    weightScore: int('weight_score').default(0).notNull(),
    extractedById: varchar('extracted_by_id', { length: 255 })
        .notNull()
        .references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    draftCodeIdx: index('tech_req_draft_code_idx').on(table.draftId, table.code),
}));
export const technicalEvaluations = mysqlTable('technical_evaluations', {
    id: varchar('id', { length: 255 }).primaryKey(),
    draftId: varchar('draft_id', { length: 255 })
        .notNull()
        .references(() => drafts.id),
    offerId: varchar('offer_id', { length: 255 })
        .notNull()
        .references(() => offers.id),
    evaluatedByCommitteeId: varchar('evaluated_by_committee_id', { length: 255 })
        .references(() => dealCommittees.id),
    aiAgentSessionId: varchar('ai_agent_session_id', { length: 255 }),
    totalRequirementsCount: int('total_requirements_count').notNull(),
    compliantCount: int('compliant_count').notNull(),
    nonCompliantCount: int('non_compliant_count').notNull(),
    requiresHumanReviewCount: int('requires_human_review_count').notNull(),
    preliminaryScore: decimal('preliminary_score', { precision: 5, scale: 2 }),
    humanReviewStatus: mysqlEnum('human_review_status', [
        'pending',
        'in_review',
        'verified_by_committee',
        'overridden',
    ]).default('pending').notNull(),
    humanReviewNotes: text('human_review_notes'),
    reviewedByUserId: varchar('reviewed_by_user_id', { length: 255 })
        .references(() => users.id),
    reviewedAt: timestamp('reviewed_at'),
    automatedDecisionForbidden: boolean('automated_decision_forbidden').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    draftOfferIdx: index('tech_eval_draft_offer_idx').on(table.draftId, table.offerId),
}));
export const complianceFindings = mysqlTable('compliance_findings', {
    id: varchar('id', { length: 255 }).primaryKey(),
    evaluationId: varchar('evaluation_id', { length: 255 })
        .notNull()
        .references(() => technicalEvaluations.id),
    requirementId: varchar('requirement_id', { length: 255 })
        .notNull()
        .references(() => technicalRequirements.id),
    status: mysqlEnum('status', [
        'compliant',
        'non_compliant',
        'partial',
        'uncertain_requires_human_review',
    ]).notNull(),
    findingDetails: text('finding_details').notNull(),
    evidenceDocument: varchar('evidence_document', { length: 255 }),
    evidencePage: int('evidence_page'),
    evidenceQuote: text('evidence_quote'),
    statutoryReference: varchar('statutory_reference', { length: 255 }),
    legalRiskLevel: mysqlEnum('legal_risk_level', [
        'none',
        'low',
        'medium',
        'high',
        'critical',
    ]).default('none').notNull(),
    humanResolution: mysqlEnum('human_resolution', [
        'pending',
        'confirmed_compliant',
        'confirmed_non_compliant',
        'clarification_requested',
    ]).default('pending').notNull(),
    committeeNotes: text('committee_notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    evalReqIdx: index('compliance_findings_eval_req_idx').on(table.evaluationId, table.requirementId),
}));
