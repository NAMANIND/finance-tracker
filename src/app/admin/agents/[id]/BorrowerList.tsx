import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BorrowerWithLoans } from "./types";

interface BorrowerListProps {
  agentId: string;
}

export default function BorrowerList({ agentId }: BorrowerListProps) {
  const [borrowers, setBorrowers] = React.useState<BorrowerWithLoans[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchBorrowers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/admin/agents/${agentId}/borrowers`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch borrowers");
        }

        const data = await res.json();
        setBorrowers(data);
      } catch (error) {
        console.error("Error fetching borrowers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBorrowers();
  }, [agentId]);

  if (loading) {
    return <div>Loading borrowers...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Borrowers</h2>
        <Link href={`/admin/borrowers/new?agentId=${agentId}`}>
          <Button>Add New Borrower</Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {borrowers.map((borrower) => (
          <Card key={borrower.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{borrower.name}</h3>
                  <p className="text-sm text-gray-500">{borrower.phone}</p>
                </div>
                <Link href={`/admin/borrowers/${borrower.id}`}>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Active Loans</p>
                  <p className="font-semibold">{borrower.loans.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-semibold">
                    ₹
                    {borrower.loans
                      .reduce((acc, loan) => acc + loan.principalAmount, 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge
                    variant={borrower.isActive ? "success" : "destructive"}
                  >
                    {borrower.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {borrowers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No borrowers found for this agent.
          </div>
        )}
      </div>
    </div>
  );
}
