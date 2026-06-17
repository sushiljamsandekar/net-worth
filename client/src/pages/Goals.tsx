import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Trash2, Edit2, Plus, Target, CheckCircle2 } from "lucide-react";

export default function Goals() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetAmount: "",
    currentAmount: "0",
    currency: "INR",
    targetDate: "",
  });

  const goalsQuery = trpc.goals.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createMutation = trpc.goals.create.useMutation({
    onSuccess: () => {
      utils.goals.list.invalidate();
      utils.analytics.netWorth.invalidate();
      toast.success("Goal created successfully");
      resetForm();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create goal");
    },
  });

  const updateMutation = trpc.goals.update.useMutation({
    onSuccess: () => {
      utils.goals.list.invalidate();
      utils.analytics.netWorth.invalidate();
      toast.success("Goal updated successfully");
      resetForm();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update goal");
    },
  });

  const deleteMutation = trpc.goals.delete.useMutation({
    onSuccess: () => {
      utils.goals.list.invalidate();
      utils.analytics.netWorth.invalidate();
      toast.success("Goal deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete goal");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      targetAmount: "",
      currentAmount: "0",
      currency: "INR",
      targetDate: "",
    });
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.targetAmount || !formData.targetDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: {
          name: formData.name,
          description: formData.description || undefined,
          targetAmount: parseFloat(formData.targetAmount),
          currentAmount: parseFloat(formData.currentAmount),
          currency: formData.currency,
          targetDate: new Date(formData.targetDate),
        },
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        description: formData.description || undefined,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount),
        currency: formData.currency,
        targetDate: new Date(formData.targetDate),
      });
    }
  };

  const handleEdit = (goal: any) => {
    setFormData({
      name: goal.name,
      description: goal.description || "",
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      currency: goal.currency,
      targetDate: new Date(goal.targetDate).toISOString().split("T")[0],
    });
    setEditingId(goal.id);
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

  const getProgressPercentage = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getDaysRemaining = (targetDate: Date) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Goals</h1>
          <p className="text-muted-foreground mt-1">Set and track your financial objectives</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); }} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Goal" : "Create New Goal"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update your goal details" : "Set a new financial goal to track"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Goal Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Save ₹10L for house down payment"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Additional details about this goal..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetAmount">Target Amount (₹) *</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    placeholder="1000000"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="currentAmount">Current Amount (₹)</Label>
                  <Input
                    id="currentAmount"
                    type="number"
                    placeholder="0"
                    value={formData.currentAmount}
                    onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="targetDate">Target Date *</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="flex-1">
                  {editingId ? "Update" : "Create"} Goal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goalsQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : goalsQuery.data && goalsQuery.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goalsQuery.data.map((goal) => {
            const progress = getProgressPercentage(parseFloat(goal.currentAmount.toString()), parseFloat(goal.targetAmount.toString()));
            const daysRemaining = getDaysRemaining(goal.targetDate);
            const isCompleted = progress >= 100;

            return (
              <Card key={goal.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      </div>
                      {goal.description && <CardDescription className="text-sm">{goal.description}</CardDescription>}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(goal)}
                        disabled={updateMutation.isPending}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate({ id: goal.id })}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-foreground">Progress</span>
                      <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Amount Info */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Current</p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(parseFloat(goal.currentAmount.toString()))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Target</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(parseFloat(goal.targetAmount.toString()))}</p>
                    </div>
                  </div>

                  {/* Remaining Amount & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(Math.max(0, parseFloat(goal.targetAmount.toString()) - parseFloat(goal.currentAmount.toString())))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Time Left</p>
                      <p className="text-sm font-semibold text-foreground">
                        {daysRemaining > 0 ? `${daysRemaining} days` : "Overdue"}
                      </p>
                    </div>
                  </div>

                  {/* Target Date */}
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    Target: {new Date(goal.targetDate).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16 text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No goals yet. Create your first financial goal to get started.</p>
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
