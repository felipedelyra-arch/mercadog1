/**
 * Mapa de ícones referenciados por nome nos mocks e no banco (a coluna
 * `categorias.icon` guarda só a string). Importa só o que é usado — tree-shaking ok.
 */
import {
  AudioWaveform,
  Bandage,
  Bath,
  Beef,
  Bone,
  Bug,
  Cross,
  Droplets,
  Ear,
  Eye,
  Flower2,
  HeartPulse,
  PawPrint,
  Pill,
  Radiation,
  Scan,
  Scissors,
  ShieldPlus,
  ShowerHead,
  Smile,
  Sparkles,
  Stethoscope,
  Syringe,
  Tablets,
  Tag,
  ToyBrick,
} from 'lucide-react'

const ICONS = {
  AudioWaveform,
  Bandage,
  Bath,
  Beef,
  Bone,
  Bug,
  Cross,
  Droplets,
  Ear,
  Eye,
  Flower2,
  HeartPulse,
  PawPrint,
  Pill,
  Radiation,
  Scan,
  Scissors,
  ShieldPlus,
  ShowerHead,
  Smile,
  Sparkles,
  Stethoscope,
  Syringe,
  Tablets,
  Tag,
  ToyBrick,
}

/** Devolve o componente de ícone pelo nome, com PawPrint como fallback. */
export const getIcon = (name) => ICONS[name] ?? PawPrint
