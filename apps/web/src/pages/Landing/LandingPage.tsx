import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Code2,
  Link2,
  Mail,
  Package,
  ShieldCheck,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/http';
import { Button } from '../../components/ui/Button';
import { Reveal } from '../../components/ui/Reveal';
import { useAuth } from '../../hooks/useAuth';
import { DashboardPreview } from './DashboardPreview';

const GITHUB_URL = 'https://github.com/cfilipe947/kitanda';
const LINKEDIN_URL = 'https://linkedin.com/in/cesénio-filipe-003b78319';
const EMAIL = 'wagnerfilipe997@gmail.com';

function useDemoLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startDemo() {
    setError(null);
    setIsLoading(true);
    try {
      const user = await login('admin@kitanda.ao', 'admin123');
      navigate(user.role === 'ADMIN' ? '/app' : '/app/sales/new');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível abrir a demonstração agora.');
    } finally {
      setIsLoading(false);
    }
  }

  return { startDemo, isLoading, error };
}

function Navbar({ onDemo, isDemoLoading }: { onDemo: () => void; isDemoLoading: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <span className="font-heading text-xl font-semibold text-green-800">Kitanda</span>
        <nav aria-label="Secções da página" className="hidden items-center gap-6 text-sm font-medium text-neutral-600 lg:flex">
          <a href="#funcionalidades" className="hover:text-green-700">
            Funcionalidades
          </a>
          <a href="#como-funciona" className="hover:text-green-700">
            Como funciona
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
          <Button size="sm" onClick={onDemo} isLoading={isDemoLoading}>
            Ver demonstração
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero({ onDemo, isDemoLoading, error }: { onDemo: () => void; isDemoLoading: boolean; error: string | null }) {
  return (
    <section className="overflow-hidden bg-gradient-to-b from-green-50 to-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
        <Reveal>
          <h1 className="font-heading text-4xl font-semibold leading-tight text-neutral-900 sm:text-5xl">
            Não percas mais nenhuma venda por falta de stock.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-neutral-600">
            O Kitanda substitui o caderno de vendas de lojas, cantinas e mini-mercados por um sistema simples: produtos,
            stock e vendas num só lugar, com alertas antes de um produto acabar.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={onDemo} isLoading={isDemoLoading}>
              Experimentar a demo
            </Button>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <Button size="lg" variant="secondary" leftIcon={<Code2 className="h-4 w-4" />}>
                Ver código no GitHub
              </Button>
            </a>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-danger-600">
              {error}
            </p>
          )}
          <p className="mt-3 text-sm text-neutral-500">Entra com o utilizador de demonstração — sem registo.</p>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-2 shadow-soft-lg">
            <div className="flex items-center gap-1.5 rounded-t-lg bg-neutral-100 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-danger-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="ml-3 truncate text-xs text-neutral-400">kitanda.ao/app</span>
            </div>
            <div className="p-2">
              <DashboardPreview />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const painPoints = [
  {
    icon: AlertTriangle,
    problem: 'O produto acaba e só descobres quando o cliente já está à espera.',
    solution: 'Alertas de stock baixo em tempo real, com limite mínimo por produto.',
  },
  {
    icon: ClipboardList,
    problem: 'As vendas ficam num caderno, difíceis de somar e fáceis de perder.',
    solution: 'Cada venda fica registada em segundos, com histórico completo e por data.',
  },
  {
    icon: BarChart3,
    problem: 'Não sabes ao certo o que vende mais nem quanto ganhaste no mês.',
    solution: 'Painel com vendas do dia, do mês e os produtos mais vendidos.',
  },
];

function ProblemSolution() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8 lg:py-24">
      <Reveal>
        <h2 className="text-center font-heading text-3xl font-semibold text-neutral-900">
          Problemas reais de quem gere uma loja pequena
        </h2>
      </Reveal>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {painPoints.map((item, index) => (
          <Reveal key={item.problem} delayMs={index * 100}>
            <div className="h-full rounded-xl border border-neutral-200 bg-white p-6 shadow-soft">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-50 text-danger-500">
                <item.icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm text-neutral-500">{item.problem}</p>
              <div className="my-4 h-px bg-neutral-100" />
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-700">
                <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-medium text-neutral-800">{item.solution}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const features = [
  {
    icon: Package,
    title: 'Stock com alertas',
    description: 'Define um mínimo por produto e sabe sempre o que está a acabar, antes de perderes a venda.',
  },
  {
    icon: Wallet,
    title: 'Vendas em segundos',
    description: 'Pesquisa o produto, adiciona ao carrinho e confirma com Dinheiro, Multicaixa ou Transferência.',
  },
  {
    icon: BarChart3,
    title: 'Painel com gráficos',
    description: 'Vendas de hoje, do mês, evolução dos últimos 30 dias e os 5 produtos mais vendidos.',
  },
  {
    icon: ShieldCheck,
    title: 'Papéis admin/vendedor',
    description: 'O dono gere produtos, preços e utilizadores. O vendedor só regista vendas e consulta stock.',
  },
];

function Features() {
  return (
    <section id="funcionalidades" className="bg-neutral-50 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <Reveal>
          <h2 className="text-center font-heading text-3xl font-semibold text-neutral-900">O que o Kitanda faz por ti</h2>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delayMs={index * 80}>
              <div className="h-full rounded-xl border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-soft">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <feature.icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold text-neutral-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{feature.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { title: 'Regista os teus produtos', description: 'Nome, SKU, preço, categoria e stock mínimo. Em poucos minutos.' },
  { title: 'Vende em segundos', description: 'Pesquisa, adiciona ao carrinho, escolhe o pagamento e confirma.' },
  { title: 'Acompanha o painel', description: 'Vê o que vendeste, o que está a acabar e o que vende mais.' },
];

function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-16 lg:px-8 lg:py-24">
      <Reveal>
        <h2 className="text-center font-heading text-3xl font-semibold text-neutral-900">Como funciona</h2>
      </Reveal>
      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        {steps.map((step, index) => (
          <Reveal key={step.title} delayMs={index * 100}>
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-600 font-heading text-lg font-semibold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold text-neutral-900">{step.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{step.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function MobileSection() {
  return (
    <section className="bg-green-900 py-16 text-white lg:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2 lg:px-8">
        <Reveal>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Smartphone aria-hidden="true" className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-heading text-3xl font-semibold">Feito para o telemóvel</h2>
          <p className="mt-4 max-w-md text-green-100">
            A maior parte das vendas numa loja pequena acontece em pé, ao balcão. O Kitanda funciona bem a partir de
            360px de largura, com uma barra de navegação pensada para o polegar.
          </p>
        </Reveal>
        <Reveal delayMs={120}>
          <div className="mx-auto w-48 rounded-[2rem] border-4 border-neutral-900 bg-neutral-900 p-2 shadow-soft-lg">
            <div className="h-[150px] overflow-hidden rounded-[1.5rem] bg-white">
              <div className="w-[320px] origin-top-left scale-[0.49] p-1.5">
                <DashboardPreview />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function CtaFooter({ onDemo, isDemoLoading }: { onDemo: () => void; isDemoLoading: boolean }) {
  return (
    <>
      <section className="bg-green-50 py-16 text-center lg:py-20">
        <Reveal className="mx-auto max-w-2xl px-4">
          <h2 className="font-heading text-3xl font-semibold text-neutral-900">
            Pronto para ver o Kitanda a resolver isto?
          </h2>
          <p className="mt-3 text-neutral-600">
            Entra com o utilizador de demonstração e explora o painel, os produtos e o registo de uma venda.
          </p>
          <div className="mt-6 flex justify-center">
            <Button size="lg" onClick={onDemo} isLoading={isDemoLoading}>
              Experimentar a demo
            </Button>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-neutral-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center lg:flex-row lg:justify-between lg:px-8 lg:text-left">
          <div>
            <p className="font-heading text-lg font-semibold text-green-800">Kitanda</p>
            <p className="mt-1 text-sm text-neutral-500">Feito por Cesénio Filipe.</p>
          </div>
          <div className="flex items-center gap-4 text-neutral-500">
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn de Cesénio Filipe"
              className="transition-colors hover:text-green-700"
            >
              <Link2 aria-hidden="true" className="h-5 w-5" />
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Repositório do Kitanda no GitHub"
              className="transition-colors hover:text-green-700"
            >
              <Code2 aria-hidden="true" className="h-5 w-5" />
            </a>
            <a href={`mailto:${EMAIL}`} aria-label="Enviar email" className="transition-colors hover:text-green-700">
              <Mail aria-hidden="true" className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

export function LandingPage() {
  const { startDemo, isLoading, error } = useDemoLogin();

  return (
    <div className="font-sans text-neutral-800">
      <Navbar onDemo={startDemo} isDemoLoading={isLoading} />
      <main>
        <Hero onDemo={startDemo} isDemoLoading={isLoading} error={error} />
        <ProblemSolution />
        <Features />
        <HowItWorks />
        <MobileSection />
      </main>
      <CtaFooter onDemo={startDemo} isDemoLoading={isLoading} />
    </div>
  );
}
