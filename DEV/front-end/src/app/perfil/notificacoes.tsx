"use client";

import { useEffect, useState } from "react";
import { Botao } from "@design/componentes";
import { criarClienteNavegador } from "../../supabase/navegador";
import { chaveParaBytes, guardarEndpoint, suportaPush } from "../../push/cliente";
import { obterChavePublicaAction, removerAssinaturaAction, salvarAssinaturaAction } from "../../push/acoes";
import type { AssinaturaPush } from "../../push/acoes";
import estilos from "./perfil.module.css";

type Estado = "carregando" | "sem-suporte" | "bloqueado" | "desligado" | "ligado";

/** Linha "Notificações" do perfil: liga/desliga o aviso de mensagens neste aparelho. */
export function Notificacoes() {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    (async () => {
      if (!suportaPush()) { setEstado("sem-suporte"); return; }
      if (Notification.permission === "denied") { setEstado("bloqueado"); return; }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!sub || Notification.permission !== "granted") { setEstado("desligado"); return; }
        // Só conta como ligado se este aparelho está registrado para a conta de agora.
        const { data } = await criarClienteNavegador().from("push_assinaturas").select("endpoint").eq("endpoint", sub.endpoint).maybeSingle();
        if (data) guardarEndpoint(sub.endpoint);
        setEstado(data ? "ligado" : "desligado");
      } catch { setEstado("desligado"); }
    })();
  }, []);

  async function ativar() {
    setOcupado(true);
    setErro("");
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") { setEstado(permissao === "denied" ? "bloqueado" : "desligado"); return; }
      const chave = await obterChavePublicaAction();
      if (!chave) { setErro("Notificações indisponíveis no momento."); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription())
        ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveParaBytes(chave) }));
      const ok = await salvarAssinaturaAction(sub.toJSON() as AssinaturaPush);
      if (!ok) { setErro("Não foi possível ativar agora. Tente novamente."); return; }
      guardarEndpoint(sub.endpoint);
      setEstado("ligado");
    } catch {
      setErro("Não foi possível ativar as notificações neste aparelho.");
    } finally {
      setOcupado(false);
    }
  }

  async function desativar() {
    setOcupado(true);
    setErro("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removerAssinaturaAction(sub.endpoint);
        await sub.unsubscribe();
      }
      guardarEndpoint(null);
      setEstado("desligado");
    } catch {
      setErro("Não foi possível desativar agora.");
    } finally {
      setOcupado(false);
    }
  }

  const texto =
    estado === "ligado" ? "Ativadas neste aparelho. Você recebe o nome e a foto de quem mandou, mesmo com o app fechado."
    : estado === "bloqueado" ? "Bloqueadas no navegador. Libere nas configurações do site para ativar."
    : estado === "sem-suporte" ? "Este navegador não permite. No iPhone, instale o app na tela inicial primeiro."
    : estado === "carregando" ? "Verificando…"
    : "Desativadas neste aparelho.";

  return (
    <>
      <dd>{texto}</dd>
      {erro && <dd className={estilos.dica} role="alert">{erro}</dd>}
      {estado === "desligado" && <div className={estilos.botaoCanto}><Botao ocupado={ocupado} onClick={ativar}>Ativar</Botao></div>}
      {estado === "ligado" && <div className={estilos.botaoCanto}><Botao ocupado={ocupado} onClick={desativar}>Desativar</Botao></div>}
    </>
  );
}
