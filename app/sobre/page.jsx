import { BookOpen, Leaf } from 'lucide-react';
import { G } from '@/lib/api';

export const metadata = {
  title: 'Sobre — Herança Verde',
  description: 'Conheça o projeto Herança Verde e seus objetivos.',
};

export default function SobrePage() {
  return (
    <div className={`${G.section} py-14 max-w-2xl`}>
      <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold mb-5">
        <BookOpen className="h-3 w-3" />Sobre
      </div>
      <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-8">Sobre o Projeto</h1>

      <div className="space-y-5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
        <p className="text-base text-zinc-600 dark:text-zinc-300">
          O <strong className="font-bold text-zinc-900 dark:text-zinc-50">Herança Verde</strong> é uma iniciativa de
          estudantes do Liceu de Messejana, em Fortaleza/CE, dedicada a catalogar e divulgar o patrimônio
          botânico vivo da nossa escola.
        </p>
        <p>
          Cada espécie cadastrada nesta plataforma é parte da história da escola. Ao identificar, fotografar e
          descrever as plantas que compõem nosso ambiente, buscamos despertar nos estudantes e na comunidade
          a consciência sobre a importância da biodiversidade urbana.
        </p>

        <div className="mt-8 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Objetivos</p>
          <ul className="space-y-3">
            {[
              'Identificar e catalogar todas as espécies vegetais do campus',
              'Documentar com fotografias e descrições detalhadas',
              'Servir como recurso educacional para alunos e professores',
              'Estimular o cuidado e a preservação do verde escolar',
            ].map((obj, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0 mt-0.5">
                  <Leaf className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-zinc-600 dark:text-zinc-300">{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Como contribuir</p>
          <p>
            Estudantes, professores e pesquisadores interessados em colaborar podem entrar em contato com a
            coordenação do projeto através da <a href="/equipe" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">página de equipe</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
