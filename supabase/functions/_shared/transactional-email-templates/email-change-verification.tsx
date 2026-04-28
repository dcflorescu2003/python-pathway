/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  code: string
  appName?: string
}

const EmailChangeVerification = ({ code, appName = 'PyRo' }: Props) => (
  <Html>
    <Head />
    <Preview>Codul tău de verificare PyRo: {code}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
      <Container style={{ maxWidth: 480, margin: '40px auto', padding: '32px 24px', backgroundColor: '#ffffff' }}>
        <Heading style={{ color: '#0F1219', fontSize: 22, marginBottom: 8 }}>
          Confirmă noul tău email
        </Heading>
        <Text style={{ color: '#4b5563', fontSize: 14, lineHeight: '20px' }}>
          Ai cerut să adaugi această adresă de email la contul tău {appName}. Introdu codul de mai jos în aplicație pentru a confirma.
        </Text>
        <Section style={{ textAlign: 'center', margin: '28px 0' }}>
          <Text
            style={{
              fontFamily: 'JetBrains Mono, Menlo, monospace',
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: 8,
              color: '#0F1219',
              backgroundColor: '#f3f4f6',
              padding: '16px 24px',
              borderRadius: 8,
              display: 'inline-block',
              margin: 0,
            }}
          >
            {code}
          </Text>
        </Section>
        <Text style={{ color: '#6b7280', fontSize: 12, lineHeight: '18px' }}>
          Codul expiră în 15 minute. Dacă nu ai cerut tu această schimbare, poți ignora acest email — contul tău rămâne în siguranță.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template: TemplateEntry = {
  component: EmailChangeVerification,
  subject: 'Codul tău de confirmare PyRo',
  displayName: 'Email change verification',
  previewData: { code: '123456' },
}
