import { AcDetailClient } from './AcDetailClient';
import constituencies from '@/data/constituencies.json';

export function generateStaticParams() {
  return constituencies.constituencies.map((c: { state_code: string; ac_no: number }) => ({
    id: `${c.state_code}-${c.ac_no}`,
  }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AcDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AcDetailClient id={id} />;
}
