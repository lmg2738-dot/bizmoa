import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface TransactionItem {
  id: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  amount: number;
  transactionDate: string;
  source: string;
}

interface TransactionTableProps {
  transactions: TransactionItem[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <Card className="border-slate-200/80">
      <CardHeader>
        <CardTitle className="text-base font-semibold">최근 거래 내역</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>일시</TableHead>
              <TableHead>내역</TableHead>
              <TableHead>출처</TableHead>
              <TableHead className="text-right">금액</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="text-slate-500">
                  {formatDate(tx.transactionDate)}
                </TableCell>
                <TableCell className="font-medium">{tx.description}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px]">
                    {tx.source}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-semibold ${
                    tx.type === "INCOME" ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {tx.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
