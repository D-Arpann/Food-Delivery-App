import { useEffect, useState } from 'react'
import { supabase } from '@repo/api'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Protected Route: redirect to landing if no session
  useEffect(() => {
    if (!loading && !session) {
      window.location.href = 'http://localhost:3000'
    }
  }, [loading, session])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const user = session.user
  const userName = user?.user_metadata?.full_name || user?.phone || 'Admin'
  const initials = userName.slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = 'http://localhost:3000'
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Chito Mitho" />
          <span>Chito Mitho</span>
        </div>

        <nav className="sidebar-nav">
          <button className="sidebar-link active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
            </svg>
            Dashboard
          </button>
          <button className="sidebar-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 01-8 0"></path>
            </svg>
            Orders
          </button>
          <button className="sidebar-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
              <path d="M16 3.13a4 4 0 010 7.75"></path>
            </svg>
            Riders
          </button>
          <button className="sidebar-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h18v18H3zM3 9h18M9 21V9"></path>
            </svg>
            Restaurants
          </button>
          <button className="sidebar-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            Analytics
          </button>
          <button className="sidebar-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"></path>
            </svg>
            Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h1>Dashboard</h1>
            <p>Welcome back, {userName} 👋</p>
          </div>
          <div className="topbar-right">
            <div className="topbar-avatar">{initials}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 01-8 0"></path>
                </svg>
              </div>
              <span className="stat-badge">+12%</span>
            </div>
            <div className="stat-value">2,847</div>
            <div className="stat-label">Total Orders</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path>
                </svg>
              </div>
              <span className="stat-badge">+8%</span>
            </div>
            <div className="stat-value">Rs. 4.2L</div>
            <div className="stat-label">Revenue</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 010 7.75"></path>
                </svg>
              </div>
              <span className="stat-badge">+23%</span>
            </div>
            <div className="stat-value">1,249</div>
            <div className="stat-label">Active Users</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </div>
              <span className="stat-badge">+5%</span>
            </div>
            <div className="stat-value">86</div>
            <div className="stat-label">Active Riders</div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          <div className="card">
            <div className="card-header">
              <h2>Recent Orders</h2>
              <a href="#">View All</a>
            </div>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>#CM-2847</td>
                  <td>Aarav Sharma</td>
                  <td>Momo House</td>
                  <td>Rs. 450</td>
                  <td><span className="order-status delivered">Delivered</span></td>
                </tr>
                <tr>
                  <td>#CM-2846</td>
                  <td>Priya Thapa</td>
                  <td>Newari Kitchen</td>
                  <td>Rs. 820</td>
                  <td><span className="order-status preparing">Preparing</span></td>
                </tr>
                <tr>
                  <td>#CM-2845</td>
                  <td>Bikash Rai</td>
                  <td>Pizza Planet</td>
                  <td>Rs. 1,200</td>
                  <td><span className="order-status on-way">On the way</span></td>
                </tr>
                <tr>
                  <td>#CM-2844</td>
                  <td>Sita Gurung</td>
                  <td>Thakali Bhanchha</td>
                  <td>Rs. 350</td>
                  <td><span className="order-status delivered">Delivered</span></td>
                </tr>
                <tr>
                  <td>#CM-2843</td>
                  <td>Rohan K.C.</td>
                  <td>Burger Shack</td>
                  <td>Rs. 680</td>
                  <td><span className="order-status delivered">Delivered</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Activity</h2>
            </div>
            <div className="activity-feed">
              <div className="activity-item">
                <div className="activity-dot orange"></div>
                <div>
                  <div className="activity-text"><strong>New order</strong> from Momo House</div>
                  <div className="activity-time">2 min ago</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-dot green"></div>
                <div>
                  <div className="activity-text"><strong>Delivered</strong> order #CM-2841</div>
                  <div className="activity-time">15 min ago</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-dot blue"></div>
                <div>
                  <div className="activity-text"><strong>Rider assigned</strong> to #CM-2846</div>
                  <div className="activity-time">22 min ago</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-dot orange"></div>
                <div>
                  <div className="activity-text"><strong>New restaurant</strong> Himalayan Bites joined</div>
                  <div className="activity-time">1 hour ago</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-dot green"></div>
                <div>
                  <div className="activity-text"><strong>Payout processed</strong> for Newari Kitchen</div>
                  <div className="activity-time">3 hours ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
