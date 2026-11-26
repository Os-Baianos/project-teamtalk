-- Backup das regras de segurança (RLS) como estavam antes da otimização de 2026-11-26.
-- Para voltar: apague as regras novas e rode este arquivo.
create policy contatos_adicionar_proprios on public.contatos as PERMISSIVE for INSERT to authenticated with check ((dono_id = auth.uid()));
create policy contatos_remover_proprios on public.contatos as PERMISSIVE for DELETE to authenticated using ((dono_id = auth.uid()));
create policy contatos_ver_proprios on public.contatos as PERMISSIVE for SELECT to authenticated using ((dono_id = auth.uid()));
create policy conversas_limpas_ver_minhas on public.conversas_limpas as PERMISSIVE for SELECT to public using ((dono_id = auth.uid()));
create policy mensagens_enviar_para_contato on public.mensagens as PERMISSIVE for INSERT to authenticated with check (((remetente_id = auth.uid()) AND (EXISTS ( SELECT 1 FROM contatos c WHERE ((c.dono_id = auth.uid()) AND (c.contato_id = mensagens.destinatario_id))))));
create policy mensagens_ver_minhas on public.mensagens as PERMISSIVE for SELECT to authenticated using (((remetente_id = auth.uid()) OR (destinatario_id = auth.uid())));
create policy perfis_ver_o_proprio on public.perfis as PERMISSIVE for SELECT to authenticated using ((id = auth.uid()));
create policy solicitacoes_ver_minhas on public.solicitacoes_contato as PERMISSIVE for SELECT to authenticated using (((de_id = auth.uid()) OR (para_id = auth.uid())));
