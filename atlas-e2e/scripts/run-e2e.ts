import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';

function runCommand(command: string, args: string[], env: Record<string, string> = {}): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log(`\n\x1b[36m> Executing: ${command} ${args.join(' ')}\x1b[0m`);
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: process.platform === 'win32', // Use shell on Windows
            env: { ...process.env, ...env }
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command ${command} exited with code ${code}`));
            }
        });
    });
}

function startBackgroundProcess(command: string, args: string[], env: Record<string, string> = {}): ChildProcess {
    console.log(`\n\x1b[35m> Starting Background Process: ${command} ${args.join(' ')}\x1b[0m`);
    const child = spawn(command, args, {
        stdio: 'inherit',
        shell: process.platform === 'win32',
        env: { ...process.env, ...env },
        detached: process.platform !== 'win32' // Create a new process group on Linux/Mac
    });
    return child;
}

async function waitForHealthCheck(url: string, timeoutMs: number = 30000): Promise<void> {
    console.log(`\n\x1b[33m> Waiting for server to be healthy at ${url}...\x1b[0m`);
    const start = Date.now();
    
    while (Date.now() - start < timeoutMs) {
        try {
            await new Promise<void>((resolve, reject) => {
                const req = http.get(url, (res) => {
                    if (res.statusCode === 200) resolve();
                    else reject(new Error(`Status ${res.statusCode}`));
                });
                req.on('error', reject);
                req.end();
            });
            console.log(`\x1b[32m> Server is healthy and ready!\x1b[0m`);
            return;
        } catch (e) {
            // Wait 1 second before retrying
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    throw new Error(`Timeout waiting for ${url} after ${timeoutMs}ms`);
}

async function main() {
    let serverProcess: ChildProcess | null = null;
    let exitCode = 0;

    const cleanup = () => {
        if (serverProcess && !serverProcess.killed) {
            console.log(`\n\x1b[33m> Sending SIGINT to Server Process Tree...\x1b[0m`);
            try {
                if (process.platform === 'win32') {
                    // Windows uses standard kill
                    serverProcess.kill('SIGINT');
                } else if (serverProcess.pid) {
                    // Linux/Mac: Send signal to the entire process group to penetrate 'npx' wrapper!
                    process.kill(-serverProcess.pid, 'SIGINT');
                }
            } catch (e) {
                console.log(`\x1b[31mFailed to kill process group: ${e}\x1b[0m`);
            }
        }
    };

    // Handle abrupt exits
    process.on('SIGINT', () => {
        cleanup();
        process.exit(1);
    });

    try {
        // Ensure infra is clean and start DB/Mailpit
        await runCommand('docker', ['compose', '-f', 'docker-compose.e2e.yml', 'down', '-v']);
        // Use docker compose wait to ensure pg is ready
        await runCommand('docker', ['compose', '-f', 'docker-compose.e2e.yml', 'up', '-d', '--wait']);

        // Environment variables for natively running the server
        const testEnv = {
            DATABASE_URL: 'postgresql://atlas:atlas_dev_password@localhost:5433/app_atlas_test?schema=public',
            NODE_ENV: 'test',
            PORT: '3000',
            AUTH_PROVIDER: 'native',
            JWT_SECRET: 'e2e-test-secret-key-do-not-use-in-production',
            JWT_EXPIRES_IN: '7d',
            THROTTLE_LIMIT: '100000',
            THROTTLE_AUTH_LIMIT: '100000',
            SMTP_HOST: 'localhost',
            SMTP_PORT: '1025',
            SMTP_SECURE: 'false',
            SMTP_FROM: 'noreply@atlas.test',
            APP_URL: 'http://localhost:8081',
            APP_NAME: 'Atlas'
        };

        // Run Prisma migrations and seed locally
        await runCommand('npx', ['prisma', 'migrate', 'deploy', '--schema=atlas-server/prisma/schema.prisma'], testEnv);
        await runCommand('npm', ['run', 'db:seed:e2e', '-w', 'atlas-server'], testEnv);

        // We MUST build the server to ensure dist/ exists and maps exactly to the native codebase source-maps
        await runCommand('npm', ['run', 'build', '-w', 'atlas-server']);

        // Start Node server natively wrapped in c8
        serverProcess = startBackgroundProcess('npx', [
            '-y', 'c8', '--reporter=lcov', '--reporter=text', '--reports-dir=./atlas-server/coverage-e2e', 
            'node', './atlas-server/dist/main'
        ], testEnv);

        // Wait for server health endpoint
        await waitForHealthCheck('http://localhost:3000/api/health', 30000);

        // Run Jest API Tests
        const e2eTestEnv = {
            ...testEnv,
            CI: 'true',
            API_BASE_URL: 'http://localhost:3000',
            MAILPIT_API_URL: 'http://localhost:8025/api/v1',
            VITE_API_URL: '/api'
        };
        await runCommand('npm', ['run', 'test:api', '-w', 'atlas-e2e'], e2eTestEnv);

        // Run Playwright UI Tests (if applicable)
        await runCommand('npm', ['run', 'test:ui', '-w', 'atlas-e2e'], e2eTestEnv);

    } catch (error) {
        console.error(`\x1b[31m[E2E Error] ${error}\x1b[0m`);
        exitCode = 1;
    } finally {
        cleanup();
        
        // Give c8 and Node a couple of seconds to flush reports to disk cleanly after SIGTERM
        if (serverProcess) {
            console.log(`\x1b[33m> Waiting for Server Process to successfully flush native c8 coverage...\x1b[0m`);
            await new Promise(resolve => serverProcess!.on('close', resolve));
        }

        console.log(`\n\x1b[36m> Tearing down infra...\x1b[0m`);
        await runCommand('docker', ['compose', '-f', 'docker-compose.e2e.yml', 'down', '-v']);
        
        console.log(`\x1b[32m> E2E Execution Lifecycle Finished.\x1b[0m`);
        process.exit(exitCode);
    }
}

main();
