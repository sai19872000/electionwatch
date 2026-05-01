import { StatePageClient } from './StatePageClient';

const VALID_CODES = ['S03', 'S11', 'S22', 'S25', 'U06'];

export function generateStaticParams() {
  return VALID_CODES.map((code) => ({ code }));
}

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function StatePage({ params }: PageProps) {
  const { code } = await params;
  return <StatePageClient code={code} />;
}
