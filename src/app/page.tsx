"use client";

import { useEffect } from "react";
import { getAuthCookies } from "@/lib/cookies";

export default function Home() {
  useEffect(() => {
    // Check if user is logged in via cookies or localStorage
    const { token: cookieToken } = getAuthCookies();
    const localStorageToken = localStorage.getItem("token");

    const token = cookieToken || localStorageToken;

    if (!token) {
      window.location.href = "/login";
      return;
    }

    // Get user role from token
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role === "ADMIN") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/agent";
      }
    } catch (error) {
      console.error("Error parsing token:", error);
      // Clear both cookie and localStorage data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Loan Management System
        </h1>
        <p className="mt-4 text-lg text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
