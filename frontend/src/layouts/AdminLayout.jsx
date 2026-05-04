import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import PeopleAssignmentModal from '../components/PeopleAssignmentModal';

const AdminLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans transition-colors duration-500 overflow-x-hidden selection:bg-primary-100 selection:text-primary-900">
      <AdminSidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        user={user} 
        handleLogout={handleLogout}
        onOpenAssignPeople={() => setIsAssignModalOpen(true)}
      />

      <main className="flex-1 lg:ml-72 transition-all duration-500 relative">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { user, setIsSidebarOpen });
          }
          return child;
        })}
      </main>

      <PeopleAssignmentModal 
        isOpen={isAssignModalOpen} 
        onClose={() => setIsAssignModalOpen(false)} 
        user={user} 
      />
    </div>
  );
};

export default AdminLayout;
