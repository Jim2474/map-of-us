import { notFound } from "next/navigation";
import { cities } from "@/data/cities";
import { hasCityDetail } from "@/data/spots";
import CityDetailPageClient from "@/components/CityDetailPageClient";

interface PageProps {
  params: Promise<{ cityId: string }>;
}

export async function generateStaticParams() {
  return cities
    .filter((city) => hasCityDetail(city.id))
    .map((city) => ({ cityId: city.id }));
}

export default async function CityPage({ params }: PageProps) {
  const { cityId } = await params;
  const city = cities.find((c) => c.id === cityId);

  if (!city || !hasCityDetail(cityId)) {
    notFound();
  }

  // Pass city data as serializable props to Client Component
  return <CityDetailPageClient city={city} />;
}
