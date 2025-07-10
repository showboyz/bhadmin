import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect directly to login page
  redirect('/login')
}
