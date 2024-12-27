import { Outlet, Navigate, Link } from 'react-router'
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarTrigger, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Home, Settings, LogOut } from 'lucide-react'

// This is a mock function. In a real app, you'd implement actual authentication logic.
const isAuthenticated = () => {
    return localStorage.getItem('isAuthenticated') === 'true'
}

function AuthLayout() {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />
    }

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <h2 className="text-xl font-bold p-4">Neo App</h2>
                </SidebarHeader>
                <SidebarContent>
                    <nav className="space-y-2 p-2">
                        <Link to="/dashboard">
                            <Button variant="ghost" className="w-full justify-start">
                                <Home className="mr-2 h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
                        <Link to="/templates">
                            <Button variant="ghost" className="w-full justify-start">
                                <Home className="mr-2 h-4 w-4" />
                                Templates
                            </Button>
                        </Link>
                        <Link to="/assignments">
                            <Button variant="ghost" className="w-full justify-start">
                                <Home className="mr-2 h-4 w-4" />
                                Assignments
                            </Button>
                        </Link>
                        <Link to="/attempts">
                            <Button variant="ghost" className="w-full justify-start">
                                <Home className="mr-2 h-4 w-4" />
                                Attempts
                            </Button>
                        </Link>
                        <Link to="/settings">
                            <Button variant="ghost" className="w-full justify-start">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Button>
                        </Link>
                    </nav>
                </SidebarContent>
                <SidebarFooter>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => {
                        localStorage.removeItem('isAuthenticated')
                        window.location.href = '/login'
                    }}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </SidebarFooter>
            </Sidebar>
            <main className="flex-1 p-8">
                <Outlet />
            </main>
        </SidebarProvider>
    )
}

export default AuthLayout

