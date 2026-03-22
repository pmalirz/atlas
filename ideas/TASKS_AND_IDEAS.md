# Atlas Platform Ideas Backlog

This document maintains a backlog of ideas for the Atlas platform. Each idea is briefly described here. When selected for implementation, a full analysis and plan will be created.

## Must Have

- **[L] Configurable workflow and rule engine**: flexible engine to define custom business logic and state transitions.
- **[L] Reporting / analysis possibilities**: Tools to easily define reports and charts against the dynamic data model.
- **[M] Concurrency Control Strategy**: Choice of strategy for handling simultaneous edits (optimistic locking vs. PostgreSQL JSONB per-attribute merging).
- **[S] Unverified Account Cleanup**: Automated removal of accounts that haven't verified their email within a specific timeframe or logic to handle them.

## Should Have

- **[L] Advanced RBAC Data Policies**: Allow users to define `updateConditions` / `deleteConditions` for an entity type based on its active state (e.g., updates are disabled if status is "Pending Approval").
- **[S] MCP agent**: Expose the platform via the Model Context Protocol (MCP) to allow interaction with external AI agents.
- **[M] Bulk editing in browser**: In-browser bulk editing capability where multiple entities can be edited simultaneously in a table/grid view.
- **[M] Developer portal**: A dedicated portal for developers (similar to [InnerSource Commons](https://patterns.innersourcecommons.org/p/innersource-portal)).
- **[XL] Excel edit integration**: Downloadable Excel integration where entities appear as tabs. Users can edit in Excel and sync back to the platform. Authentication uses embedded short-lived tokens.
- **[XL] Pluggable architecture**: A system design allowing easy extension of the platform through plugins.
- **[M] Per-tenant Email Templates**: Custom email templates (branding, content) configurable per tenant.

## Nice to Have

- **[S] AI assistant for entity creation**: Smart suggestions for existing market entities when adding new ones.
- **[M] AI chat**: meaningful chat interface to query and interact with Atlas data.
- **[M] Bot / Pet / Assistant**: A configurable virtual companion that makes suggestions and communicates with users.
- **[M] Gamification**: Configurable rules to introduce gamification mechanics.

## Completed

- **[S] Auth & Registration**: User authentication and registration system.
- **[M] Audit Log**: Full history of all operations on entities, relations, and schemas.
- **[L] RBAC system**: Fine-grained Role-Based Access Control on entities and specific attributes.
