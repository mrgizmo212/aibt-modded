import React, { useContext } from 'react';
import { User, Model } from '../types';
import { LayoutDashboardIcon, PlusIcon, ShieldIcon, SettingsIcon, LogOutIcon, PencilIcon } from './icons';
import Switch from './ui/Switch';
import { AppContext } from '../App';


interface LeftSidebarProps {
  user: User;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
    <a
        href="#"
        onClick={onClick}
        className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
            active 
                ? 'bg-surface-elevated text-text-primary border-l-2 border-info' 
                : 'text-text-secondary hover:bg-surface-elevated/50 hover:text-text-primary'
        }`}
    >
        <div className="w-5 h-5 mr-3">{icon}</div>
        <span>{label}</span>
    </a>
);

const ModelItem: React.FC<{ model: Model }> = ({ model }) => {
    const { selectedModelId, setSelectedModelId, setContext, handleModelToggle, sendMessage } = useContext(AppContext);
    const isActive = selectedModelId === model.id;

    const handleClick = () => {
        setSelectedModelId(model.id);
        setContext('model');
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent container's onClick
        sendMessage(`ACTION:SHOW_EDIT_FORM:${model.id}`);
    };

    return (
        <div 
            className={`group flex items-center justify-between px-4 py-2 text-sm rounded-md cursor-pointer transition-colors ${
                isActive ? 'bg-surface-elevated/80' : 'hover:bg-surface-elevated/50'
            }`}
            onClick={handleClick}
        >
            <div className="flex items-center overflow-hidden pr-2">
                <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${model.status === 'running' ? 'bg-success animate-pulse' : 'bg-text-disabled'}`}></div>
                <span className="truncate text-text-secondary">{model.name}</span>
            </div>
            <div className="flex items-center gap-2">
                 <button 
                    onClick={handleEditClick}
                    className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 p-1 text-text-secondary hover:text-text-primary transition-opacity rounded-md"
                    aria-label={`Edit ${model.name}`}
                >
                    <PencilIcon className="w-4 h-4" />
                </button>
                <Switch 
                    initialChecked={model.status === 'running'} 
                    onChange={(checked) => handleModelToggle(model.id, checked ? 'running' : 'stopped')}
                />
            </div>
        </div>
    );
};

const LeftSidebar: React.FC<LeftSidebarProps> = ({ user }) => {
  const { context, setContext, models, sendMessage } = useContext(AppContext);

  return (
    <div className="flex flex-col h-full bg-background border-r border-border p-4">
      <div className="flex items-center gap-3 p-2 mb-6">
        <img src={user.avatar} alt="User Avatar" className="w-10 h-10 rounded-full" />
        <div>
          <p className="font-semibold text-sm text-text-primary">{user.name}</p>
          <p className="text-xs text-text-secondary">{user.email}</p>
        </div>
      </div>
      
      <nav className="flex-1 flex flex-col gap-4">
        <div>
            <NavItem icon={<LayoutDashboardIcon />} label="Dashboard" active={context === 'dashboard'} onClick={() => setContext('dashboard')} />
        </div>
        
        <div className="flex-1">
          <h3 className="px-4 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">My Models</h3>
          <div className="space-y-1">
            {models.map(model => <ModelItem key={model.id} model={model} />)}
          </div>
        </div>
        
        <div>
          <button 
            onClick={() => sendMessage('Create new model')}
            className="flex items-center w-full px-4 py-2.5 text-sm text-text-secondary border border-dashed border-border rounded-md hover:bg-surface-elevated/50 hover:text-text-primary transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-3" />
            <span>Create Model</span>
          </button>
        </div>
      </nav>
      
      <div className="mt-auto pt-4 border-t border-border space-y-1">
        {user.role === 'admin' && <NavItem icon={<ShieldIcon />} label="Admin" />}
        <NavItem icon={<SettingsIcon />} label="Settings" />
        <NavItem icon={<LogOutIcon />} label="Logout" />
      </div>
    </div>
  );
};

export default LeftSidebar;