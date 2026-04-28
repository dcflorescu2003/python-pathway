/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as teacherVerificationAdmin } from './teacher-verification-admin.tsx'
import { template as emailChangeVerification } from './email-change-verification.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'teacher-verification-admin': teacherVerificationAdmin,
  'email-change-verification': emailChangeVerification,
}
