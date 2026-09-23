import type { ReactNode } from 'react';

export type Column<T> = {
  id: string;
  header: string;
  cell(row: T): ReactNode;
  sortable?: boolean;
};
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  sort,
  onSort,
  empty,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey(row: T): string | number;
  sort?: { id: string; direction: 'ASC' | 'DESC' };
  onSort?(id: string): void;
  empty?: ReactNode;
}) {
  if (!rows.length)
    return (
      <>
        {empty ?? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No results found.
          </p>
        )}
      </>
    );
  return (
    <div
      className="overflow-x-auto"
      role="region"
      aria-label="Results table"
      tabIndex={0}
    >
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.id}
                className="px-3 py-2 font-medium"
                aria-sort={
                  sort?.id === column.id
                    ? sort.direction === 'ASC'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                {column.sortable && onSort ? (
                  <button type="button" onClick={() => onSort(column.id)}>
                    {column.header}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              className="border-b border-border last:border-0"
              key={rowKey(row)}
            >
              {columns.map((column) => (
                <td className="px-3 py-3" key={column.id}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
