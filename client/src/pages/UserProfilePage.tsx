import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import RadialChart from "@/components/ui/chart/radial-chart";
import Badge from "@/components/badge";
import api from "@/lib/api";

interface UserProfileData {
  name: string;
  email: string;
  avatar?: string;
  credits: number;
  subscription_type: string;
  monthly_credit_limit: number;
  credits_used_this_month: number;
  last_reset: string;
}

const UserProfilePage: React.FC = () => {
  const { user: authUser, isLoading: authLoading, token } = useAuth(); // Get token for API calls
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser || !token) {
        setIsLoading(false);
        // setError("User not authenticated."); // Or handle as per your app's logic
        return;
      }
      try {
        setIsLoading(true);
        // IMPORTANT: You'll need to create this GET /api/user/profile endpoint on your server
        // It should return the user object with all necessary fields including credits info.
        const response = await api.get<UserProfileData>("/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProfileData(response.data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch user profile:", err);
        setError(err.response?.data?.message || "Failed to load profile data.");
        setProfileData(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      // Fetch profile only after auth state is resolved
      fetchUserProfile();
    }
  }, [authUser, token, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading user profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-red-500">Error: {error}</p>
        <p>Please try refreshing the page or logging in again.</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex justify-center items-center h-screen">
        User not found or not logged in.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 mt-14 size-full ">
      <h1 className="text-xl font-bold mb-6"> Profile</h1>

      <RadialChart
        value={profileData.credits} // Use actual credits
        maxValue={profileData.monthly_credit_limit} // Use monthly limit as max
        label="Credits Left"
        size={200}
        strokeWidth={12}
        className="mt-4"
      />

      <div className="flex flex-col gap-4 items-center">
        <p className="text-sm mb-2">
          <span className="font-semibold">Name:</span>{" "}
          {profileData.name || "N/A"}
        </p>
        <p className="text-sm mb-2">
          <span className="font-semibold">Email:</span> {profileData.email}
        </p>
        <div className="flex flex-col gap-2 flex-center text-sm mb-2">
          <span className="font-semibold">Subscription:</span>
          <Badge
            text={
              profileData.subscription_type.charAt(0).toUpperCase() +
              profileData.subscription_type.slice(1)
            }
          />
        </div>
        <p className="text-sm mb-2">
          <span className="font-semibold">Credits Used This Month:</span>{" "}
          {profileData.credits_used_this_month} /{" "}
          {profileData.monthly_credit_limit}
        </p>
        <p className="text-sm mb-2">
          <span className="font-semibold">Next Reset:</span>{" "}
          {profileData.last_reset
            ? new Date(
                new Date(profileData.last_reset).setMonth(
                  new Date(profileData.last_reset).getMonth() + 1
                )
              ).toLocaleDateString()
            : "N/A"}
        </p>
      </div>

      {/* Add more user details as needed */}
    </div>
  );
};

export default UserProfilePage;
