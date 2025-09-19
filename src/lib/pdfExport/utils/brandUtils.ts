export interface SenturiBrand {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoPath: string
  // Optional decorative image for the report cover. Should live under public/branding
  coverImagePath?: string
  fonts: {
    title: string
    body: string
  }
}

export const SENTURI_BRAND: SenturiBrand = {
  primaryColor: '#0D249B',
  secondaryColor: '#1A365D',
  accentColor: '#3182CE',
  logoPath: '/logo_senturi_modo_clarao.png',
  // If you add a PNG at public/branding/report-cover.png it will be used automatically
  coverImagePath: '/branding/report-cover.png',
  fonts: {
    title: 'helvetica',
    body: 'helvetica'
  }
}

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const cleanHex = hex.replace('#', '')
  const bigint = parseInt(cleanHex, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return { r, g, b }
}

export const brandTextColor = (hexBackground: string): { r: number; g: number; b: number } => {
  const { r, g, b } = hexToRgb(hexBackground)
  // Luminance approximation
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b
  return luminance > 186 ? { r: 26, g: 32, b: 44 } : { r: 255, g: 255, b: 255 }
}



