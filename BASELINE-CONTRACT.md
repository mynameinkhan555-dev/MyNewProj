# @0012 Semantic Baseline Contract Definition

## 1. Source of Truth

**Authoritative Source:** Historical migrations 0001-0012 in `modules/iam/src/infrastructure/database/migrations/`

**Migration Hashes (SHA-256):**
- 0001_initial.sql: 046f9c8e07b660ec40b78d01bacee563879895771ff5864efc36bf5889bf620a
- 0002_add_mfa.sql: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- 0003_add_soft_delete.sql: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- 0004_add_oauth_states.sql: de8bd8a450b69e7142fd9171aff664c563759595e41b00c55ab95ba1c8c4938e
- 0005_add_outbox_events.sql: 3cbf5080b455682f36217dee2f1e9d07f8a5016fd0e23ca80173a2fc23062b7d
- 0006_add_password_set.sql: 67bb0a1bcdae3dfe45d2c6d8fbbf7fd781b8f7e1086d712dccdfe08c66753d06
- 0007_add_tenant_module.sql: b352f0a9caac935261886599858d28fef46ad1bd0d56b3d82206a0a80c9ee0b2
- 0008_add_membership_module.sql: 9ac49aa1e5a314dddfb72b7309e10c6f02738c1585c1ccb61cf464acc870cc8d
- 0009_add_tenant_roles.sql: 8f2fc9d3b6937abc5a94a2c3e4194ec6587c176c28550bb23758daf5a50367aa
- 0010_add_role_assignments.sql: ca2bd9504c4fad6085d6a74c0c910dc3e9a67aa6be892efdd3fe003b1c9eb82c
- 0011_add_invitations.sql: 15967dcdac215771a9da635e16ef2276342593523a1db4001a0cc4c28a5aeb05
- 0012_fix_role_assignment_cascade.sql: 656b2114d5c25efe4bfafc2ee4934d8532e6c26d37b4db6a7169af2571efe75d

**Baseline Migration:** 0012

## 2. PostgreSQL Environment

**PostgreSQL Version:** 17.6 on x86_64-windows, compiled by msvc-19.44.35217, 64-bit

**Database State After 0001-0012:**
- 19 tables (18 application + 1 migration journal)
- 18 application tables: iam_devices, iam_identity_roles, iam_oauth_states, iam_outbox_events, iam_permissions, iam_policies, iam_role_permissions, iam_roles, iam_sessions, identities, social_identities, tenant_invitations, tenant_memberships, tenant_permissions, tenant_role_assignments, tenant_role_permissions, tenant_roles, tenants
- 1 migration journal: __drizzle_migrations

## 3. Semantic Metadata

**Definition:** Metadata that materially affects schema semantics, application behavior, or data integrity. Changes to semantic metadata should change the fingerprint.

### 3.1 Schema Identity
- **Rationale:** Schema name (e.g., "public") is fundamental to object identity resolution.
- **Included:** schema name

### 3.2 Table Identity
- **Rationale:** Table name is fundamental to object identity and application code mapping.
- **Included:** table name

### 3.3 Column Identity
- **Rationale:** Column name is fundamental to data access and application mapping.
- **Included:** column name

### 3.4 Column Order
- **Rationale:** Column order affects ordinal_position in PostgreSQL and can impact some applications. It is part of the physical schema definition.
- **Included:** ordinal_position

### 3.5 Data Type
- **Rationale:** Data type determines what values can be stored and how they are interpreted. This is fundamental.
- **Included:** data_type (e.g., "text", "integer", "timestamp with time zone")

### 3.6 Nullability
- **Rationale:** NULL vs NOT NULL is a fundamental constraint on data validity.
- **Included:** nullable (true/false)

### 3.7 Default Expression
- **Rationale:** Default values affect data initialization and application behavior.
- **Included:** default_value (normalized to remove PostgreSQL-specific encodings like `'value'::type`)

### 3.8 Generated Expression
- **Rationale:** Computed/generated columns are semantic features of the schema.
- **Included:** generated_expression

### 3.9 Primary Keys
- **Rationale:** Primary keys define entity identity and are fundamental to data integrity.
- **Included:** PRIMARY KEY constraints with column names

### 3.10 Unique Constraints
- **Rationale:** Unique constraints enforce data integrity and are semantic business rules.
- **Included:** UNIQUE constraints with column names

### 3.11 Foreign Keys
- **Rationale:** Foreign keys enforce referential integrity between tables. This is a fundamental semantic relationship.
- **Included:** FOREIGN KEY constraints with:
  - source columns
  - target schema
  - target table
  - target columns

### 3.12 Check Constraints
- **Rationale:** Check constraints enforce semantic data validation rules.
- **Included:** CHECK constraints with names (for user-defined constraints)
- **Excluded:** PostgreSQL-generated check constraints matching `^\d+_\d+_\d+_check$` (these are implementation artifacts, not semantic)

### 3.13 Semantically Meaningful Constraint Names
- **Rationale:** User-defined constraint names are part of the API contract and can be referenced in application code, migrations, or error messages.
- **Included:** Explicit user-defined constraint names
- **Excluded:** PostgreSQL-generated constraint names matching `^\d+_\d+_\d+_(not_null|check)$`

### 3.14 Indexes
- **Rationale:** Indexes affect query performance and can enforce uniqueness. They are part of the schema definition.
- **Included:**
  - index name
  - uniqueness (true/false)
  - indexed columns
  - index method (btree, hash, etc.) - semantic because it affects query semantics and performance characteristics
  - index expressions (for functional indexes) - semantic because they define computed access paths
  - partial predicates (for partial indexes) - semantic because they define subset indexing

### 3.15 Enum Types
- **Rationale:** Enum types define value domains and are part of the type system.
- **Included:**
  - enum name
  - enum values (in deterministic order)

### 3.16 Sequences
- **Rationale:** Sequences define identity generation for serial/identity columns.
- **Included:**
  - sequence name
  - sequence ownership (if applicable)
  - increment, start, min, max, cache values (these affect identity generation semantics)

### 3.17 Functions
- **Rationale:** Functions can be schema-defining (e.g., for computed columns, default values, triggers).
- **Included:** Function signatures if they are referenced by schema objects
- **Note:** In current @0012 schema, no schema-defining functions exist

### 3.18 Triggers
- **Rationale:** Triggers define automatic behavior and are semantic.
- **Included:** Trigger definitions if they exist
- **Note:** In current @0012 schema, no triggers exist

### 3.19 Views/Materialized Views
- **Rationale:** Views define virtual data access patterns and are semantic.
- **Included:** View definitions if they exist
- **Note:** In current @0012 schema, no views exist

## 4. Non-Semantic Metadata

**Definition:** Metadata that is implementation-specific, transient, or does not affect schema semantics. Changes to non-semantic metadata should NOT change the fingerprint.

### 4.1 PostgreSQL Object OIDs
- **Rationale:** OIDs are internal PostgreSQL identifiers assigned at object creation time. They are not part of the logical schema and can differ between databases.
- **Excluded:** All OIDs (pg_class.oid, pg_attribute.attrelid, etc.)

### 4.2 Database-Specific Internal Identifiers
- **Rationale:** Internal identifiers are PostgreSQL implementation details.
- **Excluded:** Transaction IDs, snapshot IDs, internal counters

### 4.3 Transient Physical Identifiers
- **Rationale:** Physical identifiers like file numbers, block numbers are storage-specific.
- **Excluded:** Relation file nodes, block numbers

### 4.4 Creation Timestamps
- **Rationale:** When an object was created does not affect its semantics.
- **Excluded:** Object creation timestamps

### 4.5 Backend/Session Identifiers
- **Rationale:** Catalog queries may include session-specific metadata.
- **Excluded:** Backend PID, session ID

### 4.6 Unstable Catalog Ordering
- **Rationale:** Catalog views may return rows in non-deterministic order without explicit ORDER BY.
- **Excluded:** Implicit ordering - all collections must be explicitly sorted

### 4.7 PostgreSQL-Generated Constraint Names
- **Pattern:** `^\d+_\d+_\d+_(not_null|check)$`
- **Rationale:** These names are auto-generated by PostgreSQL based on internal OIDs. They are not user-defined and do not affect schema semantics.
- **Excluded:** Constraint names matching this pattern
- **Note:** The `not_null` pattern is for NOT NULL constraints that PostgreSQL auto-names. The `check` pattern is for CHECK constraints PostgreSQL auto-names.

## 5. Migration Journal Decision

**Decision:** Migration journal table (`__drizzle_migrations`) is **NOT** part of the @0012 semantic baseline.

**Rationale:**

1. **Separation of Concerns:** The migration journal is a runtime execution tracking mechanism, not part of the application schema. It tracks which migrations have been applied, but it does not define application data structures or constraints.

2. **Fresh Database vs Initialized Database:** A fresh database (no migrations applied) should have the same semantic baseline as an initialized @0012 database (migrations applied, journal populated). The difference is runtime state, not schema semantics.

3. **Baseline Purpose:** The @0012 baseline is meant to validate that the current database schema matches the expected application schema. The journal's presence or absence does not affect the application schema itself.

4. **Migration Framework Independence:** Different migration frameworks (Drizzle, Flyway, Liquibase, custom) use different journal structures. The semantic baseline should be framework-agnostic.

5. **Journal Contents Do Not Affect Schema:** The journal contains metadata about migration execution (hash, applied_at). These are runtime tracking data, not schema definitions.

**Implementation:**
- `__drizzle_migrations` table is **excluded** from the canonical catalog
- Baseline fingerprint is calculated over application schema only
- A database with or without the journal should produce the same fingerprint if the application schema is identical

**Note:** This decision may be revisited if the project requirements explicitly require journal inclusion (e.g., for framework-specific baseline validation).

## 6. Canonical Serialization Contract

### 6.1 JSON Structure

```typescript
interface CanonicalCatalog {
  version: number;           // Contract version
  baselineMigration: string; // e.g., "0012"
  tables: CanonicalTable[];
  enums: CanonicalEnum[];
  sequences: CanonicalSequence[];
}

interface CanonicalTable {
  schema: string;
  name: string;
  columns: CanonicalColumn[];
  constraints: CanonicalConstraint[];
  indexes: CanonicalIndex[];
}

interface CanonicalColumn {
  name: string;
  ordinalPosition: number;
  dataType: string;
  nullable: boolean;
  defaultValue: string | null;
  generatedExpression: string | null;
}

interface CanonicalConstraint {
  name: string | null;  // null for PostgreSQL-generated constraints
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK';
  columns: string[];
  references?: {
    schema: string;
    table: string;
    columns: string[];
  };
}

interface CanonicalIndex {
  name: string;
  unique: boolean;
  method: string;
  columns: string[];
  expressions: string[];
  partialPredicate: string | null;
}

interface CanonicalEnum {
  schema: string;
  name: string;
  values: string[];
}

interface CanonicalSequence {
  schema: string;
  name: string;
  dataType: string;
  start: number;
  increment: number;
  minimum: number | null;
  maximum: number | null;
  cache: number;
  cycled: boolean;
}
```

### 6.2 Deterministic Ordering Rules

1. **Tables:** Sort by (schema, name) - ascending, case-sensitive
2. **Columns:** Sort by ordinal_position - ascending
3. **Constraints:** Sort by (name, type, columns) - ascending, nulls first
4. **Indexes:** Sort by (name, table) - ascending
5. **Enums:** Sort by (schema, name) - ascending
6. **Enum Values:** Sort by value - ascending, case-sensitive
7. **Sequences:** Sort by (schema, name) - ascending

### 6.3 Normalization Rules

1. **Default Values:**
   - Remove PostgreSQL type casts: `'value'::type` → `value`
   - Remove quotes from simple values: `'value'` → `value`
   - Preserve function calls: `now()`, `gen_random_uuid()`, etc.
   - Normalize whitespace: trim, single spaces

2. **Constraint Names:**
   - PostgreSQL-generated pattern `^\d+_\d+_\d+_(not_null|check)$` → `null`
   - User-defined names preserved as-is

3. **String Encoding:**
   - UTF-8
   - No BOM
   - Literal unicode characters (not escaped)

4. **Numeric Representation:**
   - Integers: decimal notation (no leading zeros)
   - Floats: decimal notation, scientific notation for very large/small values

5. **Boolean Representation:**
   - Lowercase: `true` / `false`

6. **Null Representation:**
   - JSON `null` for absent values

### 6.4 Serialization Rules

1. **JSON.stringify:**
   - Use `JSON.stringify(obj, null, 2)` for human-readable output
   - For hashing, use `JSON.stringify(obj)` (compact) to avoid whitespace differences
   - Property order: JavaScript object key order is deterministic enough for ES2015+, but to be safe, explicitly sort keys where order matters

2. **Line Endings:**
   - LF (`\n`) only
   - No CRLF (`\r\n`)

3. **Trailing Whitespace:**
   - No trailing whitespace on any line
   - No trailing newline at end of file (for compact JSON)

4. **Hash Algorithm:**
   - SHA-256
   - Hexadecimal output (lowercase)

### 6.5 Encoding

- UTF-8
- No BOM
- ASCII-compatible where possible (ASCII characters as single bytes)

## 7. Hash Pipeline

```
PostgreSQL Database
    ↓
Schema Introspection (via SQL queries)
    ↓
Raw Catalog (with OIDs, metadata)
    ↓
Normalization (remove OIDs, filter constraints, normalize defaults)
    ↓
Canonical Catalog (deterministic structure, sorted)
    ↓
JSON.stringify (compact, no whitespace)
    ↓
UTF-8 encoding
    ↓
SHA-256 hash
    ↓
Fingerprint (hexadecimal, lowercase)
```

## 8. Contract Version

**Current Version:** 1

**Changes:**
- Initial definition

## 9. PostgreSQL Version Considerations

**Supported Versions:** PostgreSQL 14+ (current testing on 17.6)

**Version-Sensitive Metadata:**
- Data type representations may vary between versions (e.g., `varchar(n)` vs `text`)
- Default value encoding may vary
- Index metadata availability may vary

**Stability Strategy:**
- Use `information_schema` views where possible (more stable across versions)
- Normalize version-specific encodings in defaults
- Avoid relying on version-specific pg_catalog fields
- Document any version-specific assumptions

## 10. Artifact Separation

**Semantic Schema Fingerprint:**
- Purpose: Validate that database schema matches expected @0012 baseline
- Algorithm: SHA-256 of canonical catalog
- Format: 64-character hexadecimal string
- Example: `abcd1234...`

**Canonical Artifact SHA:**
- Purpose: Validate that the canonical artifact file itself has not been tampered with
- Algorithm: SHA-256 of artifact file bytes
- Format: 64-character hexadecimal string
- Example: `wxyz9876...`

**Relationship:**
- These are independent hashes
- Artifact SHA validates file integrity
- Schema fingerprint validates database state
- Both should be stored and checked independently
