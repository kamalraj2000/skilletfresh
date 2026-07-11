import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';

async function login(formData: FormData) {
  'use server';
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/plan',
    });
  } catch (error) {
    if (error instanceof AuthError) redirect('/signin?error=1');
    throw error;
  }
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="screen" style={{ justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        <span className="brand" style={{ fontSize: 26 }}>
          Skillet<em>Fresh</em>
        </span>
        <div className="screen-sub" style={{ marginTop: 6 }}>
          Your week of dinners, planned.
        </div>
      </div>

      <form
        action={login}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {error && (
          <div
            style={{
              background: 'var(--paprika-tint)',
              border: '1px solid var(--paprika-line)',
              borderRadius: 12,
              padding: '10px 14px',
              font: '400 13.5px/1.4 var(--font-ui)',
              color: 'var(--paprika-deep)',
            }}
          >
            That email and password don&rsquo;t match. Try again.
          </div>
        )}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span className="section-label">Email</span>
          <input
            className="text-input"
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span className="section-label">Password</span>
          <input
            className="text-input"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />
        </label>
        <button className="btn-primary" style={{ height: 52, marginTop: 8 }} type="submit">
          Sign in
        </button>
      </form>
    </div>
  );
}
