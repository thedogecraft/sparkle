import { cn } from "@/lib/utils"

interface TableProps {
  children: React.ReactNode
  className?: string
}

function Table({ children, className }: TableProps) {
  return (
    <div className={cn("w-full overflow-auto rounded-xl border border-sparkle-border", className)}>
      <table className="w-full caption-bottom text-sm">{children}</table>
    </div>
  )
}

interface TableHeaderProps {
  children: React.ReactNode
  className?: string
}

function TableHeader({ children, className }: TableHeaderProps) {
  return <thead className={cn("[&_tr]:border-b border-sparkle-border", className)}>{children}</thead>
}

interface TableBodyProps {
  children: React.ReactNode
  className?: string
}

function TableBody({ children, className }: TableBodyProps) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)}>{children}</tbody>
}

interface TableRowProps {
  children: React.ReactNode
  className?: string
}

function TableRow({ children, className }: TableRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-sparkle-border transition-colors hover:bg-sparkle-accent/50",
        className,
      )}
    >
      {children}
    </tr>
  )
}

interface TableHeadProps {
  children?: React.ReactNode
  className?: string
}

function TableHead({ children, className }: TableHeadProps) {
  return (
    <th
      className={cn(
        "h-10 px-4 text-left align-middle font-medium text-sparkle-text-secondary text-xs uppercase tracking-wider",
        className,
      )}
    >
      {children}
    </th>
  )
}

interface TableCellProps {
  children?: React.ReactNode
  className?: string
}

function TableCell({ children, className }: TableCellProps) {
  return (
    <td className={cn("p-4 align-middle text-sparkle-text", className)}>
      {children}
    </td>
  )
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
export default Table
