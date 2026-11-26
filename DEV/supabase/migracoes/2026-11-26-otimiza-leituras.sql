-- Regras de segurança mais rápidas: auth.uid() calculado uma vez por consulta, e índices que faltavam.
-- (As regras antigas estão em DEV/supabase/backup/2026-11-26-politicas-antes-otimizacao.sql)

drop policy if exists contatos_adicionar_proprios on public.contatos;
drop policy if exists contatos_remover_proprios on public.contatos;
drop policy if exists contatos_ver_proprios on public.contatos;
create policy contatos_adicionar_proprios on public.contatos for insert to authenticated with check (dono_id = (select auth.uid()));
create policy contatos_remover_proprios on public.contatos for delete to authenticated using (dono_id = (select auth.uid()));
create policy contatos_ver_proprios on public.contatos for select to authenticated using (dono_id = (select auth.uid()));

drop policy if exists conversas_limpas_ver_minhas on public.conversas_limpas;
create policy conversas_limpas_ver_minhas on public.conversas_limpas for select to authenticated using (dono_id = (select auth.uid()));

drop policy if exists mensagens_enviar_para_contato on public.mensagens;
drop policy if exists mensagens_ver_minhas on public.mensagens;
create policy mensagens_enviar_para_contato on public.mensagens for insert to authenticated
  with check (remetente_id = (select auth.uid()) and exists (
    select 1 from public.contatos c where c.dono_id = (select auth.uid()) and c.contato_id = mensagens.destinatario_id));
create policy mensagens_ver_minhas on public.mensagens for select to authenticated
  using (remetente_id = (select auth.uid()) or destinatario_id = (select auth.uid()));

-- perfis_leitura já deixa todo usuário logado ler perfis; a regra "só o próprio" era redundante.
drop policy if exists perfis_ver_o_proprio on public.perfis;

drop policy if exists solicitacoes_ver_minhas on public.solicitacoes_contato;
create policy solicitacoes_ver_minhas on public.solicitacoes_contato for select to authenticated
  using (de_id = (select auth.uid()) or para_id = (select auth.uid()));

create index if not exists mensagens_remetente_destinatario_criado on public.mensagens (remetente_id, destinatario_id, criado_em desc);
create index if not exists mensagens_destinatario_criado on public.mensagens (destinatario_id, criado_em desc);
create index if not exists contatos_contato_id_idx on public.contatos (contato_id);
create index if not exists solicitacoes_para_id_idx on public.solicitacoes_contato (para_id);
create index if not exists conversas_limpas_outro_id_idx on public.conversas_limpas (outro_id);
