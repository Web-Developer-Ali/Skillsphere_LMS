"use client";

import { Suspense } from "react";
import OnboardingPageContent from "./OnboardingPageContent";


export default function OnboardingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingPageContent />
    </Suspense>
  );
}
