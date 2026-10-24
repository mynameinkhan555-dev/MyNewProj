/**
 * Schema Fingerprint Calculator
 * Calculates SHA-256 fingerprint from normalized schema catalog according to BASELINE-CONTRACT.md
 */

import { createHash } from 'crypto';
import { Catalog } from './introspection.js';

export interface FingerprintResult {
  fingerprint: string;
  algorithm: string;
  version: number;
  catalog: Catalog;
}

export class SchemaFingerprintCalculator {
  private readonly algorithm = 'sha256';
  private readonly version = 1;

  calculate(catalog: Catalog): FingerprintResult {
    const normalized = this.normalizeCatalog(catalog);
    const hash = createHash(this.algorithm);
    // Use compact JSON for hashing (no whitespace) to avoid formatting differences
    hash.update(JSON.stringify(normalized));
    const fingerprint = hash.digest('hex');

    return {
      fingerprint,
      algorithm: this.algorithm,
      version: this.version,
      catalog: normalized,
    };
  }

  private normalizeCatalog(catalog: Catalog): any {
    // Sort tables by (schema, name)
    const sortedTables = [...catalog.tables].sort((a, b) => {
      if (a.schema !== b.schema) return a.schema.localeCompare(b.schema);
      return a.name.localeCompare(b.name);
    });

    // Sort enums by (schema, name)
    const sortedEnums = [...catalog.enums].sort((a, b) => {
      if (a.schema !== b.schema) return a.schema.localeCompare(b.schema);
      return a.name.localeCompare(b.name);
    });

    // Sort sequences by (schema, name)
    const sortedSequences = [...catalog.sequences].sort((a, b) => {
      if (a.schema !== b.schema) return a.schema.localeCompare(b.schema);
      return a.name.localeCompare(b.name);
    });

    return {
      version: this.version,
      tables: sortedTables.map(table => this.normalizeTable(table)),
      enums: sortedEnums,
      sequences: sortedSequences,
    };
  }

  private normalizeTable(table: any): any {
    // Columns are already sorted by ordinal_position from introspection
    // Sort constraints by (name, type, columns)
    const sortedConstraints = [...table.constraints].sort((a: any, b: any) => {
      // Handle null names (auto-generated constraints)
      const aName = a.name ?? '';
      const bName = b.name ?? '';
      if (aName !== bName) return aName.localeCompare(bName);
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      // Handle empty columns arrays (CHECK constraints)
      const aCols = a.columns?.join(',') ?? '';
      const bCols = b.columns?.join(',') ?? '';
      return aCols.localeCompare(bCols);
    });

    // Sort indexes by (name, table)
    const sortedIndexes = [...table.indexes].sort((a: any, b: any) => {
      if (a.name !== b.name) return a.name.localeCompare(b.name);
      return a.table.localeCompare(b.table);
    });

    return {
      schema: table.schema,
      name: table.name,
      columns: table.columns,
      constraints: sortedConstraints,
      indexes: sortedIndexes,
    };
  }
}
