# Changelog

All notable changes to this project will be documented in this file.

This project follows Semantic Versioning.

## [1.1.0] - 2026-05-13

### Added

- Added an SSR-safe scoped runtime API with `createRoutableScope`, `createRoutablePlugin`, `defineRoutable`, `useRoutable`, `useRoutableScope`, `injectRoutable`, and `ROUTABLE_SCOPE_KEY`.
- Added support for request-local routable registration so controller instances can be created at app creation time instead of module import time.
- Added scope-aware lazy registration for modules that export either `defineRoutable(...)` definitions or decorated `@Routable(...)` classes.
- Added focused coverage for isolated scopes and lazy-loaded scoped registrations.

### Changed

- Refactored the internal runtime so route lookup state, active routable instances, and lazy registries can be scoped per app instance.
- Kept the legacy `registerRouter(router)` and singleton-based SPA flow working for client-only applications.
- Updated the generated API reference and VitePress site to reflect the new scoped API.

### Documentation

- Added a dedicated SSR guide describing request-scoped controllers, model factories, and lazy-loading behavior.
- Updated the README, home page, guide, and lazy-loading docs to make the new non-singleton API explicit and versioned as part of `v1.1.0`.

### Notes

- Earlier releases predate this changelog file.