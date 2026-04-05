// Auth pages have a standalone layout — no nav bar
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
