import { LandingHeader } from "./landing-header";

interface LandingHeaderWrapperProps {
  user: any;
}

export function LandingHeaderWrapper({ user }: LandingHeaderWrapperProps) {
  return <LandingHeader user={user} />;
}
