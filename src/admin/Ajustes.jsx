import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Bell, ExternalLink, Plus, Trash2, Volume2, X } from 'lucide-react'
import Button from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { applySiteConfig, cacheSiteConfig } from '../config/siteConfig'
import { SITE } from '../config/site'
import { buildWhatsAppUrl } from '../config/whatsapp'
import { formatTelefone, toWhatsAppNumber } from '../utils/format'
import {
  deleteVeterinario,
  getSiteConfig,
  listEquipe,
  listVeterinarios,
  saveSiteConfig,
  saveVeterinario,
} from './api'
import {
  notificacoesPermitidas,
  notificacoesSuportadas,
  pedirPermissaoNotificacao,
  setSomLigado,
  somLigado,
  tocarSom,
} from './alertas'
import { Chip } from './ui'
import { useToast } from './toast'

const input =
  'w-full rounded-tile border border-sand-dark bg-white px-4 py-2.5 text-ink focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 focus:outline-none'
const label = 'mb-1 block text-sm font-bold text-ink'
const card = 'flex flex-col gap-4 rounded-card border border-sand bg-white p-4 sm:p-5'

const WHATSAPPS = [
  ['atendimento', 'Atendimento e loja', 'Recebe pedidos da loja e dúvidas gerais.'],
  ['banhoTosa', 'Banho e tosa', 'Recebe os agendamentos de banho e tosa.'],
  ['veterinario', 'Veterinário', 'Recebe consultas e o botão de emergência 24h.'],
]

/** Configurações do site e do painel. */
export default function Ajustes() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Ajustes</h1>
        <p className="text-sm text-clay">Dados que aparecem no site e preferências do painel.</p>
      </div>
      <DadosLoja />
      <Veterinarios />
      <AvisosAparelho />
      <Acesso />
    </div>
  )
}

/* ======================================================= Dados da loja */

function DadosLoja() {
  const toast = useToast()
  const [original, setOriginal] = useState(null)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSiteConfig()
      .then((dados) => {
        setOriginal(dados)
        setForm(paraForm(dados))
      })
      .catch(() => toast({ message: 'Não foi possível carregar os dados da loja.', tone: 'erro' }))
  }, [toast])

  if (!form) return <Skeleton className="h-96 w-full rounded-card" />

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))
  const setWhats = (campo) => (e) => setForm((f) => ({ ...f, whatsapp: { ...f.whatsapp, [campo]: e.target.value } }))
  const mudou = JSON.stringify(deForm(form, original)) !== JSON.stringify(original)

  const salvar = async () => {
    const invalido = WHATSAPPS.find(([id]) => toWhatsAppNumber(form.whatsapp[id]).length < 12)
    if (invalido) return toast({ message: `WhatsApp de ${invalido[1].toLowerCase()} incompleto. Use DDD + número.`, tone: 'erro' })
    const nota = form.googleNota.trim() ? Number(form.googleNota.replace(',', '.')) : null
    if (nota != null && !(nota >= 1 && nota <= 5))
      return toast({ message: 'A nota do Google vai de 1 a 5 (ex.: 4,8).', tone: 'erro' })
    setSaving(true)
    try {
      const saved = await saveSiteConfig(deForm(form, original))
      // o site aberto neste aparelho já passa a usar os dados novos
      applySiteConfig(saved)
      cacheSiteConfig(saved)
      setOriginal(saved)
      setForm(paraForm(saved))
      toast({ message: 'Dados da loja salvos. O site já mostra as mudanças.' })
    } catch {
      toast({ message: 'Não foi possível salvar. Confira a internet e tente de novo.', tone: 'erro' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={card}>
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Dados da loja</h2>
        <p className="text-sm text-clay">Aparecem no topo, no rodapé, nos botões de WhatsApp e nas mensagens.</p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-xs font-bold tracking-[0.12em] text-clay uppercase">WhatsApp de cada setor</legend>
        {WHATSAPPS.map(([id, nome, dica]) => (
          <div key={id}>
            <label htmlFor={`w-${id}`} className={label}>
              {nome} <span className="font-normal text-clay">· {dica}</span>
            </label>
            <div className="flex gap-2">
              <input id={`w-${id}`} type="tel" inputMode="tel" value={form.whatsapp[id]} onChange={setWhats(id)} placeholder="(14) 99999-0000" className={input} />
              <Button
                variant="outline"
                size="sm"
                href={buildWhatsAppUrl(toWhatsAppNumber(form.whatsapp[id]), 'Teste do painel do Mercadog.')}
                aria-label={`Testar WhatsApp de ${nome.toLowerCase()}`}
              >
                <ExternalLink size={15} aria-hidden="true" />
                Testar
              </Button>
            </div>
          </div>
        ))}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="d-phone" className={label}>Telefone fixo</label>
          <input id="d-phone" type="tel" value={form.phone} onChange={set('phone')} className={input} />
        </div>
        <div>
          <label htmlFor="d-email" className={label}>E-mail</label>
          <input id="d-email" type="email" value={form.email} onChange={set('email')} className={input} />
        </div>
      </div>

      <div>
        <label htmlFor="d-address" className={label}>Endereço completo <span className="font-normal text-clay">(rodapé e mapa)</span></label>
        <input id="d-address" value={form.address} onChange={set('address')} className={input} />
      </div>
      <div>
        <label htmlFor="d-short" className={label}>Endereço curto <span className="font-normal text-clay">(mensagens de WhatsApp)</span></label>
        <input id="d-short" value={form.addressShort} onChange={set('addressShort')} className={input} />
      </div>
      <div>
        <label htmlFor="d-tagline" className={label}>Frase da loja</label>
        <input id="d-tagline" value={form.tagline} onChange={set('tagline')} className={input} />
      </div>

      <fieldset>
        <legend className={label}>Horário de atendimento <span className="font-normal text-clay">(texto do rodapé e do menu)</span></legend>
        <div className="flex flex-col gap-2">
          {form.hours.map((h, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={h.label}
                aria-label="Dias"
                placeholder="Seg. a sex."
                onChange={(e) => setForm((f) => ({ ...f, hours: f.hours.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) }))}
                className={`${input} max-w-[40%]`}
              />
              <input
                value={h.value}
                aria-label="Horário"
                placeholder="8h às 18h"
                onChange={(e) => setForm((f) => ({ ...f, hours: f.hours.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) }))}
                className={input}
              />
              <button type="button" aria-label="Remover linha" onClick={() => setForm((f) => ({ ...f, hours: f.hours.filter((_, j) => j !== i) }))} className="grid size-11 shrink-0 place-items-center rounded-full text-clay hover:bg-red-50 hover:text-red-600">
                <X size={16} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setForm((f) => ({ ...f, hours: [...f.hours, { label: '', value: '' }] }))} className="flex w-fit items-center gap-1 text-sm font-semibold text-terracotta-600 hover:underline">
            <Plus size={15} aria-hidden="true" />
            Adicionar linha
          </button>
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="d-insta" className={label}>Instagram</label>
          <input id="d-insta" type="url" value={form.instagram} onChange={set('instagram')} className={input} />
        </div>
        <div>
          <label htmlFor="d-face" className={label}>Facebook</label>
          <input id="d-face" type="url" value={form.facebook} onChange={set('facebook')} className={input} />
        </div>
        <div>
          <label htmlFor="d-link" className={label}>Linktree</label>
          <input id="d-link" type="url" value={form.linktree} onChange={set('linktree')} className={input} />
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-xs font-bold tracking-[0.12em] text-clay uppercase">Avaliações no Google</legend>
        <p className="-mt-1 text-sm text-clay">
          Veja a nota e o número de avaliações no painel do Google Meu Negócio e copie aqui. Com os campos vazios, o
          site mostra só o link “Ver o que os tutores dizem”.
        </p>
        <div className="grid gap-3 sm:grid-cols-[8rem_10rem_1fr]">
          <div>
            <label htmlFor="g-nota" className={label}>Nota</label>
            <input id="g-nota" inputMode="decimal" value={form.googleNota} onChange={set('googleNota')} placeholder="4,8" className={input} />
          </div>
          <div>
            <label htmlFor="g-total" className={label}>Nº de avaliações</label>
            <input id="g-total" inputMode="numeric" value={form.googleTotal} onChange={set('googleTotal')} placeholder="120" className={input} />
          </div>
          <div>
            <label htmlFor="g-link" className={label}>Link do perfil</label>
            <input id="g-link" type="url" value={form.googleLink} onChange={set('googleLink')} className={input} />
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end gap-2">
        {mudou && (
          <Button variant="ghost" size="sm" onClick={() => setForm(paraForm(original))}>
            Desfazer alterações
          </Button>
        )}
        <Button onClick={salvar} loading={saving} disabled={!mudou}>
          Salvar dados da loja
        </Button>
      </div>
    </section>
  )
}

/** Banco → formulário: WhatsApp aparece formatado "(14) 99629-6210". */
const paraForm = (d) => ({
  tagline: d.tagline ?? '',
  address: d.address ?? '',
  addressShort: d.addressShort ?? '',
  phone: d.phone ?? '',
  email: d.email ?? '',
  hours: d.hours?.length ? d.hours : [{ label: '', value: '' }],
  instagram: d.instagram ?? '',
  facebook: d.facebook ?? '',
  linktree: d.linktree ?? '',
  whatsapp: Object.fromEntries(WHATSAPPS.map(([id]) => [id, formatTelefone(d.whatsapp?.[id] ?? '')])),
  googleNota: d.google?.nota == null ? '' : String(d.google.nota).replace('.', ','),
  googleTotal: d.google?.total == null ? '' : String(d.google.total),
  // sem link salvo, o formulário já vem com a busca do Mercadog no Google Maps
  googleLink: d.google?.link ?? SITE.google.link,
})

/** Formulário → banco: WhatsApp só dígitos com 55; linhas de horário vazias saem. */
const deForm = (f, original) => ({
  ...original,
  tagline: f.tagline.trim(),
  address: f.address.trim(),
  addressShort: f.addressShort.trim(),
  phone: f.phone.trim(),
  email: f.email.trim(),
  hours: f.hours.filter((h) => h.label.trim() || h.value.trim()).map((h) => ({ label: h.label.trim(), value: h.value.trim() })),
  instagram: f.instagram.trim(),
  facebook: f.facebook.trim(),
  linktree: f.linktree.trim(),
  whatsapp: Object.fromEntries(WHATSAPPS.map(([id]) => [id, toWhatsAppNumber(f.whatsapp[id])])),
  google: deGoogle(f, original),
})

/** Campos do Google → banco. Sem nada preenchido além do link padrão, não grava nada novo. */
function deGoogle(f, original) {
  const google = {
    link: f.googleLink.trim() || null,
    nota: f.googleNota.trim() ? Number(f.googleNota.replace(',', '.')) : null,
    total: f.googleTotal.replace(/\D/g, '') ? Number(f.googleTotal.replace(/\D/g, '')) : null,
  }
  const soPadrao = google.nota == null && google.total == null && google.link === SITE.google.link
  return !original.google && soPadrao ? undefined : google
}

/* =================================================== Equipe veterinária */

function Veterinarios() {
  const toast = useToast()
  const [lista, setLista] = useState(null)
  const [editando, setEditando] = useState(null) // id, 'novo' ou null
  const [form, setForm] = useState({ nome: '', crmv: '', especialidade: '' })
  const [busy, setBusy] = useState(false)

  const load = () =>
    listVeterinarios()
      .then(setLista)
      .catch(() => toast({ message: 'Não foi possível carregar a equipe veterinária.', tone: 'erro' }))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const run = async (fn, msg) => {
    setBusy(true)
    try {
      await fn()
      await load()
      if (msg) toast({ message: msg })
    } catch {
      toast({ message: 'Não foi possível salvar. Confira a internet.', tone: 'erro' })
    } finally {
      setBusy(false)
    }
  }

  const abrir = (v) => {
    setEditando(v ? v.id : 'novo')
    setForm({ nome: v?.nome ?? '', crmv: v?.crmv ?? '', especialidade: v?.especialidade ?? '' })
  }

  const salvar = () => {
    if (form.nome.trim().length < 2) return toast({ message: 'Informe o nome.', tone: 'erro' })
    const atual = lista.find((v) => v.id === editando)
    run(async () => {
      await saveVeterinario({
        ...(atual ?? { ativo: true, ordem: (lista.at(-1)?.ordem ?? 0) + 1 }),
        nome: form.nome.trim(),
        crmv: form.crmv.trim() || null,
        especialidade: form.especialidade.trim() || null,
      })
      setEditando(null)
    }, 'Equipe veterinária salva.')
  }

  const formulario = (
    <div className="flex flex-col gap-2 rounded-tile border border-terracotta-200 bg-terracotta-50/60 p-3">
      <input autoFocus value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Nome (ex.: Dr. Wilson)" aria-label="Nome" className={input} />
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={form.crmv} onChange={(e) => setForm((f) => ({ ...f, crmv: e.target.value }))} placeholder="CRMV-SP 12345" aria-label="CRMV" className={input} />
        <input value={form.especialidade} onChange={(e) => setForm((f) => ({ ...f, especialidade: e.target.value }))} placeholder="Especialidade" aria-label="Especialidade" className={input} />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setEditando(null)}>Cancelar</Button>
        <Button size="sm" onClick={salvar} loading={busy}>Salvar</Button>
      </div>
    </div>
  )

  return (
    <section className={card}>
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Equipe veterinária</h2>
        <p className="text-sm text-clay">Aparece na página de consultas, nesta ordem.</p>
      </div>
      {!lista ? (
        <Skeleton className="h-24 w-full rounded-card" />
      ) : (
        <div className="flex flex-col gap-2">
          {lista.map((v, i) =>
            editando === v.id ? (
              <div key={v.id}>{formulario}</div>
            ) : (
              <div key={v.id} className={`flex items-center gap-2 rounded-tile border border-sand px-2 py-2 ${v.ativo ? '' : 'bg-cream/70'}`}>
                <div className="flex flex-col">
                  <button type="button" aria-label={`Subir ${v.nome}`} disabled={i === 0 || busy} onClick={() => run(() => Promise.all([saveVeterinario({ ...v, ordem: i }), saveVeterinario({ ...lista[i - 1], ordem: i + 1 })]))} className="grid size-6 place-items-center rounded-full text-clay hover:bg-terracotta-50 disabled:opacity-25">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" aria-label={`Descer ${v.nome}`} disabled={i === lista.length - 1 || busy} onClick={() => run(() => Promise.all([saveVeterinario({ ...v, ordem: i + 2 }), saveVeterinario({ ...lista[i + 1], ordem: i + 1 })]))} className="grid size-6 place-items-center rounded-full text-clay hover:bg-terracotta-50 disabled:opacity-25">
                    <ArrowDown size={14} />
                  </button>
                </div>
                <button type="button" onClick={() => abrir(v)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-semibold text-ink">{v.nome}</span>
                  <span className="block truncate text-xs text-clay">{[v.crmv, v.especialidade].filter(Boolean).join(' · ') || 'Sem CRMV e especialidade'}</span>
                </button>
                <Chip ativo={v.ativo} onClick={() => run(() => saveVeterinario({ ...v, ativo: !v.ativo }), v.ativo ? `${v.nome} saiu do site.` : `${v.nome} voltou ao site.`)} on="No site" off="Oculto" />
                <button type="button" aria-label={`Excluir ${v.nome}`} disabled={busy} onClick={() => run(() => deleteVeterinario(v.id), `${v.nome} excluído.`)} className="grid size-9 place-items-center rounded-full text-red-600 hover:bg-red-50 disabled:opacity-40">
                  <Trash2 size={16} />
                </button>
              </div>
            ),
          )}
          {editando === 'novo' ? (
            formulario
          ) : (
            <button type="button" onClick={() => abrir(null)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-tile border border-dashed border-terracotta-300 text-sm font-semibold text-terracotta-600 hover:bg-terracotta-50">
              <Plus size={16} aria-hidden="true" />
              Adicionar veterinário
            </button>
          )}
          {lista.some((v) => !v.crmv || /^CRMV-[A-Z]{2}$/.test(v.crmv)) && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Falta o número do CRMV em algum cadastro — o conselho exige o número em divulgação.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

/* =============================================== Avisos neste aparelho */

function AvisosAparelho() {
  const toast = useToast()
  const [som, setSom] = useState(somLigado)
  const [notif, setNotif] = useState(notificacoesPermitidas)
  const suportado = notificacoesSuportadas()
  const bloqueado = suportado && Notification.permission === 'denied'

  return (
    <section className={card}>
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Avisos de pedido novo neste aparelho</h2>
        <p className="text-sm text-clay">Cada pessoa liga no próprio celular ou computador.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip
          ativo={som}
          onClick={() => {
            setSomLigado(!som)
            setSom(!som)
          }}
          on="Som ligado"
          off="Som desligado"
        />
        <Button size="sm" variant="outline" onClick={tocarSom}>
          <Volume2 size={15} aria-hidden="true" />
          Ouvir o som
        </Button>
        {suportado && !notif && !bloqueado && (
          <Button
            size="sm"
            onClick={async () => {
              const ok = await pedirPermissaoNotificacao()
              setNotif(ok)
              toast({ message: ok ? 'Notificações ligadas neste aparelho.' : 'Notificações não foram liberadas.', tone: ok ? 'ok' : 'erro' })
            }}
          >
            <Bell size={15} aria-hidden="true" />
            Ligar notificações
          </Button>
        )}
      </div>
      <p className="text-xs text-clay">
        {!suportado
          ? 'Este navegador não mostra notificações — o aviso aparece só com o painel aberto.'
          : bloqueado
            ? 'As notificações estão bloqueadas para este site. Libere nas configurações do navegador (cadeado ao lado do endereço).'
            : notif
              ? 'Notificações ligadas: o aviso chega mesmo com o painel em segundo plano.'
              : 'Com as notificações ligadas, o aviso chega mesmo com o painel em segundo plano.'}
      </p>
    </section>
  )
}

/* ================================================== Quem acessa o painel */

function Acesso() {
  const [equipe, setEquipe] = useState(null)

  useEffect(() => {
    listEquipe().then(setEquipe).catch(() => setEquipe([]))
  }, [])

  return (
    <section className={card}>
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Quem acessa o painel</h2>
        <p className="text-sm text-clay">
          Para incluir alguém: crie o usuário no Supabase (Authentication → Users → Add user) e cadastre com o
          <code className="mx-1 rounded bg-cream px-1">supabase/003_cadastrar_equipe.sql</code>.
        </p>
      </div>
      {!equipe ? (
        <Skeleton className="h-16 w-full rounded-card" />
      ) : (
        <ul className="flex flex-col divide-y divide-sand rounded-tile border border-sand">
          {equipe.map((m) => (
            <li key={m.nome + m.created_at} className="flex items-center justify-between px-3 py-2.5">
              <span className="font-semibold text-ink">{m.nome}</span>
              <span className="text-xs text-clay">{m.papel === 'dono' ? 'Dono' : 'Atendimento'}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
