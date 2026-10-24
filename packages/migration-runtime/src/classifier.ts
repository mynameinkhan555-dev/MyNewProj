/**
 * Migration Classification
 * Classifies migrations as legacy or atomic based on transaction ownership
 */

export enum MigrationType {
  Empty = 'empty',
  Legacy = 'legacy',
  Atomic = 'atomic',
}

export class MigrationClassifier {
  classify(sql: string): MigrationType {
    const trimmed = sql.trim();

    if (!trimmed || trimmed === '') {
      return MigrationType.Empty;
    }

    // Check if migration contains explicit BEGIN/COMMIT
    // This indicates legacy transaction ownership
    const hasBegin = /\bBEGIN\b/i.test(trimmed);
    const hasCommit = /\bCOMMIT\b/i.test(trimmed);

    if (hasBegin && hasCommit) {
      return MigrationType.Legacy;
    }

    // Future migrations without explicit transaction ownership are atomic
    return MigrationType.Atomic;
  }
}
