# Development Guide & Quality Standards

## Local Setup & Testing
This repository uses `bun` as the primary package manager and runtime. Ensure `bun` is installed globally.

1.  **Installation**:
    ```bash
    bun install
    ```
2.  **Development Execution**:
    Use `turbo` to manage concurrent development tasks:
    ```bash
    # Start all services (Client & Server)
    bun run dev
    
    # Start only the server
    bun run dev:server
    
    # Start only the client
    bun run dev:client
    ```
3.  **Verification**:
    *   **Build**: Verify local compilation across all workspaces: `bun run build`.
    *   **Type Checking**: Ensure strict type compliance: `bun run type-check`.
    *   **Linting**: Run `bun run lint` to verify code style via [[biome.json]].

## Pre-Commit Verification Checklist (Fragile Zones)
Before committing, verify changes against these high-risk areas:

- [ ] [[server/src/index.ts]]: Warning: Primary Hono entrypoint. Action: Run server tests and verify route definitions (`/`, `/hello`).
- [ ] [[client/src/routeTree.gen.ts]]: Warning: Auto-generated routing logic. Action: Do not edit manually; trigger regeneration via `bun run dev:client` and verify route integrity.
- [ ] [[server/src/client.ts]]: Warning: Tight coupling between server and client RPC interfaces. Action: Ensure shared type updates in [[shared/src/types/index.ts]] are reflected here.
- [ ] [[client/src/routes/index.tsx]]: Warning: Complex UI logic with TanStack Query. Action: Verify state hydration and data fetching patterns.

## Pre-Commit Security Checks
- **Secrets**: Scan for hardcoded credentials. Use `.gitignore` to protect sensitive local env files.
- **Dependency Audit**: Ensure no unauthorized packages are added to [[client/package.json]] or [[server/package.json]].
- **Input Validation**: When modifying [[server/src/index.ts]], ensure all request payloads are validated using Hono middleware to prevent injection vectors.
- **Format/Lint**: Run `bun run format` and `bun run lint` to catch potential syntax-based security weaknesses.

## PR Quality Standards & Review Gates
- **Branch Naming**: Use `feature/`, `fix/`, or `refactor/` prefixes.
- **Documentation**: All public API changes in [[server/src/index.ts]] must include inline documentation.
- **Test Coverage**: New features must include unit tests. Use `bun run test` to confirm regressions are not introduced.
- **Dependency Management**: Avoid adding dependencies to the root [[package.json]]. Prefer workspace-specific [[client/package.json]] or [[server/package.json]].
- **Review Requirement**: At least one approval from a maintainer is required for changes to [[server/src/index.ts]] or [[client/src/routeTree.gen.ts]].

## Change Playbooks

### Adding a New API Route
1.  Open [[server/src/index.ts]].
2.  Define the route using the Hono instance.
3.  If the route requires specific types, define them in [[shared/src/types/index.ts]].
4.  Export the necessary interfaces for the client to consume.

### Modifying Security Policies
1.  Review global configuration in [[tsconfig.json]].
2.  If restricting access, implement the logic in the Hono middleware layer within [[server/src/index.ts]].
3.  Verify changes by running `bun run build:server`.

### Adding a New Client Route
1.  Create a new file in `client/src/routes/`.
2.  The TanStack Router plugin configured in [[client/vite.config.ts]] will automatically detect the new file.
3.  Check [[client/src/routeTree.gen.ts]] to confirm the route was registered correctly.
4.  Update [[client/src/routes/__root.tsx]] if the route requires a new navigation link or layout wrapper.