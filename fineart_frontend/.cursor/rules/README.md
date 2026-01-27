# 📚 FineArt Frontend Project Rules

This directory contains comprehensive coding rules and conventions for the FineArt frontend project. These rules are organized by topic for easy reference.

## 📖 Rule Files

- **[architecture.mdc](./architecture.mdc)** - App structure, routing, component architecture, and data fetching patterns
- **[styling.mdc](./styling.mdc)** - Tailwind CSS usage, typography, layout, and design system conventions
- **[conventions.mdc](./conventions.mdc)** - Naming conventions, file organization, code structure, and best practices
- **[api-data.mdc](./api-data.mdc)** - API communication patterns, data handling, pagination, and error handling
- **[auth-security.mdc](./auth-security.mdc)** - Authentication, authorization, JWT handling, and security practices
- **[supabase.mdc](./supabase.mdc)** - Supabase integration patterns, queries, auth, storage, and best practices
- **[supabase-migration.mdc](./supabase-migration.mdc)** - Migration guide from C# .NET + MySQL to Supabase
- **[tooling.mdc](./tooling.mdc)** - Development tools, linting, Git workflow, and quality standards

## 🎯 Quick Reference

### Most Important Rules

1. **Always use Server Components by default** - Only use `'use client'` when necessary
2. **All API calls go through `src/lib/api.js`** - Never call axios directly
3. **Use `@/` path alias** - Avoid deep relative imports
4. **Normalize API data** - Use `normalizeXxx` functions for consistent data shapes
5. **Handle errors gracefully** - Always provide fallback data and user-friendly messages

## 🔍 Finding Rules

- **Routing questions?** → Check `architecture.mdc`
- **Styling questions?** → Check `styling.mdc`
- **Naming conventions?** → Check `conventions.mdc`
- **API integration?** → Check `api-data.mdc`
- **Supabase queries?** → Check `supabase.mdc`
- **Migrating to Supabase?** → Check `supabase-migration.mdc`
- **Auth implementation?** → Check `auth-security.mdc`
- **Development setup?** → Check `tooling.mdc`

## 📝 Contributing

When adding new rules or updating existing ones:

1. Place rules in the appropriate `.mdc` file
2. Use clear headings and emoji markers for readability
3. Include examples when helpful
4. Keep rules actionable and specific
5. Update this README if adding new rule files

## 🚀 Getting Started

New developers should read through all rule files to understand the project's conventions and best practices. Start with `architecture.mdc` and `conventions.mdc` for the foundation.
