import { notFound } from 'next/navigation';
import { MarketDetail } from '@/components/MarketDetail';

interface MarketDetailPageProps {
  params: {
    id: string;
  };
}

export default function MarketDetailPage({ params }: MarketDetailPageProps) {
  const { id } = params;

  if (!id) {
    notFound();
  }

  return <MarketDetail marketId={id} />;
}
