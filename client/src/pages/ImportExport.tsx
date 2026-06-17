import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { Download, Upload, FileDown, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ImportExport() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const utils = trpc.useUtils();

  const uploadMutation = trpc.importExport.uploadCSV.useMutation({
    onSuccess: (data: any) => {
      utils.assets.list.invalidate();
      utils.liabilities.list.invalidate();
      utils.goals.list.invalidate();
      utils.analytics.netWorth.invalidate();
      utils.analytics.portfolioBreakdown.invalidate();
      toast.success(`Successfully imported ${data.imported} records`);
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to import CSV");
      setIsImporting(false);
    },
  });

  const exportMutation = trpc.importExport.exportData.useMutation({
    onSuccess: (data: any) => {
      const csv = data.csv;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `net-worth-export-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Data exported successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to export data");
    },
  });

  const handleDownloadTemplate = async () => {
    try {
      const data = await (trpc.importExport.downloadTemplate as any).fetch();
      const csv = data.csv;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "net-worth-template.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Template downloaded successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to download template");
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setIsImporting(true);
    const text = await file.text();
    uploadMutation.mutate({ csv: text });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Import & Export</h1>
        <p className="text-muted-foreground mt-1">Manage your data with CSV files</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Use CSV import to bulk add assets, liabilities, and goals. Download the template to see the required format.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Download Template */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="w-5 h-5" />
              Download Template
            </CardTitle>
            <CardDescription>Get the CSV template to understand the format</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Download a sample CSV file that shows the required columns and format for importing your data.
            </p>
            <Button
              onClick={handleDownloadTemplate}
              disabled={false}
              className="w-full gap-2"
              variant="outline"
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </CardContent>
        </Card>

        {/* Import Data */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Data
            </CardTitle>
            <CardDescription>Upload a CSV file to import your data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Select a CSV file to import assets, liabilities, and goals into your account.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting || uploadMutation.isPending}
              className="w-full gap-2"
            >
              <Upload className="w-4 h-4" />
              {isImporting ? "Importing..." : "Choose File"}
            </Button>
          </CardContent>
        </Card>

        {/* Export Data */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Data
            </CardTitle>
            <CardDescription>Download all your data as CSV</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export all your assets, liabilities, and goals as a CSV file for backup or analysis.
            </p>
            <Button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="w-full gap-2"
              variant="outline"
            >
              <Download className="w-4 h-4" />
              Export Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>CSV Format Guide</CardTitle>
          <CardDescription>Understanding the CSV file structure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-foreground mb-2">Assets Format</h3>
            <code className="block bg-muted p-3 rounded text-sm overflow-x-auto">
              name,category,amount,dateAdded,notes
            </code>
            <p className="text-sm text-muted-foreground mt-2">
              Example: "HDFC Savings,savings_account,100000,2024-01-15,Monthly savings"
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">Liabilities Format</h3>
            <code className="block bg-muted p-3 rounded text-sm overflow-x-auto">
              name,category,amount,interestRate,dueDate,notes
            </code>
            <p className="text-sm text-muted-foreground mt-2">
              Example: "Home Loan,home_loan,5000000,7.5,2034-12-31,HDFC Bank"
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">Goals Format</h3>
            <code className="block bg-muted p-3 rounded text-sm overflow-x-auto">
              name,description,targetAmount,currentAmount,currency,targetDate
            </code>
            <p className="text-sm text-muted-foreground mt-2">
              Example: "House Down Payment,Save for house,1000000,250000,INR,2027-12-31"
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Tip:</strong> Download the template first to see the exact format. Dates should be in YYYY-MM-DD format.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
