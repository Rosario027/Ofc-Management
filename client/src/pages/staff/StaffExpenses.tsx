import { useState } from "react";
import { useExpenses, useCreateExpense } from "@/hooks/use-expenses";
import { useCurrentUser } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { Loader2, Plus, DollarSign, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const expenseCategories = [
  "Travel",
  "Meals",
  "Office Supplies",
  "Equipment",
  "Training",
  "Software",
  "Communication",
  "Other"
];

export default function StaffExpenses() {
  const { data: user } = useCurrentUser();
  const { data: expenses, isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    date: "",
    description: "",
  });

  const myExpenses = expenses?.filter(e => e.userId === user?.id) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createExpense.mutateAsync({
        userId: user.id,
        category: formData.category,
        amount: formData.amount,
        date: formData.date,
        description: formData.description,
        organizationId: user.organizationId,
      });
      toast({
        title: "Expense Request Submitted",
        description: "Your expense request has been submitted for approval.",
      });
      setIsOpen(false);
      setFormData({ category: "", amount: "", date: "", description: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit expense request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const totalPending = myExpenses
    .filter(e => e.status === "pending")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalApproved = myExpenses
    .filter(e => e.status === "approved")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display">Expense Requests</h2>
          <p className="text-muted-foreground">Submit and track your expense claims.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Submit Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(cat => (
                      <SelectItem key={cat} value={cat.toLowerCase().replace(" ", "_")}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the expense..."
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={createExpense.isPending}
              >
                {createExpense.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Expense"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myExpenses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPending.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalApproved.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Expense History */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Expense History</CardTitle>
          <CardDescription>Your expense claims and their approval status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No expense requests found. Create your first expense above.
              </div>
            ) : (
              myExpenses
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((expense) => (
                  <div 
                    key={expense.id} 
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium capitalize">{expense.category.replace("_", " ")}</p>
                          <StatusBadge status={expense.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(expense.date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">${Number(expense.amount).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(expense.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
