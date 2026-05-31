# General Workflow Rules

These rules apply to all agent activities within the Race Committee project.

## 1. Communication

- **Clarity**: Explain *why* changes are being made, not just *what* was changed.
- **Proactiveness**: If a bug or potential improvement is spotted while working on a task, document it or fix it if it's minor.

## 2. Git & Commits

- **Conventional Commits**: Use the conventional commits format (e.g., `feat:`, `fix:`, `refactor:`, `docs:`).
- **Atomic Commits**: Keep commits focused and small.
- **Tooling**: Prefer using `mcp_GitKraken` tools for managing commits and branches.

## 3. Documentation

- **KIs**: Update Knowledge Items (KIs) when introducing new architectural patterns, services, or complex logic.
- **READMEs**: Ensure README files in `ui` and `api` reflect current setup/run instructions.

## 4. Development Stack Management

- **Start Stack**: When asked to start or spin up the application stack, run:
  - Windows: `powershell -ExecutionPolicy Bypass -File start-dev.ps1 -Headless` (Note: `-Headless` is required for background execution in headless agent/CI environments)
  - macOS/Linux: `./start-dev.sh`
- **Stop Stack**: When asked to stop or tear down the application stack, run:
  - Windows: `powershell -ExecutionPolicy Bypass -File stop-dev.ps1`
  - macOS/Linux: `./stop-dev.sh`
