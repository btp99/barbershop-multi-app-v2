export const dynamic = "force-dynamic"

import Link from "next/link"
import { getServerCaller } from "@/lib/trpc-server"
import { LegalPage, Section, SubSection, Ul, ExternalLink } from "@/app/_components/LegalPage"

export async function generateMetadata() {
  try {
    const caller = await getServerCaller()
    const barbershops = await caller.barbershop.getAll()
    const name = barbershops[0]?.name ?? "Barbearia"
    return { title: `Política de Cookies — ${name}` }
  } catch {
    return { title: "Política de Cookies" }
  }
}

export default async function CookiesPage() {
  let name = "Barbearia"
  try {
    const caller = await getServerCaller()
    const barbershops = await caller.barbershop.getAll()
    name = barbershops[0]?.name ?? "Barbearia"
  } catch {
    // use default
  }
  const year = new Date().getFullYear()

  return (
    <LegalPage title="Política de Cookies">
      <p className="text-muted-foreground text-sm">
        Última atualização: {new Date().toLocaleDateString("pt-PT")}
      </p>

      <Section title="1. O que são Cookies?">
        <p>
          Cookies são pequenos ficheiros de texto armazenados no seu dispositivo quando visita um sítio web.
          São utilizados para fazer funcionar os sítios web de forma eficiente e para fornecer informações aos proprietários do sítio.
        </p>
      </Section>

      <Section title="2. Como Utilizamos Cookies">
        <SubSection title="2.1 Cookies Estritamente Necessários">
          <p>Indispensáveis para o funcionamento do sítio web e não podem ser desativados:</p>
          <Ul>
            <li><strong className="text-foreground">Sessão de utilizador</strong> — mantém a sessão autenticada durante a navegação.</li>
            <li><strong className="text-foreground">Token CSRF</strong> — protege contra ataques de falsificação de pedidos entre sítios.</li>
          </Ul>
        </SubSection>

        <SubSection title="2.2 Cookies Funcionais">
          <Ul>
            <li><strong className="text-foreground">Preferências de tema</strong> — guarda a preferência de modo claro/escuro, quando aplicável.</li>
          </Ul>
        </SubSection>

        <SubSection title="2.3 Cookies de Terceiros — Google OAuth">
          <p>
            Ao iniciar sessão através da Google, a Google pode definir os seus próprios cookies para autenticação e segurança. Estão sujeitos à{" "}
            <ExternalLink href="https://policies.google.com/privacy">Política de Privacidade da Google</ExternalLink>.
            Não controlamos a utilização que a Google faz desses cookies.
          </p>
        </SubSection>
      </Section>

      <Section title="3. Cookies Utilizados">
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Nome</th>
                <th className="px-4 py-2 text-left font-medium">Tipo</th>
                <th className="px-4 py-2 text-left font-medium">Duração</th>
                <th className="px-4 py-2 text-left font-medium">Finalidade</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-4 py-2 font-mono text-xs">next-auth.session-token</td>
                <td className="px-4 py-2">Necessário</td>
                <td className="px-4 py-2">30 dias</td>
                <td className="px-4 py-2">Autenticação do utilizador</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">next-auth.csrf-token</td>
                <td className="px-4 py-2">Necessário</td>
                <td className="px-4 py-2">Sessão</td>
                <td className="px-4 py-2">Proteção CSRF</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">next-auth.callback-url</td>
                <td className="px-4 py-2">Necessário</td>
                <td className="px-4 py-2">Sessão</td>
                <td className="px-4 py-2">Redirecionamento pós-autenticação</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="4. Não Utilizamos Cookies de Rastreio">
        <p>
          <strong className="text-foreground">{name}</strong> não utiliza atualmente cookies de publicidade, rastreio comportamental ou análise
          de terceiros (como Google Analytics ou Meta Pixel). Caso tal se altere, esta política será atualizada e será solicitado o seu
          consentimento, nos termos do art.º 5.º da Lei n.º 41/2004 (alterada pela Lei n.º 46/2012).
        </p>
      </Section>

      <Section title="5. Como Gerir os Cookies">
        <p>
          Pode controlar e/ou eliminar cookies através das definições do seu navegador. Tenha em atenção que a desativação de cookies necessários
          pode impedir o correto funcionamento do Serviço, nomeadamente a autenticação e o agendamento.
        </p>
        <p>Instruções para os principais navegadores:</p>
        <Ul>
          <li><ExternalLink href="https://support.google.com/chrome/answer/95647">Google Chrome</ExternalLink></li>
          <li><ExternalLink href="https://support.mozilla.org/pt-PT/kb/cookies-information-websites-store-on-your-computer">Mozilla Firefox</ExternalLink></li>
          <li><ExternalLink href="https://support.apple.com/pt-pt/guide/safari/sfri11471/mac">Safari</ExternalLink></li>
          <li><ExternalLink href="https://support.microsoft.com/pt-pt/microsoft-edge/eliminar-cookies-no-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09">Microsoft Edge</ExternalLink></li>
        </Ul>
      </Section>

      <Section title="6. Mais Informações">
        <p>
          Para informações sobre o tratamento de dados pessoais, consulte a nossa{" "}
          <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
          Em caso de dúvidas, contacte-nos através dos meios indicados no sítio web.
        </p>
      </Section>

      <p className="text-muted-foreground text-xs">© {year} {name}. Todos os direitos reservados.</p>
    </LegalPage>
  )
}
