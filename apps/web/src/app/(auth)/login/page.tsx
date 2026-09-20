import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
export default function LoginPage() { return <Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-muted" />}><LoginForm /></Suspense>; }
