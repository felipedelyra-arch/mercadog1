import PageWrapper from '../components/layout/PageWrapper'
import { SITE } from '../config/site'
import { WHATSAPP_NUMBERS, buildWhatsAppUrl } from '../config/whatsapp'

/**
 * Política de privacidade (LGPD — Lei 13.709/2018).
 * Descreve o que o site realmente faz: pedidos e agendamentos gravados no
 * banco (Supabase), conversa pelo WhatsApp, carrinho guardado no navegador.
 * Revisar com o responsável antes de publicar — prazos e razão social.
 */
const ATUALIZADO_EM = '30/09/2026'

export default function Privacidade() {
  const contato = buildWhatsAppUrl(
    WHATSAPP_NUMBERS.atendimento,
    'Olá! Quero falar sobre os meus dados pessoais no site do Mercadog.',
  )

  const h2 = 'mt-10 font-display text-2xl font-semibold text-ink'
  const p = 'mt-3 leading-relaxed text-clay'
  const li = 'leading-relaxed text-clay'

  return (
    <PageWrapper title="Política de privacidade">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-display-md font-semibold text-ink">Política de privacidade</h1>
        <p className="mt-2 text-sm text-clay">Atualizada em {ATUALIZADO_EM}</p>

        <p className={p}>
          Esta política explica quais dados pessoais o site do Mercadog coleta, para que servem e como você pode
          pedir para consultar, corrigir ou apagar os seus dados, conforme a Lei Geral de Proteção de Dados (Lei nº
          13.709/2018).
        </p>

        <h2 className={h2}>Quem cuida dos seus dados</h2>
        <p className={p}>
          Mercadog – Comércio de Rações Ltda, CNPJ 11.551.197/0001-73, {SITE.address}. Para qualquer assunto sobre
          seus dados, fale com a gente pelo{' '}
          <a href={contato} target="_blank" rel="noopener noreferrer" className="font-semibold text-terracotta-600 underline underline-offset-4">
            WhatsApp
          </a>{' '}
          ou pelo e-mail{' '}
          <a href={`mailto:${SITE.email}`} className="font-semibold text-terracotta-600 underline underline-offset-4">
            {SITE.email}
          </a>
          .
        </p>

        <h2 className={h2}>O que coletamos e para quê</h2>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
          <li className={li}>
            <strong className="text-ink">Pedidos da farmácia:</strong> nome, telefone, os produtos escolhidos e, se
            você pedir entrega, o endereço. Usamos para separar, confirmar e entregar o pedido.
          </li>
          <li className={li}>
            <strong className="text-ink">Agendamentos de banho e tosa e de consultas:</strong> nome, telefone, nome e
            porte do pet, data, horário e o que você escrever nas observações ou no motivo da consulta. Usamos para
            reservar o horário e preparar o atendimento.
          </li>
          <li className={li}>
            <strong className="text-ink">Conversa no WhatsApp:</strong> quando você envia a mensagem do pedido, a
            conversa passa a seguir as regras de privacidade do próprio WhatsApp.
          </li>
        </ul>
        <p className={p}>
          Não pedimos CPF, dados de cartão ou senha pelo site, e não usamos seus dados para propaganda nem os vendemos
          a ninguém.
        </p>

        <h2 className={h2}>Com quem os dados são compartilhados</h2>
        <p className={p}>
          Só com os serviços que fazem o site funcionar: a hospedagem do site (Vercel) e o banco de dados onde ficam
          os pedidos e agendamentos (Supabase). A página de endereço mostra um mapa do Google Maps, que segue as
          regras de privacidade do Google.
        </p>

        <h2 className={h2}>O que fica no seu navegador</h2>
        <p className={p}>
          O carrinho de compras fica guardado no seu próprio navegador até você finalizar ou esvaziar, para não se
          perder se a página recarregar. Não usamos cookies de rastreamento ou de publicidade.
        </p>

        <h2 className={h2}>Por quanto tempo guardamos</h2>
        <p className={p}>
          Guardamos os pedidos e agendamentos pelo tempo necessário para o atendimento e para cumprir obrigações
          legais e fiscais. Depois disso, os dados são apagados.
        </p>

        <h2 className={h2}>Seus direitos</h2>
        <p className={p}>
          Você pode, a qualquer momento, pedir para saber quais dados seus temos, corrigir dados errados ou pedir que
          sejam apagados — respeitando o que a lei obriga a guardar. É só falar com a gente pelos contatos acima; a
          resposta vem em até 15 dias.
        </p>
      </article>
    </PageWrapper>
  )
}
