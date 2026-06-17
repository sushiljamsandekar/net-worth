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

const ASSET_CATEGORIES = [
  { value: "cash", label: "Cash" },
  { value: "savings_account", label: "Savings Account" },
  { value: "stocks", label: "Stocks" },
  { value: "mutual_funds", label: "Mutual Funds" },
  { value: "bonds", label: "Bonds" },
  { value: "fixed_deposits", label: "Fixed Deposits" },
  { value: "real_estate", label: "Real Estate" },
  { value: "crypto", label: "Cryptocurrency" },
  { value: "gold", label: "Gold" },
  { value: "vehicles", label: "Vehicles" },
  { value: "other", label: "Other" },
];

export default function Assets() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "cash",
    amount: "",
    dateAdded: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const assetsQuery = trpc.assets.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createMutation = trpc.assets.create.useMutation({
    onSuccess: () => {
      utils.assets.list.invalidate();
      utils.analytics.netWorth.invalidate();
      utils.analytics.portfolioBreakdown.invalidate();
      utils.analytics.riskMeter.invalidate();
      toast.success("Asset added successfully");
      resetForm();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add asset");
    },
  });

  const updateMutation = trpc.assets.update.useMutation({
    onSuccess: () => {
      utils.assets.list.invalidate();
      utils.analytics.netWorth.invalidate();
      utils.analytics.portfolioBreakdown.invalidate();
      utils.analytics.riskMeter.invalidate();
      toast.success("Asset updated successfully");
      resetForm();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update asset");
    },
  });

  const deleteMutation = trpc.assets.delete.useMutation({
    onSuccess: () => {
      utils.assets.list.invalidate();
      utils.analytics.netWorth.invalidate();
      utils.analytics.portfolioBreakdown.invalidate();
      utils.analytics.riskMeter.invalidate();
      toast.success("Asset deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete asset");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "cash",
      amount: "",
      dateAdded: new Date().toISOString().split("T")[0],
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
          dateAdded: new Date(formData.dateAdded),
          notes: formData.notes || undefined,
        },
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        category: formData.category as any,
        amount: parseFloat(formData.amount),
        dateAdded: new Date(formData.dateAdded),
        notes: formData.notes || undefined,
      });
    }
  };

  const handleEdit = (asset: any) => {
    setFormData({
      name: asset.name,
      category: asset.category,
      amount: asset.amount,
      dateAdded: new Date(asset.dateAdded).toISOString().split("T")[0],
      notes: asset.notes || "",
    });
    setEditingId(asset.id);
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
    return ASSET_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assets</h1>
          <p className="text-muted-foreground mt-1">Manage your financial assets</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); }} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Asset" : "Add New Asset"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update the asset details below" : "Enter the details of your new asset"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., HDFC Bank Savings"
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
                    {ASSET_CATEGORIES.map((cat) => (
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
                <Label htmlFor="dateAdded">Date Added *</Label>
                <Input
                  id="dateAdded"
                  type="date"
                  value={formData.dateAdded}
                  onChange={(e) => setFormData({ ...formData, dateAdded: e.target.value })}
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
                  {editingId ? "Update" : "Add"} Asset
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Your Assets</CardTitle>
          <CardDescription>
            {assetsQuery.data ? `${assetsQuery.data.length} asset${assetsQuery.data.length !== 1 ? "s" : ""} total` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assetsQuery.isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : assetsQuery.data && assetsQuery.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assetsQuery.data.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell>{getCategoryLabel(asset.category)}</TableCell>
                      <TableCell className="font-semibold text-green-600">{formatCurrency(parseFloat(asset.amount.toString()))}</TableCell>
                      <TableCell>{new Date(asset.dateAdded).toLocaleDateString("en-IN")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(asset)}
                            disabled={updateMutation.isPending}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate({ id: asset.id })}
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
              <p className="text-muted-foreground mb-4">No assets yet. Add your first asset to get started.</p>
              <Button onClick={() => setOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Asset
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
