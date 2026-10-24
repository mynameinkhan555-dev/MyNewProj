/**
 * Schema Introspection
 * Introspects PostgreSQL schema for fingerprint generation
 */

import { PostgresDatabase } from './database.js';

export interface DatabaseConfig {
  url: string;
}

export interface Column {
  schema: string;
  table: string;
  name: string;
  ordinalPosition: number;
  dataType: string;
  nullable: boolean;
  defaultValue: string | null;
  generatedExpression: string | null;
}

export interface Constraint {
  schema: string;
  table: string;
  name: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK' | 'NOT NULL';
  columns: string[];
  references?: {
    schema: string;
    table: string;
    columns: string[];
  };
}

export interface Index {
  schema: string;
  table: string;
  name: string;
  columns: string[];
  unique: boolean;
  method: string;
  expressions: string[];
  partialPredicate: string | null;
}

export interface Table {
  schema: string;
  name: string;
  columns: Column[];
  constraints: Constraint[];
  indexes: Index[];
}

export interface NormalizedTable {
  schema: string;
  name: string;
  columns: Column[];
  constraints: NormalizedConstraint[];
  indexes: Index[];
}

export interface Enum {
  schema: string;
  name: string;
  values: string[];
}

export interface Sequence {
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

export interface Catalog {
  tables: Table[];
  enums: Enum[];
  sequences: Sequence[];
}

export interface NormalizedConstraint {
  schema: string;
  table: string;
  name: string | null;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK' | 'NOT NULL';
  columns: string[];
  references?: {
    schema: string;
    table: string;
    columns: string[];
  };
}

export class SchemaIntrospector {
  constructor(private db: PostgresDatabase) {}

  async inspect(): Promise<Catalog> {
    const tables = await this.getTables();
    const enums = await this.getEnums();
    const sequences = await this.getSequences();
    const catalog: Catalog = { tables, enums, sequences };

    for (const table of tables) {
      table.columns = await this.getColumns(table.schema, table.name);
      table.constraints = await this.getConstraints(table.schema, table.name);
      table.indexes = await this.getIndexes(table.schema, table.name);
    }

    return catalog;
  }

  private async getTables(): Promise<Table[]> {
    const result = await this.db.query(`
      SELECT
        table_schema as schema,
        table_name as name
      FROM information_schema.tables
      WHERE
        table_schema NOT IN ('pg_catalog', 'information_schema')
        AND table_type = 'BASE TABLE'
        AND table_name != '__drizzle_migrations'
      ORDER BY table_schema, table_name
    `);

    return result.rows.map(row => ({
      schema: row.schema,
      name: row.name,
      columns: [],
      constraints: [],
      indexes: [],
    }));
  }

  private async getColumns(schema: string, table: string): Promise<Column[]> {
    const result = await this.db.query(
      `
      SELECT
        column_name as name,
        ordinal_position,
        data_type,
        is_nullable,
        column_default,
        generation_expression
      FROM information_schema.columns
      WHERE
        table_schema = $1
        AND table_name = $2
      ORDER BY ordinal_position
      `,
      [schema, table]
    );

    return result.rows.map(row => ({
      schema,
      table,
      name: row.name,
      ordinalPosition: row.ordinal_position,
      dataType: row.data_type,
      nullable: row.is_nullable === 'YES',
      defaultValue: row.column_default,
      generatedExpression: row.generation_expression,
    }));
  }

  private async getConstraints(schema: string, table: string): Promise<Constraint[]> {
    // Get PRIMARY KEY, UNIQUE, FOREIGN KEY constraints with columns
    const pkResult = await this.db.query(
      `
      SELECT
        tc.constraint_name as name,
        tc.constraint_type as type,
        kcu.column_name,
        rc.unique_constraint_schema as ref_schema,
        rc.unique_constraint_name as ref_table_name,
        ccu.column_name as ref_column
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
        AND tc.constraint_schema = rc.constraint_schema
      LEFT JOIN information_schema.key_column_usage ccu
        ON rc.unique_constraint_name = ccu.constraint_name
        AND rc.unique_constraint_schema = ccu.constraint_schema
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.constraint_schema = kcu.constraint_schema
        AND tc.table_name = kcu.table_name
      WHERE
        tc.table_schema = $1
        AND tc.table_name = $2
        AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY')
      ORDER BY tc.constraint_name, kcu.ordinal_position
      `,
      [schema, table]
    );

    const constraints = new Map<string, Constraint>();

    for (const row of pkResult.rows) {
      if (!constraints.has(row.name)) {
        const constraint: Constraint = {
          schema,
          table,
          name: row.name,
          type: row.type as any,
          columns: [],
        };

        if (row.type === 'FOREIGN KEY' && row.ref_schema) {
          constraint.references = {
            schema: row.ref_schema,
            table: row.ref_table_name,
            columns: [],
          };
        }

        constraints.set(row.name, constraint);
      }

      constraints.get(row.name)!.columns.push(row.column_name);
      if (row.type === 'FOREIGN KEY' && row.ref_column) {
        constraints.get(row.name)!.references!.columns.push(row.ref_column);
      }
    }

    // Get CHECK constraints separately (they don't appear in key_column_usage the same way)
    const checkResult = await this.db.query(
      `
      SELECT
        tc.constraint_name as name,
        tc.constraint_type as type
      FROM information_schema.table_constraints tc
      WHERE
        tc.table_schema = $1
        AND tc.table_name = $2
        AND tc.constraint_type = 'CHECK'
      ORDER BY tc.constraint_name
      `,
      [schema, table]
    );

    for (const row of checkResult.rows) {
      constraints.set(row.name, {
        schema,
        table,
        name: row.name,
        type: row.type as any,
        columns: [], // CHECK constraints don't have simple column references
      });
    }

    return Array.from(constraints.values());
  }

  private async getIndexes(schema: string, table: string): Promise<Index[]> {
    const result = await this.db.query(
      `
      SELECT
        i.relname as name,
        am.amname as method,
        idx.indisunique as unique,
        array_agg(a.attname ORDER BY array_position(idx.indkey, a.attnum)) as columns,
        pg_get_expr(idx.indexprs, idx.indrelid) as expressions,
        pg_get_expr(idx.indpred, idx.indrelid) as partial_predicate
      FROM pg_index idx
      JOIN pg_class i ON idx.indexrelid = i.oid
      JOIN pg_class t ON idx.indrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      JOIN pg_am am ON i.relam = am.oid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(idx.indkey)
      WHERE
        n.nspname = $1
        AND t.relname = $2
        AND NOT idx.indisprimary
      GROUP BY i.relname, am.amname, idx.indisunique, idx.indexprs, idx.indpred, idx.indkey, idx.indrelid
      ORDER BY i.relname
      `,
      [schema, table]
    );

    return result.rows.map(row => ({
      schema,
      table,
      name: row.name,
      columns: row.columns || [],
      unique: row.unique,
      method: row.method,
      expressions: row.expressions ? [row.expressions] : [],
      partialPredicate: row.partial_predicate || null,
    }));
  }

  private async getEnums(): Promise<Enum[]> {
    const result = await this.db.query(
      `
      SELECT
        t.typname as name,
        n.nspname as schema,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE
        n.nspname NOT IN ('pg_catalog', 'information_schema')
      GROUP BY t.typname, n.nspname
      ORDER BY n.nspname, t.typname
      `
    );

    return result.rows.map(row => ({
      schema: row.schema,
      name: row.name,
      values: row.values,
    }));
  }

  private async getSequences(): Promise<Sequence[]> {
    const result = await this.db.query(
      `
      SELECT
        n.nspname as schema,
        c.relname as name,
        format_type(s.seqtypid, null) as data_type,
        s.seqstart as start,
        s.seqincrement as increment,
        s.seqmin as minimum,
        s.seqmax as maximum,
        s.seqcache as cache,
        s.seqcycle as cycled
      FROM pg_sequence s
      JOIN pg_class c ON s.seqrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE
        n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND c.relname NOT LIKE '%__drizzle_migrations%'
      ORDER BY n.nspname, c.relname
      `
    );

    return result.rows.map(row => ({
      schema: row.schema,
      name: row.name,
      dataType: row.data_type,
      start: row.start,
      increment: row.increment,
      minimum: row.minimum,
      maximum: row.maximum,
      cache: row.cache,
      cycled: row.cycled,
    }));
  }
}
