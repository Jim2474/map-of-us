import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ cityId: string }>;
}

export default async function CityPage({ params }: PageProps) {
  const { cityId } = await params;
  redirect(`/city-explore?city=${encodeURIComponent(cityId)}`);
}
