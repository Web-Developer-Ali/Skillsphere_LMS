import Here_Section from "@/components/landing_page_components/Here_Section"
import Features_Section from "@/components/landing_page_components/Features_Section"
import Works_Section from "@/components/landing_page_components/Works_Section"
import Popular_Courses_Section from "@/components/landing_page_components/Popular_Courses_Section"
import Testimonials_Section from "@/components/landing_page_components/Testimonials_Section"
import Pricing_Section from "@/components/landing_page_components/Pricing_Section"
import CTA_Section from "@/components/landing_page_components/CTA_Section"
import Footer from "@/components/landing_page_components/Footer"

export default function LandingPage() {
  return (
    <div className="flex min-h-full min-w-full flex-col bg-background text-foreground dark:bg-gray-900 dark:text-gray-100">
      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <Here_Section />
        {/* Features Section */}
        <Features_Section />
        {/* How It Works Section */}
        <Works_Section />
        {/* Popular Courses Section */}
        <Popular_Courses_Section />
        {/* Testimonials Section */}
        <Testimonials_Section />
        {/* Pricing Section */}
        <Pricing_Section />
        {/* CTA Section */}
        <CTA_Section />
      </main>

      {/* Footer */}
     <Footer />
    </div>
  )
}

