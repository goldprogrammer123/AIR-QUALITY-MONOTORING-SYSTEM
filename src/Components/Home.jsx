import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, MapPin, FileText, LayoutDashboard } from 'lucide-react'

const Home = () => {
  return (
    <div className="min-h-screen bg-[#05014a] flex items-center justify-center p-6">
      <div className="glass-card rounded-2xl p-12 max-w-4xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            Air Quality Monitoring System
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Real-time environmental data monitoring and analysis platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="glass-card rounded-xl p-6 hover:bg-emerald-500/20 transition-all duration-300">
            <LayoutDashboard className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Dashboard</h3>
            <p className="text-white/70 text-sm">Real-time data overview and monitoring</p>
          </div>
          
          <div className="glass-card rounded-xl p-6 hover:bg-emerald-500/20 transition-all duration-300">
            <BarChart3 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Statistics</h3>
            <p className="text-white/70 text-sm">Detailed analytics and trends</p>
          </div>
          
          <div className="glass-card rounded-xl p-6 hover:bg-emerald-500/20 transition-all duration-300">
            <FileText className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Reports</h3>
            <p className="text-white/70 text-sm">Generate comprehensive reports</p>
          </div>
          
          <div className="glass-card rounded-xl p-6 hover:bg-emerald-500/20 transition-all duration-300">
            <MapPin className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Location</h3>
            <p className="text-white/70 text-sm">Device location management</p>
          </div>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 glass-button px-8 py-4 rounded-xl text-white font-semibold text-lg hover:scale-105 transition-all duration-300"
        >
          <span>Get Started</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  )
}

export default Home