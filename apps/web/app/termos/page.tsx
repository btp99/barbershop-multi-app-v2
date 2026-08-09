export const dynamic = "force-dynamic"

import Link from "next/link"
import { getServerCaller } from "@/lib/trpc-server"
import { LegalPage, Section, Ul, ExternalLink } from "@/app/_components/LegalPage"

export async function generateMetadata() {
  try {
    const caller = await getServerCaller()
    const barbershops = await caller.barbershop.getAll()
    const name = barbershops[0]?.name ?? "Barbearia"
    return { title: `Termos e Condições — ${name}` }
  } catch {
    return { title: "Termos e Condições" }
  }
}

export default async function TermosPage() {
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
    <LegalPage title="Termos e Condições">
      <p className="text-muted-foreground text-sm">
        Última atualização: {new Date().toLocaleDateString("pt-PT")}
      </p>

      <Section title="1. Identificação do Prestador">
        <p>
          <strong className="text-foreground">{name}</strong>, com sede em {address}, disponibiliza o presente serviço de agendamento online («o
          Serviço»). Ao utilizá-lo, declara ter lido e aceite estes Termos e Condições.
        </p>
      </Section>

      <Section title="2. Descrição do Serviço">
        <p>
          O Serviço permite consultar serviços disponíveis, verificar disponibilidade e efetuar agendamentos online para a barbearia {name}.
          O acesso requer autenticação através de conta Google válida.
        </p>
      </Section>

      <Section title="3. Registo e Conta">
        <p>
          O utilizador acede através do Google OAuth. É responsável pela veracidade das informações associadas à sua conta.
          A {name} não tem acesso às credenciais das contas Google.
        </p>
      </Section>

      <Section title="4. Agendamentos">
        <Ul>
          <li>O agendamento constitui uma reserva sujeita a confirmação pelo estabelecimento.</li>
          <li>Recomenda-se a chegada pontual. Atrasos superiores a 10 minutos poderão resultar na perda do agendamento sem direito a reembolso.</li>
          <li>A {name} reserva-se o direito de cancelar ou reagendar marcações em caso de circunstâncias imprevistas, notificando o utilizador com brevidade.</li>
        </Ul>
      </Section>

      <Section title="5. Cancelamentos">
        <p>
          O utilizador pode cancelar um agendamento diretamente na plataforma. Recomenda-se que o cancelamento seja efetuado com pelo menos 2 horas
          de antecedência. Cancelamentos reiterados de última hora podem, a critério da {name}, implicar a suspensão do acesso ao Serviço.
        </p>
      </Section>

      <Section title="6. Preços e Pagamentos">
        <p>
          Os preços apresentados incluem IVA à taxa legal em vigor. O pagamento é efetuado presencialmente no estabelecimento, salvo indicação em
          contrário. Os preços podem ser alterados sem aviso prévio; aplica-se o preço vigente no momento da prestação do serviço.
        </p>
      </Section>

      <Section title="7. Avaliações">
        <p>
          Os utilizadores autenticados podem submeter avaliações sobre os serviços prestados. As avaliações devem ser verdadeiras, respeitosas e
          pertinentes. A {name} reserva-se o direito de remover avaliações que violem estas condições.
        </p>
      </Section>

      <Section title="8. Propriedade Intelectual">
        <p>
          Este Serviço é desenvolvido com base no projeto de código aberto{" "}
          <ExternalLink href="https://github.com/LuanPaD/BarberLab">BarberLab</ExternalLink>, distribuído sob licença MIT.
          O conteúdo, logótipo e marca {name} são propriedade exclusiva do respetivo titular e não podem ser reproduzidos sem autorização prévia e escrita.
        </p>
      </Section>

      <Section title="9. Limitação de Responsabilidade">
        <p>
          A {name} não se responsabiliza por danos indiretos decorrentes da utilização ou impossibilidade de utilização do Serviço.
          A responsabilidade máxima fica limitada ao valor do serviço contratado.
        </p>
      </Section>

      <Section title="10. Proteção de Dados">
        <p>
          O tratamento de dados pessoais é realizado em conformidade com o RGPD. Consulte a nossa{" "}
          <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
        </p>
      </Section>

      <Section title="11. Legislação Aplicável e Foro Competente">
        <p>
          Estes Termos são regidos pelo direito português. Qualquer litígio será submetido aos tribunais portugueses competentes,
          sem prejuízo do direito do consumidor de recorrer a entidades de resolução alternativa de litígios (RAL), em conformidade com a Lei n.º 144/2015.
        </p>
        <p>
          Pode também recorrer à plataforma europeia de resolução de litígios:{" "}
          <ExternalLink href="https://ec.europa.eu/consumers/odr">ec.europa.eu/consumers/odr</ExternalLink>.
        </p>
      </Section>

      <Section title="12. Alterações">
        <p>
          A {name} reserva-se o direito de alterar estes Termos. As alterações entram em vigor na data de publicação.
          A continuação da utilização do Serviço implica a sua aceitação.
        </p>
      </Section>

      <p className="text-muted-foreground text-xs">© {year} {name}. Todos os direitos reservados.</p>
    </LegalPage>
  )
}
