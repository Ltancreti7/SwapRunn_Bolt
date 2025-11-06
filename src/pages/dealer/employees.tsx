import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

interface Employee {
  id: string;
  dealer_id: string;
  name: string;
  email: string;
  role: string | null;
  created_at: string;
}

const EmployeesPage = () => {
  const { user, userProfile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Try to get dealer id from cached profile; fallback to null
  const dealerIdFromProfile = userProfile?.dealers?.id as string | undefined;
  const dealerId = useMemo(() => dealerIdFromProfile || null, [dealerIdFromProfile]);

  const fetchEmployees = async (currentDealerId: string) => {
    setListLoading(true);
    setError(null);
    try {
      const { data, error } = await (supabase as any)
        .from("employees")
        .select("id, dealer_id, name, email, role, created_at")
        .eq("dealer_id", currentDealerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (e: any) {
      console.error("Failed to fetch employees", e);
      setError(e?.message || "Failed to load employees");
    } finally {
      setListLoading(false);
    }
  };

  // If dealerId not present yet, try to resolve it from dealers by user_id
  useEffect(() => {
    const ensureDealerId = async () => {
      if (dealerId) {
        fetchEmployees(dealerId);
        return;
      }
      if (!user?.id) return;
      try {
        const { data, error } = await (supabase as any)
          .from("dealers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (data?.id) {
          fetchEmployees(data.id);
        }
      } catch (e) {
        console.error("Could not resolve dealer id", e);
      }
    };
    ensureDealerId();
  }, [dealerId, user?.id]);

  const handleAdd = async () => {
    if (!name.trim() || !email.trim()) return;

    const effectiveDealerId = dealerId;
    if (!effectiveDealerId) {
      setError("Dealer not found. Please reload or try again.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error } = await (supabase as any).from("employees").insert({
        dealer_id: effectiveDealerId,
        name: name.trim(),
        email: email.trim(),
        role: "staff",
      });
      if (error) throw error;

      setName("");
      setEmail("");
      await fetchEmployees(effectiveDealerId);
    } catch (e: any) {
      console.error("Add employee failed", e);
      setError(e?.message || "Failed to add employee");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!id) return;
    const effectiveDealerId = dealerId;
    if (!effectiveDealerId) return;

    try {
      const { error } = await (supabase as any)
        .from("employees")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await fetchEmployees(effectiveDealerId);
    } catch (e) {
      console.error("Remove employee failed", e);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Employees</h1>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add Employee</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-400"
            />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-400"
            />
            <Button
              onClick={handleAdd}
              disabled={loading || !name.trim() || !email.trim()}
              className="bg-[#E11900] hover:bg-[#B51400] text-white"
            >
              {loading ? "Adding..." : "Add"}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-red-400 mt-3">{error}</p>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Team Members</h2>
          {listLoading ? (
            <p className="text-neutral-400">Loading employees...</p>
          ) : employees.length === 0 ? (
            <p className="text-neutral-400">No employees added yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-800">
              {employees.map((emp) => (
                <li key={emp.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{emp.name}</p>
                    <p className="text-sm text-neutral-400">{emp.email}</p>
                  </div>
                  <Button
                    variant="secondary"
                    className="bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700"
                    onClick={() => handleRemove(emp.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;
