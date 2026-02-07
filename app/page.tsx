"use client";

import { useAuth } from "@/contexts/auth-contex";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Landing from "./landing/page";
 
const Index = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  return <Landing />;
};

export default Index;
