import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  CreditCard, 
  Building2, 
  IndianRupee, 
  ArrowUpRight, 
  ArrowDownLeft,
  User,
  Phone,
  Banknote,
  FileText,
  CreditCard as CreditCardIcon,
  QrCode,
  Calendar,
  Shield,
  AlertCircle,
  Landmark
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define PropTypes for BankAccount
const bankAccountPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  bankName: PropTypes.string.isRequired,
  accountNumber: PropTypes.string.isRequired,
  accountType: PropTypes.string.isRequired,
  balance: PropTypes.number.isRequired,
  currency: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['active', 'inactive']).isRequired,
  lastTransaction: PropTypes.string.isRequired,
  upiId: PropTypes.string,
  ifscCode: PropTypes.string,
  branchName: PropTypes.string,
  accountHolderName: PropTypes.string.isRequired,
  openingDate: PropTypes.string.isRequired,
  nomineeName: PropTypes.string,
  nomineeRelation: PropTypes.string,
  payeeName: PropTypes.string.isRequired,
  payeePhone: PropTypes.string.isRequired,
  payeeType: PropTypes.oneOf(['bank', 'upi']).isRequired,
  accountPurpose: PropTypes.string.isRequired,
  panNumber: PropTypes.string.isRequired
});

const BankAccounts = () => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [accountPurposes, setAccountPurposes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch bank accounts
        const accountsResponse = await fetch('/api/bank-accounts');
        if (!accountsResponse.ok || !accountsResponse.headers.get('content-type')?.includes('application/json')) {
          throw new Error('API endpoint not available');
        }
        const accountsData = await accountsResponse.json();
        setAccounts(accountsData);

        // Fetch account purposes
        const purposesResponse = await fetch('/api/account-purposes');
        if (purposesResponse.ok && purposesResponse.headers.get('content-type')?.includes('application/json')) {
          const purposesData = await purposesResponse.json();
          setAccountPurposes(purposesData);
        }

        // Fetch recent transactions
        const transactionsResponse = await fetch('/api/bank-accounts/transactions');
        if (transactionsResponse.ok && transactionsResponse.headers.get('content-type')?.includes('application/json')) {
          const transactionsData = await transactionsResponse.json();
          setTransactions(transactionsData);
        }

        // Fetch account types
        const typesResponse = await fetch('/api/account-types');
        if (typesResponse.ok && typesResponse.headers.get('content-type')?.includes('application/json')) {
          const typesData = await typesResponse.json();
          setAccountTypes(typesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Unable to connect to the server.');
        setAccounts([]);
        setAccountPurposes([]);
        setTransactions([]);
        setAccountTypes([]);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddAccount = () => {
    if (!formData.payeeName || !formData.payeePhone || !formData.payeeType || 
        !formData.accountPurpose || !formData.panNumber) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.payeeType === 'bank' && (!formData.accountNumber || !formData.ifscCode)) {
      toast({
        title: "Error",
        description: "Please fill in all bank account details",
        variant: "destructive",
      });
      return;
    }

    const newAccount = {
      id: Date.now().toString(),
      bankName: formData.bankName || '',
      accountNumber: formData.accountNumber || '',
      accountType: formData.accountType || 'savings',
      balance: formData.balance || 0,
      currency: "INR",
      status: "active",
      lastTransaction: new Date().toISOString().split('T')[0],
      upiId: formData.upiId,
      ifscCode: formData.ifscCode || '',
      branchName: formData.branchName || '',
      accountHolderName: formData.payeeName,
      openingDate: formData.openingDate || new Date().toISOString().split('T')[0],
      payeeName: formData.payeeName,
      payeePhone: formData.payeePhone,
      payeeType: formData.payeeType,
      accountPurpose: formData.accountPurpose,
      panNumber: formData.panNumber
    };

    setAccounts([...accounts, newAccount]);
    setIsAddDialogOpen(false);
    setFormData({});
    toast({
      title: "Success",
      description: "Account added successfully",
    });
  };

  const handleEditAccount = () => {
    if (!selectedAccount || !formData.bankName || !formData.accountNumber || !formData.accountType) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const updatedAccounts = accounts.map(account => 
      account.id === selectedAccount.id 
        ? { ...account, ...formData }
        : account
    );

    setAccounts(updatedAccounts);
    setIsEditDialogOpen(false);
    setSelectedAccount(null);
    setFormData({});
    toast({
      title: "Success",
      description: "Bank account updated successfully",
    });
  };

  const handleDeleteAccount = (accountId) => {
    const updatedAccounts = accounts.filter(account => account.id !== accountId);
    setAccounts(updatedAccounts);
    toast({
      title: "Success",
      description: "Bank account deleted successfully",
    });
  };

  const openEditDialog = (account) => {
    setSelectedAccount(account);
    setFormData(account);
    setIsEditDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Bank Accounts</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your bank accounts and transactions
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-center">Add Bank Account or UPI ID</DialogTitle>
                <p className="text-center text-muted-foreground text-sm sm:text-base">Fill in the details to add a new account</p>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <h3 className="text-base sm:text-lg font-semibold">Personal Details</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm sm:text-base">
                        <User className="h-4 w-4 text-blue-600" />
                        Payee Name*
                      </Label>
                      <Input 
                        placeholder="Enter Payee Name" 
                        value={formData.payeeName || ''}
                        onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm sm:text-base">
                        <Phone className="h-4 w-4 text-blue-600" />
                        Payee Phone*
                      </Label>
                      <Input 
                        placeholder="Enter Phone Number" 
                        value={formData.payeePhone || ''}
                        onChange={(e) => setFormData({ ...formData, payeePhone: e.target.value })}
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm sm:text-base">
                      <Landmark className="h-4 w-4 text-blue-600" />
                      Payee Type*
                    </Label>
                    <select 
                      className="w-full p-2 border rounded-md border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={formData.payeeType || ''}
                      onChange={(e) => setFormData({ ...formData, payeeType: e.target.value })}
                    >
                      <option value="">Select Payee Type</option>
                      <option value="bank" className="flex items-center gap-2">
                        <Landmark className="h-4 w-4 inline-block mr-2" />
                        Bank Account
                      </option>
                      <option value="upi" className="flex items-center gap-2">
                        <QrCode className="h-4 w-4 inline-block mr-2" />
                        UPI ID
                      </option>
                    </select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-blue-600" />
                    <h3 className="text-base sm:text-lg font-semibold">Bank / UPI Details</h3>
                  </div>
                  {formData.payeeType === 'bank' ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-sm sm:text-base">
                            <Landmark className="h-4 w-4 text-blue-600" />
                            Account Number
                          </Label>
                          <Input 
                            placeholder="Bank Account Number" 
                            value={formData.accountNumber || ''}
                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                            className="border-blue-200 focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-sm sm:text-base">
                            <FileText className="h-4 w-4 text-blue-600" />
                            IFSC Code
                          </Label>
                          <Input 
                            placeholder="IFSC Code (11 letters)" 
                            value={formData.ifscCode || ''}
                            onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                            className="border-blue-200 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm sm:text-base">
                        <QrCode className="h-4 w-4 text-blue-600" />
                        UPI ID
                      </Label>
                      <Input 
                        placeholder="Enter UPI ID" 
                        value={formData.upiId || ''}
                        onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h3 className="text-base sm:text-lg font-semibold">Additional Details</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm sm:text-base">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Account Purpose*
                      </Label>
                      <Select 
                        value={formData.accountPurpose} 
                        onValueChange={(value) => setFormData({...formData, accountPurpose: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          {accountPurposes.map((purpose) => (
                            <SelectItem key={purpose} value={purpose}>
                              {purpose}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm sm:text-base">
                        <Shield className="h-4 w-4 text-blue-600" />
                        PAN CARD Number*
                      </Label>
                      <Input 
                        placeholder="10 digit PAN Number" 
                        value={formData.panNumber || ''}
                        onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    onClick={handleAddAccount}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Account
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card key={account.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {account.payeeType === 'bank' ? (
                      <Landmark className="h-5 w-5 text-blue-600" />
                    ) : (
                      <QrCode className="h-5 w-5 text-blue-600" />
                    )}
                    <CardTitle className="text-base sm:text-lg">{account.payeeName}</CardTitle>
                  </div>
                  <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                    {account.payeeType === 'bank' ? 'Bank Account' : 'UPI ID'}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {account.payeeType === 'bank' ? `Account: ${account.accountNumber}` : `UPI: ${account.upiId}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <span className="text-sm font-medium">{account.payeePhone}</span>
                  </div>
                  {account.payeeType === 'bank' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">IFSC Code</span>
                        <span className="text-sm font-medium">{account.ifscCode}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Balance</span>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-4 w-4" />
                          <span className="font-semibold">{account.balance.toLocaleString()}</span>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Purpose</span>
                    <span className="text-sm font-medium">{account.accountPurpose}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">PAN Number</span>
                    <span className="text-sm font-medium">{account.panNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openEditDialog(account)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleDeleteAccount(account.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Recent Transactions</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              View your recent bank transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm sm:text-base">Date</TableHead>
                    <TableHead className="text-sm sm:text-base">Description</TableHead>
                    <TableHead className="text-sm sm:text-base">Account</TableHead>
                    <TableHead className="text-sm sm:text-base">Amount</TableHead>
                    <TableHead className="text-sm sm:text-base">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-sm sm:text-base">{transaction.date}</TableCell>
                      <TableCell className="text-sm sm:text-base">{transaction.description}</TableCell>
                      <TableCell className="text-sm sm:text-base">{transaction.account}</TableCell>
                      <TableCell className={`${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'} text-sm sm:text-base`}>
                        {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {transaction.type === 'credit' ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4 text-red-600" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bank Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input 
                placeholder="Enter bank name" 
                value={formData.bankName || ''}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input 
                placeholder="Enter account number" 
                value={formData.accountNumber || ''}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select 
                value={formData.accountType || ''} 
                onValueChange={(value) => setFormData({ ...formData, accountType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Balance</Label>
              <Input 
                type="number" 
                placeholder="Enter balance" 
                value={formData.balance || ''}
                onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>UPI ID</Label>
              <Input 
                placeholder="Enter UPI ID" 
                value={formData.upiId || ''}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleEditAccount}>Save Changes</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

// Add PropTypes validation
BankAccounts.propTypes = {
  accounts: PropTypes.arrayOf(bankAccountPropTypes),
  selectedAccount: bankAccountPropTypes,
  formData: PropTypes.object
};

export default BankAccounts; 