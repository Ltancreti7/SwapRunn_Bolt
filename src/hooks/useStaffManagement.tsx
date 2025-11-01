import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface StaffMember {
  id: string;
  user_id: string;
  role:
    | "owner"
    | "manager"
    | "salesperson"
    | "staff"
    | "sales"
    | "sales_manager"
    | "swap_manager"
    | "parts_manager"
    | "service_manager";
  joined_at: string;
  is_active: boolean;
  user_email?: string;
  user_name?: string;
}

export interface StaffInvitation {
  id: string;
  email: string;
  role:
    | "owner"
    | "manager"
    | "salesperson"
    | "staff"
    | "sales"
    | "sales_manager"
    | "swap_manager"
    | "parts_manager"
    | "service_manager";
  invite_token: string;
  expires_at: string;
  accepted_at?: string;
  invited_by: string;
}

export function useStaffManagement() {
  const { userProfile } = useAuth();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.dealer_id) {
      fetchStaffData();
      fetchUserRole();
    }
  }, [userProfile]);

  const fetchUserRole = async () => {
    if (!userProfile?.dealer_id) return;

    try {
      const { data } = await supabase
        .from("dealership_staff")
        .select("role")
        .eq("user_id", userProfile.user_id)
        .eq("dealer_id", userProfile.dealer_id)
        .eq("is_active", true)
        .single();

      setUserRole(data?.role || null);
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchStaffData = async () => {
    if (!userProfile?.dealer_id) return;

    setLoading(true);
    try {
      console.log("Fetching staff for dealer:", userProfile.dealer_id);

      // First, fetch staff members without profile join
      const { data: staffData, error: staffError } = await supabase
        .from("dealership_staff")
        .select("id, user_id, role, joined_at, is_active")
        .eq("dealer_id", userProfile.dealer_id)
        .eq("is_active", true)
        .order("joined_at", { ascending: true });

      if (staffError) {
        console.error("Staff fetch error:", staffError);
        throw staffError;
      }

      console.log("Staff data fetched:", staffData);

      if (!staffData || staffData.length === 0) {
        setStaffMembers([]);
        setInvitations([]);
        return;
      }

      // Extract user IDs
      const userIds = staffData.map((staff) => staff.user_id);
      console.log("Fetching profiles for user IDs:", userIds);

      // Fetch profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, first_name, last_name")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Profiles fetch error:", profilesError);
        // Don't throw here - continue with staff data without names
      }

      console.log("Profiles data fetched:", profilesData);

      // Create a map of user_id to profile for quick lookup
      const profilesMap = new Map();
      profilesData?.forEach((profile) => {
        profilesMap.set(profile.user_id, profile);
      });

      // Merge staff data with profile data
      const enrichedStaffData = staffData.map((staff) => {
        const profile = profilesMap.get(staff.user_id);
        return {
          ...staff,
          user_email: `user-${staff.user_id.slice(0, 8)}`, // Keep as placeholder for now
          user_name:
            profile?.full_name ||
            profile?.first_name ||
            `${staff.role.charAt(0).toUpperCase()}${staff.role.slice(1)}`,
        };
      });

      console.log("Enriched staff data:", enrichedStaffData);
      setStaffMembers(enrichedStaffData);

      // Fetch pending invitations
      const { data: invitationData, error: invitationError } = await supabase
        .from("staff_invitations")
        .select("*")
        .eq("dealer_id", userProfile.dealer_id)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (invitationError) throw invitationError;
      setInvitations(invitationData || []);
    } catch (error) {
      console.error("Error fetching staff data:", error);
      toast({
        title: "Error",
        description: "Failed to load staff data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const inviteStaffMember = async (
    email: string,
    role:
      | "manager"
      | "salesperson"
      | "staff"
      | "sales"
      | "sales_manager"
      | "swap_manager"
      | "parts_manager"
      | "service_manager",
  ) => {
    if (!userProfile?.dealer_id) return false;

    try {
      const { error } = await supabase.from("staff_invitations").insert({
        dealer_id: userProfile.dealer_id,
        email: email.toLowerCase().trim(),
        role,
        invited_by: userProfile.user_id,
      });

      if (error) throw error;

      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${email}`,
      });

      await fetchStaffData();
      return true;
    } catch (error: any) {
      console.error("Error inviting staff member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateStaffRole = async (
    staffId: string,
    newRole:
      | "manager"
      | "salesperson"
      | "staff"
      | "sales"
      | "sales_manager"
      | "swap_manager"
      | "parts_manager"
      | "service_manager",
  ) => {
    try {
      const { error } = await supabase
        .from("dealership_staff")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", staffId);

      if (error) throw error;

      toast({
        title: "Role updated",
        description: "Staff member role has been updated",
      });

      await fetchStaffData();
      return true;
    } catch (error: any) {
      console.error("Error updating staff role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeStaffMember = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from("dealership_staff")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", staffId);

      if (error) throw error;

      toast({
        title: "Staff member removed",
        description: "Staff member has been deactivated",
      });

      await fetchStaffData();
      return true;
    } catch (error: any) {
      console.error("Error removing staff member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove staff member",
        variant: "destructive",
      });
      return false;
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("staff_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "Invitation canceled",
        description: "The invitation has been canceled",
      });

      await fetchStaffData();
      return true;
    } catch (error: any) {
      console.error("Error canceling invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel invitation",
        variant: "destructive",
      });
      return false;
    }
  };

  const canManageStaff = userRole === "owner" || userRole === "manager";

  return {
    staffMembers,
    invitations,
    loading,
    userRole,
    canManageStaff,
    inviteStaffMember,
    updateStaffRole,
    removeStaffMember,
    cancelInvitation,
    refreshData: fetchStaffData,
  };
}
