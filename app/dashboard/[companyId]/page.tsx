import DashboardClient from './DashboardClient';

interface Props {
  params: { companyId: string };
}

export default async function DashboardPage({ params }: Props) {
  const { companyId } = params;

  return <DashboardClient companyId={companyId} />;
}
