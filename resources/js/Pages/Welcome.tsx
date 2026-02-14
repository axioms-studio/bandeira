import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import PublicLayout from "@/Layouts/PublicLayout";

export default function Home() {
  return (
    <PublicLayout>
      <HeroGeometric
        badge="Bandeira"
        title1="Feature Flags"
        title2="Made Simple"
      />
    </PublicLayout>
  );
}
