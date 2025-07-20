import React from 'react'
import { Activity, Database, Shield, Zap, TrendingUp, Users, Globe, Clock } from 'lucide-react'

const SystemOverview = () => {
  return (
    <div className="min-h-screen text-white">
      <div className="glass-card rounded-xl p-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Air Quality Monitoring System</h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            A comprehensive real-time environmental monitoring platform designed to track, analyze, and report air quality data across multiple sensor locations.
          </p>
        </div>
        
        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="glass-card rounded-xl p-6 text-center hover:bg-emerald-500/20 transition-all duration-300">
            <Activity className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Real-time Monitoring</h3>
            <p className="text-white/70">Continuous air quality data collection and analysis from multiple sensor locations</p>
          </div>
          
          <div className="glass-card rounded-xl p-6 text-center hover:bg-emerald-500/20 transition-all duration-300">
            <Database className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Data Management</h3>
            <p className="text-white/70">Efficient storage and retrieval of environmental data with advanced analytics</p>
          </div>
          
          <div className="glass-card rounded-xl p-6 text-center hover:bg-emerald-500/20 transition-all duration-300">
            <Shield className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Secure Platform</h3>
            <p className="text-white/70">Protected data transmission and storage with enterprise-grade security</p>
          </div>
          
          <div className="glass-card rounded-xl p-6 text-center hover:bg-emerald-500/20 transition-all duration-300">
            <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">High Performance</h3>
            <p className="text-white/70">Fast and responsive data processing with real-time updates</p>
          </div>
        </div>

        {/* Key Features */}
        <div className="glass-card rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-white">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-white/80">Multi-device support for comprehensive monitoring</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-white/80">Advanced analytics and reporting capabilities</span>
              </div>
              {/* <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-white/80">Real-time alerts and notifications</span>
              </div> */}
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-white/80">Data export in multiple formats</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-white/80">Interactive dashboards and visualizations</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-white/80">Historical data analysis and trends</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-white/80">Weather impact assessment</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-white/80">Health recommendations based on AQI</span>
              </div>
              
            </div>
          </div>
        </div>

        {/* System Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-card rounded-xl p-6 text-center">
            <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white mb-2">24/7</div>
            <div className="text-white/60">Continuous Monitoring</div>
          </div>
          
          <div className="glass-card rounded-xl p-6 text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white mb-2">Multi</div>
            <div className="text-white/60">User Access</div>
          </div>
          
          <div className="glass-card rounded-xl p-6 text-center">
            <Globe className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white mb-2">Real-time</div>
            <div className="text-white/60">Data Updates</div>
          </div>
          
          {/* <div className="glass-card rounded-xl p-6 text-center">
            <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white mb-2">Instant</div>
            <div className="text-white/60">Alerts</div>
          </div> */}
        </div>

        {/* System Purpose */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">System Purpose</h2>
          <div className="space-y-4 text-white/80">
            <p>
              The Air Quality Monitoring System is designed to provide comprehensive environmental monitoring capabilities 
              for educational institutions, research facilities, and environmental agencies. Our platform enables real-time 
              tracking of air quality parameters including  CO2, Nox, VoC ,temperature, Presure ,humidity.
            </p>
            <p>
              The system provides actionable insights through advanced analytics, helping users understand air quality trends, 
              make informed decisions, and take appropriate actions to protect public health. With features like weather impact 
              analysis, health recommendations, and comprehensive reporting, the platform serves both technical experts and 
              general users.
            </p>
            <p>
              Built with modern web technologies and a focus on user experience, the system offers an intuitive interface 
              that makes complex environmental data accessible and understandable to all users.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemOverview