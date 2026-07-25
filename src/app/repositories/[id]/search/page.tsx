import SearchClient from './SearchClient';

export default async function SearchPage({ params }: { params: { id: string } }) {
  return <SearchClient repoId={params.id} />;
}
