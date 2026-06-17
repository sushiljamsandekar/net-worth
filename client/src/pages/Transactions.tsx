import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

export default function Transactions() {
  const { user } = useAuth();

  const transactionsQuery = trpc.transactions.list.useQuery({ limit: 100, offset: 0 }, {
    enabled: !!user,
  });

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getTransactionBadgeColor = (type: string) => {
    switch (type) {
      case "asset_add":
        return "bg-green-100 text-green-800";
      case "asset_update":
        return "bg-blue-100 text-blue-800";
      case "asset_delete":
        return "bg-red-100 text-red-800";
      case "liability_add":
        return "bg-orange-100 text-orange-800";
      case "liability_update":
        return "bg-yellow-100 text-yellow-800";
      case "liability_delete":
        return "bg-red-100 text-red-800";
      case "goal_add":
        return "bg-purple-100 text-purple-800";
      case "goal_update":
        return "bg-indigo-100 text-indigo-800";
      case "goal_delete":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTransactionLabel = (type: string) => {
    return type.replace(/_/g, " ").toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
        <p className="text-muted-foreground mt-1">View all changes to your financial data</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            {transactionsQuery.data ? `${transactionsQuery.data.length} transaction${transactionsQuery.data.length !== 1 ? "s" : ""} total` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsQuery.isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : transactionsQuery.data && transactionsQuery.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsQuery.data.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium text-sm">
                        {new Date(transaction.createdAt).toLocaleString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTransactionBadgeColor(transaction.type)}>
                          {getTransactionLabel(transaction.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{transaction.entityType}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {transaction.amount ? formatCurrency(transaction.amount) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No transactions yet. Start by adding assets or liabilities.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
