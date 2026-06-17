import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Trash2, Edit2, Plus } from "lucide-react";

const LIABILITY_CATEGORIES = [
  { value: "personal_loan", label: "Personal Loan" },
  { value: "home_loan", label: "Home Loan" },
  { value: "car_loan", label: "Car Loan" },
  { value: "credit_card", label: "Credit Card" },
  { value: "education_loan", label: "Education Loan" },
  { value: "other", label: "Other" },
];

export default function Liabilities() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "personal_loan",
    amount: "",
    interestRate: "",
    dueDate: "",
    notes: "",
  });

  const liabilitiesQuery = trpc.liabilities.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createMutation = trpc.liabilities.create.useMutation({
    onSuccess: () => {
      utils.liabilities.list.invalidate();
      utils.analytics.netWorth.invalidate();
      utils.analytics.portfolioBreakdown.invalidate();
      toast.success("Liability added successfully");
      resetForm();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add liability");
    },
  });

  const updateMutation = trpc.liabilities.update.useMutation({
    onSuccess: () => {
      utils.liabilities.list.invalidate();
      utils.analytics.netWorth.invalidate();
      utils.analytics.portfolioBreakdown.invalidate();
      toast.success("Liability updated successfully");
      resetForm();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update liability");
    },
  });

  const deleteMutation = trpc.liabilities.delete.useMutation({
    onSuccess: () => {
      utils.liabilities.list.invalidate();
      utils.analytics.netWorth.invalidate();
      utils.analytics.portfolioBreakdown.invalidate();
      toast.success("Liability deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete liability");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "personal_loan",
      amount: "",
      interestRate: "",
      dueDate: "",
      notes: "",
    });
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: {
          name: formData.name,
          category: formData.category as any,
          amount: parseFloat(formData.amount),
          interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
          notes: formData.notes || undefined,
        },
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        category: formData.category as any,
        amount: parseFloat(formData.amount),
        interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        notes: formData.notes || undefined,
      });
    }
  };

  const handleEdit = (liability: any) => {
    setFormData({
      name: liability.name,
      category: liability.category,
      amount: liability.amount,
      interestRate: liability.interestRate || "",
      dueDate: liability.dueDate ? new Date(liability.dueDate).toISOString().split("T")[0] : "",
      notes: liability.notes || "",
    });
    setEditingId(liability.id);
    setOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getCategoryLabel = (category: string) => {
    return LIABILITY_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Liabilities</h1>
          <p className="text-muted-foreground mt-1">Manage your debts and obligations</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); }} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Liability
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Liability" : "Add New Liability"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update the liability details below" : "Enter the details of your new liability"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Liability Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., HDFC Home Loan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LIABILITY_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="flex-1">
                  {editingId ? "Update" : "Add"} Liability
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Your Liabilities</CardTitle>
          <CardDescription>
            {liabilitiesQuery.data ? `${liabilitiesQuery.data.length} liabilit${liabilitiesQuery.data.length !== 1 ? "ies" : "y"} total` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {liabilitiesQuery.isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : liabilitiesQuery.data && liabilitiesQuery.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Interest Rate</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liabilitiesQuery.data.map((liability) => (
                    <TableRow key={liability.id}>
                      <TableCell className="font-medium">{liability.name}</TableCell>
                      <TableCell>{getCategoryLabel(liability.category)}</TableCell>
                      <TableCell className="font-semibold text-red-600">{formatCurrency(parseFloat(liability.amount.toString()))}</TableCell>
                      <TableCell>{liability.interestRate ? `${liability.interestRate}%` : "N/A"}</TableCell>
                      <TableCell>{liability.dueDate ? new Date(liability.dueDate).toLocaleDateString("en-IN") : "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(liability)}
                            disabled={updateMutation.isPending}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate({ id: liability.id })}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No liabilities yet. Add your first liability to get started.</p>
              <Button onClick={() => setOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Liability
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
