export const dynamic = "force-dynamic"

import Link from "next/link"
import { getServerCaller } from "@/lib/trpc-server"
import { LegalPage, Section, Ul, ExternalLink } from "@/app/_components/LegalPage"

export async function generateMetadata() {
  try {
    const caller = await getServerCaller()
    const barbershops = await caller.barbershop.getAll()
    const name = barbershops[0]?.name ?? "Barbearia"
    return { title: `Política de Privacidade — ${name}` }
  } catch {
    return { title: "Política de Privacidade" }
  }
}

export default async function PrivacidadePage() {
  let name = "Barbearia"
  let address = ""
  try {
    const caller = await getServerCaller()
    const barbershops = await caller.barbershop.getAll()
    const b = barbershops[0]
    if (b) { name = b.name; address = b.address }
  } catch {
    // use defaults
  }
  const year = new Date().getFullYear()

  return (
    <LegalPage title="Política de Privacidade">
      <p className="text-muted-foreground text-sm">
        Última atualização: {new Date().toLocaleDateString("pt-PT")}
      </p>

      <Section title="1. Responsável pelo Tratamento">
        <p>
          <strong className="text-foreground">{name}</strong>, com sede em {address}, é o responsável pelo tratamento dos dados pessoais
          recolhidos através deste sítio web, nos termos do Regulamento (UE) 2016/679 (RGPD) e da legislação nacional aplicável.
        </p>
      </Section>

      <Section title="2. Dados Pessoais Recolhidos">
        <p>Ao utilizar o serviço de agendamento, podemos recolher:</p>
        <Ul>
          <li><strong className="text-foreground">Dados de identificação:</strong> nome completo e endereço de correio eletrónico, fornecidos pela autenticação Google.</li>
          <li><strong className="text-foreground">Imagem de perfil:</strong> fotografia associada à conta Google, para personalizar a experiência.</li>
          <li><strong className="text-foreground">Dados de agendamento:</strong> serviços selecionados, data, hora e notas do agendamento.</li>
          <li><strong className="text-foreground">Avaliações:</strong> classificações e comentários voluntariamente submetidos.</li>
          <li><strong className="text-foreground">Dados de sessão:</strong> tokens de autenticação armazenados em base de dados.</li>
        </Ul>
      </Section>

      <Section title="3. Finalidades e Base Legal">
        <Ul>
          <li><strong className="text-foreground">Gestão de agendamentos</strong> — execução do contrato (art.º 6.º, n.º 1, al. b) do RGPD).</li>
          <li><strong className="text-foreground">Autenticação e segurança</strong> — interesse legítimo (art.º 6.º, n.º 1, al. f) do RGPD).</li>
          <li><strong className="text-foreground">Avaliações e melhoria do serviço</strong> — consentimento do titular (art.º 6.º, n.º 1, al. a) do RGPD).</li>
        </Ul>
      </Section>

      <Section title="4. Prazo de Conservação">
        <Ul>
          <li>Dados de conta e sessão: enquanto a conta estiver ativa.</li>
          <li>Histórico de agendamentos: 3 anos após a data do agendamento.</li>
          <li>Avaliações: enquanto publicamente visíveis, removíveis a pedido.</li>
        </Ul>
      </Section>

      <Section title="5. Partilha de Dados">
        <p>Os dados pessoais não são vendidos nem cedidos a terceiros para fins comerciais. Podem ser partilhados com:</p>
        <Ul>
          <li>
            <strong className="text-foreground">Google LLC</strong> — no âmbito da autenticação Google OAuth, sujeita à{" "}
            <ExternalLink href="https://policies.google.com/privacy">Política de Privacidade da Google</ExternalLink>.
          </li>
          <li><strong className="text-foreground">Prestadores de alojamento</strong> — para operação da infraestrutura técnica, vinculados por acordos de tratamento de dados.</li>
        </Ul>
      </Section>

      <Section title="6. Direitos do Titular dos Dados">
        <p>Nos termos do RGPD, tem direito a:</p>
        <Ul>
          <li><strong className="text-foreground">Acesso</strong> — obter confirmação e cópia dos dados tratados.</li>
          <li><strong className="text-foreground">Retificação</strong> — corrigir dados inexatos ou incompletos.</li>
          <li><strong className="text-foreground">Apagamento</strong> — eliminar dados quando não seja necessária a sua conservação.</li>
          <li><strong className="text-foreground">Limitação do tratamento</strong> — restringir o tratamento em determinadas circunstâncias.</li>
          <li><strong className="text-foreground">Portabilidade</strong> — receber os dados em formato estruturado e legível por máquina.</li>
          <li><strong className="text-foreground">Oposição</strong> — opor-se ao tratamento baseado em interesse legítimo.</li>
        </Ul>
        <p>
          Para exercer estes direitos, contacte-nos através dos meios indicados no sítio web. Tem ainda o direito de apresentar reclamação à{" "}
          <ExternalLink href="https://www.cnpd.pt">Comissão Nacional de Proteção de Dados (CNPD)</ExternalLink>.
        </p>
      </Section>

      <Section title="7. Segurança">
        <p>
          Adotamos medidas técnicas e organizativas adequadas para proteger os dados pessoais contra acesso não autorizado, perda acidental ou
          destruição, em conformidade com o art.º 32.º do RGPD.
        </p>
      </Section>

      <Section title="8. Cookies">
        <p>
          Este sítio web utiliza cookies. Consulte a nossa{" "}
          <Link href="/cookies" className="text-primary hover:underline">Política de Cookies</Link>.
        </p>
      </Section>

      <Section title="9. Código-fonte Aberto">
        <p>
          Esta plataforma é desenvolvida com base no projeto de código aberto{" "}
          <ExternalLink href="https://github.com/LuanPaD/BarberLab">BarberLab</ExternalLink>, disponível sob licença MIT.
          A utilização do código-fonte não implica qualquer transferência de dados para o repositório original.
        </p>
      </Section>

      <Section title="10. Alterações a Esta Política">
        <p>
          Reservamo-nos o direito de atualizar esta Política de Privacidade. Qualquer alteração será publicada nesta página com indicação da data de revisão.
        </p>
      </Section>

      <p className="text-muted-foreground text-xs">© {year} {name}. Todos os direitos reservados.</p>
    </LegalPage>
  )
}
