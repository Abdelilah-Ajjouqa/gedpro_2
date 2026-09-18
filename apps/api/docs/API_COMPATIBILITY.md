# API compatibility and collection conventions

Version 1 is available under `/v1`. Unversioned routes remain temporarily available for existing clients and return `Deprecation`, `Sunset`, and successor `Link` headers. New clients must use `/v1`; removal of legacy routes requires advance release-note notice and a major-version migration window.

Within v1, additive response fields and optional request fields are compatible. Removing or renaming fields, changing their types or meanings, tightening accepted values, or changing authorization semantics requires a new major API version. Security fixes may reject previously accepted unsafe input.

Page-based collections accept `page` (default 1) and `limit` (default 20, maximum 100) and return `{ data, total, page, limit }`. Timeline feeds use an opaque stable cursor and return `{ data, nextCursor }`. Filters are optional, validated query fields; unknown fields are rejected globally. Sorting is restricted to documented allow-listed fields and always includes a deterministic tie-breaker.

Metric date boundaries are UTC and use inclusive `from` and exclusive `to` values as documented by reporting responses.
