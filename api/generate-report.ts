import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { empresa = '', setor = '', dataInicio = '', dataFim = '', title = 'Relatório Senturi' } = (req.query || {}) as Record<string, string>

  try {
    // Lazy import to reduce cold start and handle ESM default
    const chromiumMod = await import('@sparticuz/chromium')
    const chromium: any = (chromiumMod as any).default || chromiumMod
    const puppeteerMod = await import('puppeteer-core')
    const puppeteer: any = (puppeteerMod as any).default || puppeteerMod

    const host = (req.headers['x-forwarded-host'] as string) || (req.headers.host as string)
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
    const baseUrl = `${proto}://${host}`
    const params = new URLSearchParams({ empresa, setor, dataInicio, dataFim, title })
    const targetUrl = `${baseUrl}/report/print?${params.toString()}`

    const executablePath = await chromium.executablePath()
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 900 },
      executablePath,
      headless: 'new'
    })
    const page = await browser.newPage()
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 120000 })

    // wait for page to signal it's ready
    await page.waitForFunction('window.__REPORT_READY__ === true', { timeout: 60000 })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
    })

    await browser.close()

    const filename = `Relatorio-Senturi-${Date.now()}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.status(200).send(Buffer.from(pdf))
  } catch (err: any) {
    console.error('Failed to generate report:', err)
    res.status(500).json({ error: 'Falha ao gerar relatório no servidor.' })
  }
}


