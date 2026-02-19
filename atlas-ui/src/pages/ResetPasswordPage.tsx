import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ParticlesBackground } from '@/components/ui/particles-background';
import * as authApi from '@/api/auth.api';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

type PageState = 'form' | 'success' | 'error' | 'invalid';

export function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pageState, setPageState] = useState<PageState>(token ? 'form' : 'invalid');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        try {
            await authApi.resetPassword(token!, newPassword);
            setPageState('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password');
            if (err instanceof Error && err.message.includes('expired')) {
                setPageState('error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const renderContent = () => {
        switch (pageState) {
            case 'invalid':
                return (
                    <div className="space-y-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">Invalid Link</h1>
                            <p className="text-muted-foreground text-base">
                                This password reset link is invalid or has expired.
                            </p>
                        </div>
                        <Link to="/forgot-password">
                            <Button variant="outline" className="w-full">
                                Request a new link
                            </Button>
                        </Link>
                    </div>
                );

            case 'success':
                return (
                    <div className="space-y-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">Password Reset!</h1>
                            <p className="text-muted-foreground text-base">
                                Your password has been reset successfully.
                            </p>
                        </div>
                        <Button
                            onClick={() => navigate('/login', { replace: true })}
                            className="w-full h-12 text-base font-semibold"
                            data-testid="reset-password-login-btn"
                        >
                            Go to Login
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
                            <h1 className="text-3xl font-bold tracking-tight">Link Expired</h1>
                            <p className="text-muted-foreground text-base">
                                This password reset link has expired. Please request a new one.
                            </p>
                        </div>
                        <Link to="/forgot-password">
                            <Button variant="outline" className="w-full">
                                Request a new link
                            </Button>
                        </Link>
                    </div>
                );

            default:
                return (
                    <>
                        <div className="space-y-2 text-center lg:text-left">
                            <h1 className="text-3xl font-bold tracking-tight">RESET PASSWORD</h1>
                            <p className="text-muted-foreground text-base">
                                Enter your new password below.
                            </p>
                        </div>

                        {error && (
                            <Alert variant="destructive" data-testid="reset-password-error">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="font-medium">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    className="h-12 bg-muted/30 border-input/60"
                                    data-testid="reset-password-new-input"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="font-medium">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    className="h-12 bg-muted/30 border-input/60"
                                    data-testid="reset-password-confirm-input"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-semibold shadow-md"
                                disabled={isLoading}
                                data-testid="reset-password-submit-btn"
                            >
                                {isLoading ? 'Resetting...' : 'Reset Password'}
                            </Button>
                        </form>

                        <div className="text-center">
                            <Link to="/login" className="text-sm font-medium text-primary hover:underline underline-offset-4">
                                <ArrowLeft className="inline w-4 h-4 mr-1" />
                                Back to login
                            </Link>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
            {/* Left Side: Form */}
            <div className="flex flex-col items-center justify-center lg:justify-start min-h-screen bg-background p-8 lg:px-12 lg:pt-32 xl:px-24">
                <div className="w-full max-w-[420px] space-y-8" data-testid="reset-password-card">
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
                        Secure your account with a new password.
                    </p>
                </div>
            </div>
        </div>
    );
}
