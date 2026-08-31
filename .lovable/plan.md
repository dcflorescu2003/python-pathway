# Jurnal de conturi șterse

## Situația actuală (verificată)

- 83 de conturi au avut activitate într-o singură zi în ultimele 30 de zile (din 106 conturi cu activitate).
- Nu putem spune câte conturi au fost șterse: ștergerea elimină definitiv toate rândurile, iar în baza de date nu există nicio urmă (334 conturi, 0 profiluri orfane, 0 conturi marcate ca șterse).

## Ce propun

Un jurnal minimal de ștergeri, fără date personale, ca de acum înainte să putem raporta câte conturi se șterg și de ce fel erau.

Se va înregistra, la fiecare ștergere:
- data și ora ștergerii
- dacă era cont de profesor
- dacă era Premium
- data creării contului (ca să vedem cât a durat)
- inițiatorul: utilizator sau admin

Nu se salvează email, nume sau alte date personale.

## Detalii tehnice

- Migrare: tabel `public.account_deletions` (`id`, `deleted_at`, `account_created_at`, `was_teacher`, `was_premium`, `initiated_by`), cu `GRANT` doar pentru `service_role` și `SELECT` pentru admini prin politică RLS bazată pe `has_role(auth.uid(), 'admin')`.
- `supabase/functions/delete-account/index.ts`: înainte de ștergerea profilului, citește `is_teacher`, `is_premium`, `created_at` și inserează un rând în `account_deletions` cu clientul service role.
- Opțional (recomandat): în pagina de statistici din Admin, un card „Conturi șterse” pe intervalul selectat, alimentat din același tabel.
