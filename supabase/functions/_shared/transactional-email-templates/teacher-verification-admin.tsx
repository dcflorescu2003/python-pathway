import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "PyRo"

interface Props {
  method?: string
  contactEmail?: string
  schoolName?: string
}

const TeacherVerificationAdminEmail = ({ method, contactEmail, schoolName }: Props) => (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>Cerere nouă de verificare profesor pe {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={badge}>🎓 {SITE_NAME}</Text>
        </Section>
        <Heading style={h1}>Cerere nouă de verificare profesor</Heading>
        <Text style={text}>
          Un utilizator a trimis o cerere de verificare a calității de profesor.
        </Text>
        <Section style={detailsBox}>
          <Text style={detailRow}><strong>Metodă:</strong> {method || 'necunoscută'}</Text>
          <Text style={detailRow}><strong>Email contact:</strong> {contactEmail || 'nespecificat'}</Text>
          {schoolName && <Text style={detailRow}><strong>Liceu:</strong> {schoolName}</Text>}
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Verifică cererea în panoul de administrare {SITE_NAME}.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TeacherVerificationAdminEmail,
  subject: 'Cerere nouă de verificare profesor',
  displayName: 'Notificare admin - verificare profesor',
  previewData: {
    method: 'public_link',
    contactEmail: 'profesor@gmail.com',
    schoolName: 'Colegiul Național Cantemir, București',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '520px', margin: '0 auto' }
const header = { textAlign: 'center' as const, marginBottom: '16px' }
const badge = { fontSize: '14px', fontWeight: '700' as const, color: '#00e676', margin: '0' }
const h1 = { fontSize: '20px', fontWeight: '700' as const, color: '#1a1a1a', margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: '0 0 16px' }
const detailsBox = { backgroundColor: '#f5f5f5', borderRadius: '8px', padding: '16px', marginBottom: '16px' }
const detailRow = { fontSize: '14px', color: '#333', margin: '0 0 6px', lineHeight: '1.5' }
const hr = { borderColor: '#e5e5e5', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '0' }
