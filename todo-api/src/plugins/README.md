# Plugins Folder

Plugins folder provides a way to define dependencies the whole application needs.
Not to be confused with utility functions.

In our usecase, that is for things like db connection pools and HTTP errors,
but would support extra functionality like file-based atomicity controls, queues, etc.

## Persistence Layer (Infrastructure)

`persistence.plugin.ts` — factory that wires the raw store (in-memory or SQLite)
based on `env.PERSISTENCE_METHOD`. Knows nothing about domains.

## Domain Plugins

Each feature has its own plugin (e.g. `todos.plugin.ts`) that depends on the
persistence plugin and wires its own repository + service chain on top of the store.
To add a new backend, add a case in both the persistence plugin and each domain plugin.
