import http from "./httpService";

export function getUserProfile() {
  return http.get("/user/profile");
}