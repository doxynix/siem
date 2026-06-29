# 🚀 System Identity & Onboarding Blueprint

## 🏛️ Executive Summary
The system provides a high-performance, typesafe full-stack monorepo architecture leveraging **Bun**, **Hono**, **Vite**, and **React**. Its core value proposition is end-to-end type safety between the server and client with minimal boilerplate, utilizing a shared package for type definitions and `Turbo` for efficient build orchestration.

## 🔗 Primary Entrypoints
The following files represent the critical paths for understanding the system runtime, type contract, and frontend orchestration:

*   [[server/src/index.ts]]: The core Hono server entrypoint. Defines HTTP routes and API response structures.
*   [[client/src/routes/index.tsx]]: The primary client-side view, demonstrating integration with the backend via `hcWithType` and `TanStack Query`.
*   [[client/src/routeTree.gen.ts]]: The auto-generated router configuration for the TanStack Router, critical for managing application navigation.
*   [[shared/src/types/index.ts]]: The single source of truth for shared TypeScript interfaces, ensuring consistency across the monorepo.
*   [[server/src/client.ts]]: The RPC-style client generator, facilitating type-safe API consumption.

## 👥 Knowledge Holders & Ownership Risks
*   **Primary Maintainer**: Steve Simkins (via `package.json`).
*   **Ownership Risk**: The system relies heavily on `Turbo` and `Bun` workspace configurations. Knowledge of monorepo dependency resolution within `package.json` and `turbo.json` is essential for architectural modifications to avoid build-time drift.

## ⚙️ Quick Start, Setup & Verification

### Prerequisites
*   [Bun](https://bun.sh/) (v1.2.4 or higher recommended).
*   [Turbo](https://turbo.build/) (managed via `package.json` devDependencies).

### Environment Setup
1.  Clone the repository and navigate to the root directory.
2.  Install dependencies using the workspace-aware package manager:
    ```bash
    bun install
    ```
3.  Configure environment variables if necessary (refer to [[turbo.json]] for `VITE_*` and `NODE_ENV` definitions).

### Smoke Test / Verification
To verify the local build and runtime integrity, execute the following command:

```bash title="package.json"
bun run dev
```

> [!NOTE]
> The `dev` command utilizes `turbo dev`, which concurrently monitors the `client` and `server` packages.

Verify the system by accessing the local development server URL (typically `http://localhost:3000` or the Vite default port) and confirming the application loads the `/` index route.

## 🔄 Operating Model & Next Steps
The system operates as a workspace-based monorepo where the `server` and `client` packages consume exported types from the `shared` package.

*   **Runtime Behavior**: The server uses `Hono` for routing and JSON serialization. The client is a standard `Vite` + `React` project utilizing `TanStack Router` for state-driven navigation.
*   **Build Lifecycle**: Review [[turbo.json]] to understand task dependencies. The `postinstall` script is specifically configured to build `shared` and `server` packages to ensure downstream consumers have access to updated types.

**Recommended Reading for Senior Engineers:**
1.  [[turbo.json]]: Understand build caching and environment variable propagation.
2.  [[server/src/client.ts]]: Review the `hcWithType` implementation to understand how API type safety is enforced.
3.  [[client/vite.config.ts]]: Observe the plugin order for `tanstackRouter` and `react` to understand the build-time code generation process.