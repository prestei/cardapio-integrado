import { useState } from 'react'
import { Mail, MessageCircle, ChevronDown, BookOpen, LifeBuoy } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const FAQS = [
  {
    question: 'Como cadastro um novo produto no cardápio?',
    answer:
      'Acesse "Produtos" no menu lateral, clique em "Novo produto" e preencha nome, categoria, preço e demais informações. Você pode adicionar uma imagem e definir se o produto está em destaque.',
  },
  {
    question: 'Como configuro grupos de adicionais para um produto?',
    answer:
      'Vá em "Adicionais", crie um grupo definindo o tipo de seleção (única ou múltipla), quantidade mínima/máxima e cadastre as opções. Depois, use "Produtos" no grupo para vincular quais itens do cardápio usarão aquele grupo.',
  },
  {
    question: 'Como configuro taxa e regras de delivery?',
    answer:
      'Em "Configurações" você define se aceita delivery, pedido mínimo, taxa fixa ou por zona, frete grátis acima de um valor e o raio máximo de entrega.',
  },
  {
    question: 'Como acompanho pedidos de delivery em andamento?',
    answer:
      'Em "Pedidos" você vê todos os pedidos, inclusive delivery, e pode atualizar o status até a conclusão.',
  },
  {
    question: 'Como gero um QR Code para as mesas do meu estabelecimento?',
    answer:
      'Acesse "QR Codes", clique em "Novo QR Code", selecione o tipo "Mesa" e informe a identificação. O QR Code gerado pode ser baixado ou impresso diretamente pela plataforma.',
  },
  {
    question: 'Como altero o link do meu cardápio público?',
    answer:
      'Em "Configurações" → "Domínio" você pode editar o slug do seu estabelecimento, que define a URL do seu cardápio público. Use o botão de copiar para compartilhar o link facilmente.',
  },
  {
    question: 'Esqueci minha senha, o que faço?',
    answer:
      'Na tela de login, clique em "Esqueci minha senha" e siga as instruções enviadas por e-mail para redefinir seu acesso.',
  },
]

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-text">{question}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && <p className="pb-4 text-sm text-muted">{answer}</p>}
    </div>
  )
}

export function SupportPage() {
  return (
    <div>
      <PageHeader
        title="Suporte"
        description="Central de ajuda e contato"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 lg:col-span-2">
          <div className="mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-accent" />
            <h3 className="font-display text-lg font-medium text-text">Perguntas frequentes</h3>
          </div>
          <p className="mb-2 text-sm text-muted">
            Encontre respostas rápidas para as dúvidas mais comuns sobre a plataforma.
          </p>
          <div>
            {FAQS.map((faq) => (
              <FaqItem key={faq.question} {...faq} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <div className="mb-3 flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-accent" />
              <h3 className="font-medium text-text">Precisa de mais ajuda?</h3>
            </div>
            <p className="mb-4 text-sm text-muted">
              Nossa equipe de suporte está disponível para ajudar com qualquer dúvida ou problema.
            </p>
            <div className="space-y-2">
              <a href="mailto:suporte@cardapio.app">
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4" />
                  suporte@cardapio.app
                </Button>
              </a>
              <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="h-4 w-4" />
                  Falar no WhatsApp
                </Button>
              </a>
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <h3 className="mb-2 font-medium text-text">Documentação</h3>
            <p className="mb-4 text-sm text-muted">
              Consulte guias detalhados sobre como configurar seu estabelecimento e aproveitar
              todos os recursos da plataforma.
            </p>
            <a href="https://docs.cardapio.app" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" className="w-full justify-start">
                Acessar central de documentação
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
