import { LandingHeader } from "./landing-header";

type MinimalUser = { id: string } | null;

interface LandingHeaderWrapperProps {
  user: MinimalUser;
}

export function LandingHeaderWrapper({ user }: LandingHeaderWrapperProps) {
  return <LandingHeader user={user} />;
}
