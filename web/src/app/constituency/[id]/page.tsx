import { ConstituencyPageClient } from './ConstituencyPageClient';
import constituencies from '../../../../../../services/electionwatch_scraper/seed/constituencies.json';

export function generateStaticParams() {
  return constituencies.constituencies.map((c: { state_code: string; ac_no: number }) => ({
    id: `${c.state_code}-${c.ac_no}`,
  }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConstituencyPage({ params }: PageProps) {
  const { id } = await params;
  return <ConstituencyPageClient id={id} />;
}
