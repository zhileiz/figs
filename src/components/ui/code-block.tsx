import * as shiki from 'shiki'
import { useEffect, useState } from 'react'

interface CodeBlockProps {
  code: string
  language?: string
}

export default function CodeBlock({ code, language = 'cypher' }: CodeBlockProps) {
  const [html, setHtml] = useState<string>('')

  useEffect(() => {
    const highlight = async () => {
      const highlighter = await shiki.createHighlighter({
        themes: ['aurora-x' as const],
        langs: [language],
      })
      const highlighted = await highlighter.codeToHtml(code, { 
        lang: language,
        theme: 'aurora-x'
      })
      setHtml(highlighted)
    }
    highlight()
  }, [code, language])

  return (
    <div 
      className="rounded-md bg-black p-4 overflow-auto text-sm font-mono"
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  )
} 