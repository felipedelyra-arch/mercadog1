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
 * O site abre na hora — com a cópia guardada no navegador ou, na primeira
 * visita, com os valores de reserva do código — e confere o banco por trás;
 * se algo mudou, redesenha uma vez com os dados novos. Esperar o banco antes
 * de desenhar deixava a tela em branco no 4G.
 */
const cached = readCachedSiteConfig()
if (cached) applySiteConfig(cached)
render('site')

fetchSiteConfig()
  .then((dados) => {
    if (!dados) return
    cacheSiteConfig(dados)
    if (JSON.stringify(dados) === JSON.stringify(cached)) return
    applySiteConfig(dados)
    // já na tela com dados antigos: remonta para todos os componentes lerem os novos
    render('site-atualizado')
  })
  .catch(() => {})
