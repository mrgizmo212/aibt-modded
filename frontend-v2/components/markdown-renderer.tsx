"use client"

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from './ui/button'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight, rehypeRaw]}
      className={`prose prose-invert max-w-none ${className}`}
      components={{
        // Code blocks with copy button
        code: ({ node, inline, className, children, ...props }: any) => {
          const [copied, setCopied] = useState(false)
          const match = /language-(\w+)/.exec(className || '')
          const language = match ? match[1] : ''
          const codeContent = String(children).replace(/\n$/, '')
          
          const handleCopy = async () => {
            await navigator.clipboard.writeText(codeContent)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }
          
          if (!inline && language) {
            return (
              <div className="relative group">
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopy}
                    className="h-8 px-2 bg-[#262626] hover:bg-[#404040] text-white"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <code className={className} {...props}>
                  {children}
                </code>
              </div>
            )
          }
          
          // Inline code
          return (
            <code className="bg-[#262626] px-1.5 py-0.5 rounded text-sm" {...props}>
              {children}
            </code>
          )
        },
        
        // Custom link styling
        a: ({ node, children, ...props }: any) => (
          <a
            {...props}
            className="text-blue-400 hover:text-blue-300 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        
        // Custom list styling
        ul: ({ node, children, ...props }: any) => (
          <ul className="list-disc list-inside space-y-1 my-2" {...props}>
            {children}
          </ul>
        ),
        
        ol: ({ node, children, ...props }: any) => (
          <ol className="list-decimal list-inside space-y-1 my-2" {...props}>
            {children}
          </ol>
        ),
        
        // Headings
        h1: ({ node, children, ...props }: any) => (
          <h1 className="text-2xl font-bold mt-4 mb-2" {...props}>{children}</h1>
        ),
        h2: ({ node, children, ...props }: any) => (
          <h2 className="text-xl font-bold mt-3 mb-2" {...props}>{children}</h2>
        ),
        h3: ({ node, children, ...props }: any) => (
          <h3 className="text-lg font-bold mt-2 mb-1" {...props}>{children}</h3>
        ),
        
        // Tables
        table: ({ node, children, ...props }: any) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full border border-[#262626]" {...props}>
              {children}
            </table>
          </div>
        ),
        
        th: ({ node, children, ...props }: any) => (
          <th className="border border-[#262626] px-4 py-2 bg-[#1a1a1a] font-semibold" {...props}>
            {children}
          </th>
        ),
        
        td: ({ node, children, ...props }: any) => (
          <td className="border border-[#262626] px-4 py-2" {...props}>
            {children}
          </td>
        ),
        
        // Blockquotes
        blockquote: ({ node, children, ...props }: any) => (
          <blockquote className="border-l-4 border-blue-500 pl-4 italic my-2" {...props}>
            {children}
          </blockquote>
        ),
        
        // Paragraphs
        p: ({ node, children, ...props }: any) => (
          <p className="my-2 leading-relaxed" {...props}>{children}</p>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

