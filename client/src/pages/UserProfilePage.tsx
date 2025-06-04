import React from "react";
import { useAuth } from "@/hooks/useAuth";

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
    <div className="flex flex-col items-center justify-center size-full ">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      <div className="flex flex-wrap flex-center  rounded-lg shadow-lg text-white w-full ">
        {user.avatar && (
          <img
            src={user.avatar}
            alt="User Avatar"
            className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-blue-500"
          />
        )}
        <p className="text-lg mb-2">
          <span className="font-semibold">Name:</span> {user.name || "N/A"}
        </p>
        <p className="text-lg mb-2">
          <span className="font-semibold">Email:</span> {user.email}
        </p>
        <p className="text-lg">
          <span className="font-semibold">User ID:</span> {user.id}
        </p>
        {/* Add more user details as needed */}
      </div>
    </div>
  );
};

export default UserProfilePage;
