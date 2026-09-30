import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/nunito-sans'
import './index.css'
import App from './App.jsx'
import {
  applySiteConfig,
  cacheSiteConfig,
  fetchSiteConfig,
  readCachedSiteConfig,
} from './config/siteConfig'

const root = createRoot(document.getElementById('root'))
const render = (key) =>
  root.render(
    <StrictMode>
      <App key={key} />
    </StrictMode>,
  )

/*
 * Dados da loja (endereço, telefones, WhatsApp) vêm do painel.
 * - Com cópia guardada no navegador: mostra o site na hora com ela e confere
 *   o banco por trás; se algo mudou, redesenha uma vez com os dados novos.
 * - Primeira visita: espera o banco até 2,5 s; se demorar, abre com os
 *   valores de reserva do código e aplica os do banco quando chegarem.
 */
const cached = readCachedSiteConfig()
let rendered = false

if (cached) {
  applySiteConfig(cached)
  render('site')
  rendered = true
}

const fresh = fetchSiteConfig()
  .then((dados) => {
    if (!dados) return
    cacheSiteConfig(dados)
    if (JSON.stringify(dados) === JSON.stringify(cached)) return
    applySiteConfig(dados)
    // já na tela com dados antigos: remonta para todos os componentes lerem os novos
    if (rendered) render('site-atualizado')
  })
  .catch(() => {})

if (!rendered) {
  Promise.race([fresh, new Promise((resolve) => setTimeout(resolve, 2500))]).then(() => {
    if (rendered) return
    rendered = true
    render('site')
  })
}
