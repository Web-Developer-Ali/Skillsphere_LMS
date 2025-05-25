'use client';
import Image from 'next/image';
import { BookOpen, MonitorPlay, Award, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react"
import Dr_Emily_Wilson from "../../../../public/Dr_Emily_Wilson.jpg";
import Prof_Michael_Chen from "../../../../public/Prof_Michael_Chen.jpg";
import lnc42u from "../../../../public/lnc42u.jpg";
const About = () => {
  const [activeTab, setActiveTab] = useState('features');
  const { data: session } = useSession()
  const router = useRouter();
const isStudent = session?.user?.role == "Student";
const browsing = ()=>{
  if (isStudent) {
    router.push("/student/browse-courses")
  }else{
    router.push("/instructor/courses")
  }
}
  const features = [
    {
      icon: <BookOpen className="w-8 h-8 text-indigo-600" />,
      title: "Comprehensive Courses",
      description: "Access hundreds of courses across various disciplines with expert-curated content."
    },
    {
      icon: <MonitorPlay className="w-8 h-8 text-indigo-600" />,
      title: "Interactive Lessons",
      description: "Engaging video lectures, quizzes, and hands-on exercises for effective learning."
    },
    {
      icon: <ClipboardList className="w-8 h-8 text-indigo-600" />,
      title: "Progress Tracking",
      description: "Monitor your learning journey with detailed progress reports and analytics."
    },
    {
      icon: <Award className="w-8 h-8 text-indigo-600" />,
      title: "Certification",
      description: "Earn recognized certificates upon course completion to showcase your skills."
    }
  ];

  const instructors = [
    {
      name: "Ali Hamza",
      role: "Lead Educator",
      bio: "PhD in Education with 15+ years of teaching experience in higher education.",
      image: lnc42u,
      aspectRatio: "1/1" // Added aspect ratio
    },
    {
      name: "Prof. Michael Chen",
      role: "Computer Science",
      bio: "University professor specializing in programming and software engineering.",
      image: Prof_Michael_Chen,
      aspectRatio: "1/1"
    },
    {
      name: "Dr. Emily Wilson",
      bio: "Expert in instructional design and curriculum development.",
      image: Dr_Emily_Wilson,
      role: "Curriculum Designer",
      aspectRatio: "1/1"
    }
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
            Transform Your Learning Experience
          </h1>
          <p className="text-xl max-w-3xl mx-auto animate-fade-in delay-100">
            Our platform empowers learners with high-quality education, flexible scheduling, 
            and personalized learning paths for academic and professional success.
          </p>
        </div>
      </section>

      {/* Tabbed Navigation */}
      <nav className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto flex justify-center">
          <div className="flex space-x-1">
            {['features', 'instructors', 'methodology'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  document.getElementById(tab)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Features Section */}
      <section id="features" className="scroll-mt-20 py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">Our Learning Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section id="methodology" className="scroll-mt-20 py-16 bg-gray-50 dark:bg-gray-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Our Teaching Methodology</h2>
            <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300">
              <p>
                We combine evidence-based pedagogical approaches with cutting-edge technology to create
                effective and engaging learning experiences.
              </p>
              <p>
                Our methodology includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Microlearning modules for better knowledge retention</li>
                <li>Spaced repetition techniques</li>
                <li>Interactive assessments with immediate feedback</li>
                <li>Project-based learning for practical application</li>
                <li>Adaptive learning paths tailored to individual needs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Instructors Section - Fixed Image Container */}
      <section id="instructors" className="scroll-mt-20 py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">Meet Our Expert Instructors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {instructors.map((instructor, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md group flex flex-col h-full">
                <div className="relative h-64 w-full overflow-hidden">
                  <Image
                    src={instructor.image}
                    alt={instructor.name}
                    fill
                    className="object-cover"
                    style={{
                      objectPosition: 'top center',
                      aspectRatio: instructor.aspectRatio
                    }}
                    priority={index < 2}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="p-6 flex-grow">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">{instructor.name}</h3>
                  <p className="text-indigo-600 dark:text-indigo-400 mb-2">{instructor.role}</p>
                  <p className="text-gray-600 dark:text-gray-300">{instructor.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Learning?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of students advancing their education with our platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={browsing} 
              className="px-6 py-3 bg-white text-indigo-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isStudent ? "Browse Courses" : "My Courses"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;