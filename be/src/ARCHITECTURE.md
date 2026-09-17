# Backend module ownership

Request flow: route → controller → service → repository → MySQL procedure.

## Feature modules

- `product`: product records, product queries and product-level operations.
- `product-variant`: variant creation, updates, deletion and stock synchronization.
- `product-image`: image creation, deletion and primary-image selection.
- `cart`: cart retrieval and clearing; `cart-item`: individual item mutations.
- `auth`: registration, login and current user; `session`: token rotation and logout.
- `user`: personal profile/password; `admin-user`: user listing and account status.
- `order`: checkout and customer orders; `admin-order`: admin listing and status changes.
- `review`: customer reviews; `admin-review`: moderation and replies.
- `category`, `brand`, `category-attribute`: separate controllers and routes. The generic
  catalog service and repository remain shared because their schema-driven operations
  also enforce category-tree and attribute rules in a single transaction.

Repositories additionally separate `order-item`, `order-status-history`, and
`promotion-usage`. These are used by order workflows; they do not expose independent
public mutation APIs.

## Shared code and transactions

`*.shared.ts` contains response mapping, record types or transaction helpers needed
by multiple feature modules. Import the owning module directly. A feature file must
not duplicate another feature's implementation merely to provide another filename.

Transaction boundaries remain in services. Repository functions continue receiving
the same transaction connection; splitting files does not introduce separate commits.
Existing stored procedure names and API response shapes remain unchanged.

## Routes and middleware

`routes/index.ts` mounts API groups. Some feature routers mount child routers (for
example product variants/images and cart items). Those children inherit the parent's
authentication and authorization middleware and must not be mounted independently
without equivalent protection.

Middleware remains unchanged and shared: authentication, admin authorization,
validation, rate limiting, logging, not-found handling and error handling.

## Verification

Run `npm run typecheck`, `npm run build`, then `npm run test:integration` from `be`.
The integration suites use the configured MySQL database, create test-owned records
and clean them up. The refactored backend retains 92 method/path endpoints.
