"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@design/componentes";
import { criarClienteNavegador } from "../../supabase/navegador";
import estilos from "./perfil.module.css";

const TAMANHO = 256; // lado da foto final e da área de ajuste (px)
const LIMITE_MB = 8;

type Props = { usuarioId: string; inicial: string; fotoUrl: string | null; fotoPath: string | null };

/** Foto de perfil: enviar, ajustar (arrastar e zoom) e remover. */
export function FotoPerfil({ usuarioId, inicial, fotoUrl, fotoPath }: Props) {
  const roteador = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);
  const arraste = useRef<{ x: number; y: number } | null>(null);
  const [imagem, setImagem] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState("");

  // Escala base: a imagem sempre cobre a área toda; o zoom aumenta a partir daí.
  const escala = imagem ? Math.max(TAMANHO / imagem.width, TAMANHO / imagem.height) * zoom : 1;

  function limitar(p: { x: number; y: number }, esc = escala) {
    if (!imagem) return p;
    const folgaX = Math.max(0, (imagem.width * esc - TAMANHO) / 2);
    const folgaY = Math.max(0, (imagem.height * esc - TAMANHO) / 2);
    return { x: Math.min(folgaX, Math.max(-folgaX, p.x)), y: Math.min(folgaY, Math.max(-folgaY, p.y)) };
  }

  useEffect(() => {
    const c = tela.current;
    if (!c || !imagem) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, TAMANHO, TAMANHO);
    const p = limitar(pos);
    const w = imagem.width * escala;
    const h = imagem.height * escala;
    ctx.drawImage(imagem, TAMANHO / 2 - w / 2 + p.x, TAMANHO / 2 - h / 2 + p.y, w, h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagem, zoom, pos, escala]);

  function escolher(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setMensagem("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
      setMensagem("Use uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (arquivo.size > LIMITE_MB * 1024 * 1024) {
      setMensagem(`A imagem passa de ${LIMITE_MB} MB. Escolha uma menor.`);
      return;
    }
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      setZoom(1);
      setPos({ x: 0, y: 0 });
      setImagem(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setMensagem("Não foi possível abrir essa imagem.");
    };
    img.src = url;
  }

  function comecarArraste(e: PointerEvent<HTMLCanvasElement>) {
    arraste.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function arrastar(e: PointerEvent<HTMLCanvasElement>) {
    if (!arraste.current) return;
    const dx = e.clientX - arraste.current.x;
    const dy = e.clientY - arraste.current.y;
    arraste.current = { x: e.clientX, y: e.clientY };
    setPos((p) => limitar({ x: p.x + dx, y: p.y + dy }));
  }
  function soltar() { arraste.current = null; }

  function mudarZoom(novo: number) {
    if (!imagem) return;
    const nova = Math.max(TAMANHO / imagem.width, TAMANHO / imagem.height) * novo;
    setZoom(novo);
    setPos((p) => limitar(p, nova));
  }

  async function salvar() {
    const c = tela.current;
    if (!c || !imagem) return;
    setOcupado(true);
    setMensagem("");
    const blob: Blob | null = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.9));
    if (!blob) { setOcupado(false); setMensagem("Não foi possível preparar a foto."); return; }
    const supabase = criarClienteNavegador();
    const caminho = `${usuarioId}/foto-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("avatares").upload(caminho, blob, { contentType: "image/jpeg" });
    if (error) { setOcupado(false); setMensagem("Não foi possível enviar a foto. Tente novamente."); return; }
    const { error: erroPerfil } = await supabase.rpc("definir_foto", { caminho });
    if (erroPerfil) { setOcupado(false); setMensagem("Não foi possível salvar a foto. Tente novamente."); return; }
    if (fotoPath) await supabase.storage.from("avatares").remove([fotoPath]);
    setImagem(null);
    setOcupado(false);
    roteador.refresh();
  }

  async function remover() {
    setOcupado(true);
    setMensagem("");
    const supabase = criarClienteNavegador();
    const { error } = await supabase.rpc("definir_foto", { caminho: null });
    if (error) { setOcupado(false); setMensagem("Não foi possível remover a foto. Tente novamente."); return; }
    if (fotoPath) await supabase.storage.from("avatares").remove([fotoPath]);
    setOcupado(false);
    roteador.refresh();
  }

  if (imagem) {
    return (
      <div className={estilos.ajuste}>
        <canvas
          ref={tela}
          width={TAMANHO}
          height={TAMANHO}
          className={estilos.canvas}
          onPointerDown={comecarArraste}
          onPointerMove={arrastar}
          onPointerUp={soltar}
          onPointerCancel={soltar}
          aria-label="Área de ajuste da foto: arraste para posicionar"
        />
        <label className={estilos.zoom}>
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => mudarZoom(Number(e.target.value))}
          />
        </label>
        <p className={estilos.dica}>Arraste a imagem para posicionar.</p>
        {mensagem && <p className={estilos.erro} role="alert">{mensagem}</p>}
        <div className={estilos.acoes}>
          <Botao variante="secundaria" onClick={() => { setImagem(null); setMensagem(""); }} disabled={ocupado}>Cancelar</Botao>
          <Botao onClick={salvar} ocupado={ocupado}>Salvar foto</Botao>
        </div>
      </div>
    );
  }

  return (
    <div className={estilos.fotoArea}>
      {fotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fotoUrl} alt="Sua foto de perfil" className={estilos.foto} width={96} height={96} />
      ) : (
        <span className={estilos.foto} aria-hidden="true">{inicial}</span>
      )}
      <input ref={entrada} type="file" accept="image/jpeg,image/png,image/webp" className={estilos.escondido} onChange={escolher} aria-label="Escolher foto de perfil" />
      <div className={estilos.acoes}>
        <Botao variante="secundaria" onClick={() => entrada.current?.click()} disabled={ocupado}>
          {fotoUrl ? "Trocar foto" : "Enviar foto"}
        </Botao>
        {fotoUrl && <Botao variante="perigo" onClick={remover} ocupado={ocupado}>Remover foto</Botao>}
      </div>
      {mensagem && <p className={estilos.erro} role="alert">{mensagem}</p>}
    </div>
  );
}
