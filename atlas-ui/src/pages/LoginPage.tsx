import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { AuthBrandingPanel } from '@/components/layout/AuthBrandingPanel';

type AuthMode = 'login' | 'register';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register, isLoading: authLoading, authConfig } = useAuth();

    const [mode, setMode] = useState<AuthMode>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(false);

    // Get redirect path from location state
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const name = formData.get('name') as string;

        try {
            if (mode === 'login') {
                await login({ email, password, rememberMe });
            } else {
                await register({ email, password, name });
            }
            navigate(from, { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : `${mode === 'login' ? 'Login' : 'Registration'} failed`);
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading if auth config not loaded
    if (!authConfig && !authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/30">
                <div className="w-[400px] rounded-lg border bg-card p-6">
                    <Alert variant="destructive">
                        <AlertDescription>Unable to connect to authentication service.</AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    const isNativeAuth = authConfig?.provider === 'native';

    return (
        <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
            {/* Left Side: Login Form */}
            <div className="flex flex-col items-center justify-center lg:justify-start min-h-screen bg-background p-8 lg:px-12 lg:pt-32 xl:px-24">
                <div className="w-full max-w-[420px] space-y-8" data-testid="auth-card">
                    <div className="space-y-2 text-center lg:text-left">
                        <h1 className="text-3xl font-bold tracking-tight font-display">Welcome Back</h1>
                        <p className="text-muted-foreground text-base">
                            Enter your credentials to continue.
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive" data-testid="auth-error">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {isNativeAuth ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Mode toggle */}
                            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                                <button
                                    type="button"
                                    onClick={() => setMode('login')}
                                    className={`py-2 text-sm font-medium rounded-md transition-all duration-200 ${mode === 'login'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                        }`}
                                    data-testid="login-tab"
                                >
                                    Sign In
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('register')}
                                    className={`py-2 text-sm font-medium rounded-md transition-all duration-200 ${mode === 'register'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                        }`}
                                    data-testid="register-tab"
                                >
                                    Sign up
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Name field (register only) */}
                                {mode === 'register' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="font-medium">Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            type="text"
                                            placeholder="Your name"
                                            autoComplete="name"
                                            className="h-12 bg-muted/30 border-input/60"
                                            data-testid="register-name-input"
                                        />
                                    </div>
                                )}

                                {/* Email field */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="font-medium">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        required
                                        autoFocus
                                        autoComplete="email"
                                        className="h-12 bg-muted/30 border-input/60"
                                        data-testid="auth-email-input"
                                    />
                                </div>

                                {/* Password field */}
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="font-medium">Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        minLength={mode === 'register' ? 8 : undefined}
                                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                        className="h-12 bg-muted/30 border-input/60"
                                        data-testid="auth-password-input"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center space-x-2 cursor-pointer">
                                        <Checkbox
                                            checked={rememberMe}
                                            onCheckedChange={(checked) => setRememberMe(checked === true)}
                                            data-testid="remember-me-checkbox"
                                        />
                                        <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Remember me
                                        </span>
                                    </Label>
                                    <Link to="../forgot-password" className="text-sm font-medium underline-offset-4 hover:underline" data-testid="forgot-password-link">
                                        Forgot password
                                    </Link>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-semibold shadow-md"
                                disabled={isLoading}
                                data-testid="auth-submit-btn"
                            >
                                {isLoading
                                    ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                                    : (mode === 'login' ? 'Sign In' : 'Create Account')}
                            </Button>

                            <div className="text-center text-sm text-muted-foreground">
                                {mode === 'login' ? (
                                    <>
                                        Don't have an account?{' '}
                                        <button
                                            type="button"
                                            onClick={() => setMode('register')}
                                            className="font-semibold text-primary hover:underline underline-offset-4"
                                        >
                                            Sign up for free!
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?{' '}
                                        <button
                                            type="button"
                                            onClick={() => setMode('login')}
                                            className="font-semibold text-primary hover:underline underline-offset-4"
                                        >
                                            Sign in here
                                        </button>
                                    </>
                                )}
                            </div>
                        </form>
                    ) : (
                        // External provider (SSO only)
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground text-center">
                                Connect with your organization to continue.
                            </p>
                            <Button
                                className="w-full h-12"
                                variant="outline"
                                onClick={() => {
                                    window.location.href = `/api/auth/authorize?redirect_uri=${encodeURIComponent(window.location.origin + '/auth/callback')}`;
                                }}
                                data-testid="sso-login-btn"
                            >
                                Continue with {authConfig?.provider?.toUpperCase()}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Branding */}
            <AuthBrandingPanel
                subtitle={<>Unleash the power of <span className="font-semibold text-primary">dynamic</span>,<br /><span className="font-semibold text-primary">low-code</span> innovation.</>}
            />
        </div>
    );
}
