import React from 'react';
import clsx from 'clsx';
import { Skeleton } from './Skeleton';

export function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data available',
  keyField = 'id',
  className = '',
}) {
  return (
    <div className={clsx('w-full overflow-hidden rounded-xl border border-card-border bg-card shadow-card', className)}>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-start border-collapse text-sm">
          <thead>
            <tr className="border-b border-card-border bg-section-band text-muted font-semibold text-xs uppercase tracking-wider">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'py-3.5 px-4 text-start font-semibold whitespace-nowrap',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {loading ? (
              Array.from({ length: 4 }).map((_, rIdx) => (
                <tr key={`loading-${rIdx}`} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={`loading-${rIdx}-${col.key}`} className="py-4 px-4">
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-muted text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row[keyField] ?? rowIdx}
                  className="even:bg-section-band/40 hover:bg-brand-soft/30 transition-colors duration-300 ease-nexus"
                >
                  {columns.map((col) => (
                    <td
                      key={`${row[keyField] ?? rowIdx}-${col.key}`}
                      className={clsx('py-3.5 px-4 text-on-surface', col.className)}
                    >
                      {col.render ? col.render(row, rowIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
