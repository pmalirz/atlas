import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ParticlesBackground } from '@/components/ui/particles-background';
import * as authApi from '@/api/auth.api';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await authApi.forgotPassword(email);
            setIsSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
            {/* Left Side: Form */}
            <div className="flex flex-col items-center justify-center lg:justify-start min-h-screen bg-background p-8 lg:px-12 lg:pt-32 xl:px-24">
                <div className="w-full max-w-[420px] space-y-8" data-testid="forgot-password-card">
                    {isSuccess ? (
                        // Success State
                        <div className="space-y-6 text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold tracking-tight">Check Your Email</h1>
                                <p className="text-muted-foreground text-base">
                                    If an account exists for <span className="font-medium text-foreground">{email}</span>,
                                    we've sent a password reset link.
                                </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Didn't receive the email? Check your spam folder or try again.
                            </p>
                            <div className="flex flex-col gap-3">
                                <Button variant="outline" onClick={() => setIsSuccess(false)}>
                                    Try another email
                                </Button>
                                <Link to="/login" className="text-sm font-medium text-primary hover:underline underline-offset-4">
                                    <ArrowLeft className="inline w-4 h-4 mr-1" />
                                    Back to login
                                </Link>
                            </div>
                        </div>
                    ) : (
                        // Form State
                        <>
                            <div className="space-y-2 text-center lg:text-left">
                                <h1 className="text-3xl font-bold tracking-tight">FORGOT PASSWORD</h1>
                                <p className="text-muted-foreground text-base">
                                    Enter your email and we'll send you a reset link.
                                </p>
                            </div>

                            {error && (
                                <Alert variant="destructive" data-testid="forgot-password-error">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="font-medium">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        className="h-12 bg-muted/30 border-input/60"
                                        data-testid="forgot-password-email-input"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-semibold shadow-md"
                                    disabled={isLoading}
                                    data-testid="forgot-password-submit-btn"
                                >
                                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                                </Button>
                            </form>

                            <div className="text-center">
                                <Link to="/login" className="text-sm font-medium text-primary hover:underline underline-offset-4">
                                    <ArrowLeft className="inline w-4 h-4 mr-1" />
                                    Back to login
                                </Link>
                            </div>
                        </>
                    )}
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
                        We'll help you get back into your account.
                    </p>
                </div>
            </div>
        </div>
    );
}
