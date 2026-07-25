import ExportClient from './ExportClient';

export default function ExportPage({ params }: { params: { id: string } }) {
  return <ExportClient repoId={params.id} />;
}
