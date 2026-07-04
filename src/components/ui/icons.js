/**
 * Mapa de ícones referenciados por nome nos mocks (e futuramente pela API,
 * que devolverá apenas a string). Importa só o que é usado — tree-shaking ok.
 */
import {
  Bath,
  Beef,
  Bone,
  Cross,
  Droplets,
  HeartPulse,
  PawPrint,
  Scissors,
  Smile,
  Sparkles,
  Stethoscope,
  Syringe,
  Tag,
  ToyBrick,
} from 'lucide-react'

const ICONS = {
  Bath,
  Beef,
  Bone,
  Cross,
  Droplets,
  HeartPulse,
  PawPrint,
  Scissors,
  Smile,
  Sparkles,
  Stethoscope,
  Syringe,
  Tag,
  ToyBrick,
}

/** Devolve o componente de ícone pelo nome, com PawPrint como fallback. */
export const getIcon = (name) => ICONS[name] ?? PawPrint
