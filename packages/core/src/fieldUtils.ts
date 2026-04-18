import type { FieldDef } from './parser';

export interface TruncatedFieldResult {
  visibleFields: FieldDef[];
  hiddenCount: number;
  allFieldsSorted: FieldDef[];
}

/** Sort fields: ID fields first (case-insensitive "id" in name), then alphabetical within each partition. */
export function sortFields(fields: FieldDef[]): FieldDef[] {
  const idFields: FieldDef[] = [];
  const nonIdFields: FieldDef[] = [];

  for (const field of fields) {
    if (field.name.toLowerCase().includes('id')) {
      idFields.push(field);
    } else {
      nonIdFields.push(field);
    }
  }

  const byName = (a: FieldDef, b: FieldDef) => a.name.localeCompare(b.name);
  idFields.sort(byName);
  nonIdFields.sort(byName);

  return [...idFields, ...nonIdFields];
}

/** Sort and truncate fields to fieldLimit. Returns visible fields + hidden count + all sorted. */
export function truncateFields(fields: FieldDef[], fieldLimit = 3): TruncatedFieldResult {
  const allFieldsSorted = sortFields(fields);

  if (fields.length <= fieldLimit) {
    return { visibleFields: allFieldsSorted, hiddenCount: 0, allFieldsSorted };
  }

  const visibleCount = fieldLimit - 1;
  return {
    visibleFields: allFieldsSorted.slice(0, visibleCount),
    hiddenCount: fields.length - visibleCount,
    allFieldsSorted,
  };
}
