import AdminLayout from '@/components/feature/AdminLayout';
import PaymentStats from './components/PaymentStats';
import TransactionTable from './components/TransactionTable';

export default function PaymentsPage() {
  return (
    <AdminLayout title="Payments" subtitle="Financial overview and reconciliation">
      <div className="space-y-5">
        <PaymentStats />

        <TransactionTable />
      </div>
    </AdminLayout>
  );
}
