import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ParticlesBackground } from '@/components/ui/particles-background';
import * as authApi from '@/api/auth.api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type PageState = 'loading' | 'success' | 'error' | 'invalid';

export function VerifyEmailPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [pageState, setPageState] = useState<PageState>(token ? 'loading' : 'invalid');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setPageState('invalid');
            return;
        }

        const verifyEmail = async () => {
            try {
                await authApi.verifyEmail(token);
                setPageState('success');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Verification failed');
                setPageState('error');
            }
        };

        verifyEmail();
    }, [token]);

    const renderContent = () => {
        switch (pageState) {
            case 'loading':
                return (
                    <div className="space-y-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">Verifying Email</h1>
                            <p className="text-muted-foreground text-base">
                                Please wait while we verify your email address...
                            </p>
                        </div>
                    </div>
                );

            case 'success':
                return (
                    <div className="space-y-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">Email Verified!</h1>
                            <p className="text-muted-foreground text-base">
                                Your email has been verified successfully. You can now use all features.
                            </p>
                        </div>
                        <Button
                            onClick={() => navigate('/', { replace: true })}
                            className="w-full h-12 text-base font-semibold"
                            data-testid="verify-email-continue-btn"
                        >
                            Continue to App
                        </Button>
                    </div>
                );

            case 'error':
                return (
                    <div className="space-y-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">Verification Failed</h1>
                            <p className="text-muted-foreground text-base">
                                {error || 'This verification link is invalid or has expired.'}
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    try {
                                        await authApi.resendVerification();
                                        alert('Verification email sent! Check your inbox.');
                                    } catch (err) {
                                        alert('Please log in to resend verification email.');
                                        navigate('/login');
                                    }
                                }}
                            >
                                Resend Verification Email
                            </Button>
                            <Link to="/login" className="text-sm font-medium text-primary hover:underline underline-offset-4">
                                Back to login
                            </Link>
                        </div>
                    </div>
                );

            default: // invalid
                return (
                    <div className="space-y-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">Invalid Link</h1>
                            <p className="text-muted-foreground text-base">
                                This email verification link is invalid.
                            </p>
                        </div>
                        <Link to="/login">
                            <Button variant="outline" className="w-full">
                                Go to Login
                            </Button>
                        </Link>
                    </div>
                );
        }
    };

    return (
        <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
            {/* Left Side: Content */}
            <div className="flex flex-col items-center justify-center lg:justify-start min-h-screen bg-background p-8 lg:px-12 lg:pt-32 xl:px-24">
                <div className="w-full max-w-[420px] space-y-8" data-testid="verify-email-card">
                    {renderContent()}
                </div>
            </div>

            {/* Right Side: Gradient & Branding */}
            <div className="hidden lg:flex relative h-full w-full bg-slate-50 items-center justify-center p-12 overflow-hidden">
                <div className="absolute inset-0 w-full h-full bg-slate-50 z-0" />
                <ParticlesBackground
                    className="absolute inset-0 z-0"
                    particleColor="rgba(147, 51, 234, 0.3)"
                    lineColor="rgba(147, 51, 234, 0.15)"
                    particleCount={80}
                />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] z-0" />
                <div className="relative z-10 max-w-lg text-center space-y-6">
                    <h1 className="text-5xl font-bold tracking-tighter text-slate-900">
                        Atlas Platform
                    </h1>
                    <p className="text-xl text-slate-600 font-light leading-relaxed">
                        Verify your email to unlock all features.
                    </p>
                </div>
            </div>
        </div>
    );
}
