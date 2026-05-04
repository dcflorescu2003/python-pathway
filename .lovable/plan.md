## Acceptare DOC/DOCX la upload verificare profesor

Înlocuim `accept="image/*,.pdf"` cu o listă explicită care:
- elimină opțiunea cameră (fără wildcard `image/*`)
- adaugă suport pentru `.doc` și `.docx`

Valoare nouă:
```
.pdf,.doc,.docx,.jpg,.jpeg,.png,.heic,.heif,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/heic,image/heif,image/webp
```

### Fișiere modificate
1. `src/components/teacher/TeacherVerificationForm.tsx` — linia 355 (input upload document verificare)
2. `src/components/teacher/VerificationChat.tsx` — linia 161 (input atașament chat verificare)

Bucket-ul Supabase `teacher-documents` acceptă deja orice tip de fișier — nicio modificare backend necesară.