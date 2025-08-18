declare module 'react-gauge-chart' {
  import { ComponentType } from 'react'
  
  interface GaugeChartProps {
    id?: string
    nrOfLevels?: number
    colors?: string[]
    percent?: number
    arcWidth?: number
    textColor?: string
    hideText?: boolean
    needleColor?: string
    needleBaseColor?: string
    formatTextValue?: (value: number) => string
    style?: React.CSSProperties
    arcsLength?: number[]
    arcPadding?: number
    cornerRadius?: number
  }
  
  const GaugeChart: ComponentType<GaugeChartProps>
  export default GaugeChart
}
