-- Notificações push: um registro por aparelho que ativou as notificações.
create table if not exists public.push_assinaturas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);
create index if not exists push_assinaturas_usuario_idx on public.push_assinaturas(usuario_id);
alter table public.push_assinaturas enable row level security;

create policy "push_ver_as_minhas" on public.push_assinaturas for select to authenticated using (usuario_id = (select auth.uid()));
create policy "push_criar_as_minhas" on public.push_assinaturas for insert to authenticated with check (usuario_id = (select auth.uid()));
create policy "push_apagar_as_minhas" on public.push_assinaturas for delete to authenticated using (usuario_id = (select auth.uid()));
grant select, insert, delete on public.push_assinaturas to authenticated;

-- Aparelhos de quem vai receber: só quem acabou de me mandar mensagem (menos de 1 minuto) pode pedir.
create or replace function public.push_destinos(dest uuid)
returns table(endpoint text, p256dh text, auth text)
language sql stable security definer set search_path = public as $$
  select a.endpoint, a.p256dh, a.auth from public.push_assinaturas a
  where a.usuario_id = dest
    and exists (select 1 from public.mensagens m
                where m.remetente_id = auth.uid() and m.destinatario_id = dest and m.criado_em > now() - interval '1 minute');
$$;

-- Remove aparelho que o navegador já cancelou (resposta 404/410 do push), no mesmo critério.
create or replace function public.push_remover_morto(dest uuid, ponto text)
returns void
language sql security definer set search_path = public as $$
  delete from public.push_assinaturas a
  where a.usuario_id = dest and a.endpoint = ponto
    and exists (select 1 from public.mensagens m
                where m.remetente_id = auth.uid() and m.destinatario_id = dest and m.criado_em > now() - interval '1 minute');
$$;

revoke all on function public.push_destinos(uuid), public.push_remover_morto(uuid, text) from public, anon;
grant execute on function public.push_destinos(uuid), public.push_remover_morto(uuid, text) to authenticated;
