import React from "react";
import { useAuth } from "@/hooks/useAuth";
import RadialChart from "@/components/ui/chart/radial-chart";
import Badge from "@/components/badge";

const UserProfilePage: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading user profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        User not found or not logged in.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 mt-14 size-full ">
      <h1 className="text-xl font-bold mb-6"> Profile</h1>

      <RadialChart
        value={75}
        maxValue={100}
        label="Credits Left"
        size={200}
        strokeWidth={12}
        className="mt-4"
      />
      {user.avatar && (
        <img
          src={user.avatar}
          alt="User Avatar"
          className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-blue-500"
        />
      )}
      <div className="flex flex-col gap-2">
        <p className="text-sm mb-2">
          <span className="font-semibold">Name:</span> {user.name || "N/A"}
        </p>
        <p className="text-sm mb-2">
          <span className="font-semibold">Email:</span> {user.email}
        </p>
        <Badge text="Subsbscribed" />
      </div>

      {/* Add more user details as needed */}
    </div>
  );
};

export default UserProfilePage;
