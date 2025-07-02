import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/services/userService";

export function useUserProfile() {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data } = await getUserProfile();
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}