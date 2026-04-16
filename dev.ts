import { spawn } from "node:child_process";
import net from "node:net";

function getFreePort(preferred: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.unref();
    server.on("error", () => {
      const fallback = net.createServer();
      fallback.unref();
      fallback.listen({ port: 0 }, () => {
        const address = fallback.address();
        const port = typeof address === "object" && address ? address.port : preferred;
        fallback.close(() => resolve(port));
      });
    });

    server.listen({ port: preferred }, () => {
      server.close(() => resolve(preferred));
    });
  });
}

function run(
  label: string,
  command: string,
  args: string[],
  options: {
    cwd: string;
    env?: Record<string, string>;
  }
) {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));

  console.log(`[dev] started ${label} (pid ${child.pid})`);
  return child;
}

const root = process.cwd();

const backendPort = await getFreePort(3001);
const frontendPort = await getFreePort(5173);

console.log(`[dev] backend:  http://localhost:${backendPort}`);
console.log(`[dev] frontend: http://localhost:${frontendPort}`);

run("backend", "bun", ["run", "dev"], {
  cwd: `${root}/backend`,
  env: { PORT: String(backendPort) },
});

run("frontend", "bun", ["run", "dev", "--", "--port", String(frontendPort)], {
  cwd: `${root}/frontend`,
  env: {
    VITE_API_URL: "/api",
    BACKEND_URL: `http://localhost:${backendPort}`,
  },
});
