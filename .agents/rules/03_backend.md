# Backend Development Rules (API)

Rules for working on the ASP.NET Core API in the `api` directory.

## 1. Tech Stack

- **Language**: C#.
- **Framework**: ASP.NET Core 8.0+.
- **Database**: SQL Server with Entity Framework Core.

## 2. Architectural Patterns

- **Separation of Concerns**:
  - **Controllers**: Handle HTTP requests and basic validation.
  - **Services**: Contain business logic (e.g., `ScoringService`).
  - **Models/Entities**: Define the data structure.
  - **Data/Context**: Manage DB persistence.
- **DTOs**: Use specific DTOs for API input/output to avoid exposing internal entities directly.

## 3. Code Quality

- **Naming**: Use PascalCase for all C# classes, methods, and properties.
- **Async/Await**: Always use async/await for I/O operations (DB, external APIs).
- **Validation**: Ensure `dotnet build` passes and address all warnings.

## 4. Database

- **Migrations**: Always use EF Core migrations to update the schema.
- **Seeding**: Ensure default data (like scoring systems) is seeded appropriately.
