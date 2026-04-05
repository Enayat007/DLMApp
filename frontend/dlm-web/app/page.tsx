import { redirect } from 'next/navigation';

// Root path redirects to the marketing home page (which lives in the (marketing) route group)
export default function RootPage() {
  redirect('/home');
}
