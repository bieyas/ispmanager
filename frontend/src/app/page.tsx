import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: '24px' }}>
      <h1>ISP Manager</h1>
      <ul>
        <li>
          <Link href="/login">Login</Link>
        </li>
        <li>
          <Link href="/dashboard">Dashboard</Link>
        </li>
      </ul>
    </main>
  );
}
