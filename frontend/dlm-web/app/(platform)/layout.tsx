import { PlatformAuthProvider } from '@/lib/context/PlatformAuthContext';

export default function PlatformGroupLayout({ children }: { children: React.ReactNode }) {
  return <PlatformAuthProvider>{children}</PlatformAuthProvider>;
}
