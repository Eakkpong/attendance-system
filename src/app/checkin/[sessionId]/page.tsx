import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { validateToken } from '@/lib/token';
import CheckinForm from '@/components/CheckinForm';

export default async function CheckinPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ sessionId: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams.token as string;
  
  if (!token) {
    return (
      <div className="glass-container" style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
        <h1 className="heading-1" style={{ color: 'var(--danger)' }}>Invalid Link</h1>
        <p>Please scan the QR code from the screen again.</p>
      </div>
    );
  }

  const session = await prisma.session.findUnique({
    where: { id: resolvedParams.sessionId },
    include: { course: true }
  });

  if (!session) {
    notFound();
  }

  if (!session.isActive) {
    return (
      <div className="glass-container" style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
        <h1 className="heading-1" style={{ color: 'var(--danger)' }}>Session Closed</h1>
        <p>This attendance session has ended.</p>
      </div>
    );
  }

  // Validate token initially
  const isValid = validateToken(session.id, token);

  if (!isValid) {
    return (
      <div className="glass-container" style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
        <h1 className="heading-1" style={{ color: 'var(--danger)' }}>QR Code Expired</h1>
        <p>This QR code has expired. Please scan the latest QR code on the screen.</p>
      </div>
    );
  }

  return (
    <div className="glass-container" style={{ maxWidth: '500px', margin: '4rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="heading-2">Check In</h1>
        <h2 className="heading-1" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{session.course.code}</h2>
        <p className="text-muted">{session.name}</p>
      </div>

      <CheckinForm sessionId={session.id} token={token} />
    </div>
  );
}
