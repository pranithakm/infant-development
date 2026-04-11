import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { 
  Baby, 
  Brain, 
  TrendingUp, 
  Heart,
  Users,
  Shield,
  Sparkles,
  ArrowRight
} from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Advanced AI analyzes your infant\'s development patterns and provides personalized insights.',
    color: 'text-blue-600'
  },
  {
    icon: TrendingUp,
    title: 'Milestone Tracking',
    description: 'Comprehensive tracking of developmental milestones across all major categories.',
    color: 'text-green-600'
  },
  {
    icon: Heart,
    title: 'Personalized Care',
    description: 'Tailored recommendations and activities based on your infant\'s unique progress.',
    color: 'text-pink-600'
  },
  {
    icon: Users,
    title: 'Family Collaboration',
    description: 'Multiple caregivers can contribute observations and track progress together.',
    color: 'text-purple-600'
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your family\'s data is protected with enterprise-grade security and privacy.',
    color: 'text-orange-600'
  },
  {
    icon: Sparkles,
    title: 'Smart Recommendations',
    description: 'AI-generated activity suggestions to support your infant\'s development.',
    color: 'text-indigo-600'
  }
]

const milestones = [
  { age: '0-6 months', title: 'Early Foundation', items: ['Social smiles', 'Head control', 'Visual tracking'] },
  { age: '6-12 months', title: 'Active Exploration', items: ['Sitting up', 'First words', 'Object permanence'] },
  { age: '12-24 months', title: 'Mobile Independence', items: ['Walking', 'Two-word phrases', 'Pretend play'] },
  { age: '24-36 months', title: 'Complex Learning', items: ['Running', 'Simple sentences', 'Social interaction'] }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-pink-500 rounded-full flex items-center justify-center">
                <Baby className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">FirstSteps</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center relative z-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Track Your Infant's{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-pulse">
                Development Journey
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              AI-powered developmental monitoring and personalized recommendations for infants aged 0-3 years. 
              Support your child's growth with expert guidance and intelligent insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 group">
                  Start Tracking Development
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg font-semibold border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 animate-bounce-gentle">
          <div className="w-20 h-20 bg-blue-200 rounded-full opacity-50"></div>
        </div>
        <div className="absolute top-40 right-20 animate-bounce-gentle" style={{ animationDelay: '1s' }}>
          <div className="w-16 h-16 bg-pink-200 rounded-full opacity-50"></div>
        </div>
        <div className="absolute bottom-20 left-1/4 animate-bounce-gentle" style={{ animationDelay: '2s' }}>
          <div className="w-12 h-12 bg-green-200 rounded-full opacity-50"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Comprehensive Development Tracking
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform combines cutting-edge AI with pediatric expertise to provide 
              you with the most comprehensive infant development tracking experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white shadow-md">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-br ${feature.color === 'text-blue-600' ? 'from-blue-500 to-blue-600' : feature.color === 'text-green-600' ? 'from-green-500 to-green-600' : feature.color === 'text-pink-600' ? 'from-pink-500 to-pink-600' : feature.color === 'text-purple-600' ? 'from-purple-500 to-purple-600' : feature.color === 'text-orange-600' ? 'from-orange-500 to-orange-600' : 'from-indigo-500 to-indigo-600'}`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Milestone Timeline */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Development Milestones by Age
            </h2>
            <p className="text-lg text-gray-600">
              Track your infant's progress through key developmental stages
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {milestones.map((stage, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{stage.age}</h3>
                  <h4 className="text-primary-600 font-medium">{stage.title}</h4>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {stage.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Start Your Development Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of parents who trust FirstSteps to track their child's development 
            with AI-powered insights and expert guidance.
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="group">
              Create Your Free Account
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Baby className="h-6 w-6" />
              <span className="text-lg font-semibold">FirstSteps</span>
            </div>
            <div className="text-sm text-gray-400">
              © 2024 FirstSteps. All rights reserved. Built with ❤️ for families.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}