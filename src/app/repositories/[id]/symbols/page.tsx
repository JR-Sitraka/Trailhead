import SymbolsClient from './SymbolsClient';

export default async function SymbolsPage({ params }: { params: { id: string } }) {
  return <SymbolsClient repoId={params.id} />;
}
