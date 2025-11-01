import React, { useState, useCallback, useEffect } from 'react';
import LeftSidebar from './components/LeftSidebar';
import ChatInterface from './components/ChatInterface';
import RightContextPanel from './components/RightContextPanel';
import SystemStatusWidget from './components/SystemStatusWidget';
import { MenuIcon, XIcon, InfoIcon } from './components/icons';
import { ContextType, Message, Model, ModelStatus } from './types';
import { MOCK_USER, MOCK_MODELS, INITIAL_MESSAGES, AI_RESPONSES } from './constants';

export const AppContext = React.createContext<{
  context: ContextType;
  setContext: React.Dispatch<React.SetStateAction<ContextType>>;
  selectedModelId: number | null;
  setSelectedModelId: React.Dispatch<React.SetStateAction<number | null>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  sendMessage: (text: string) => void;
  isAiTyping: boolean;
  models: Model[];
  handleModelToggle: (modelId: number, newStatus: ModelStatus) => void;
  clearChat: () => void;
}>({
  context: 'dashboard',
  setContext: () => {},
  selectedModelId: null,
  setSelectedModelId: () => {},
  messages: [],
  setMessages: () => {},
  sendMessage: () => {},
  isAiTyping: false,
  models: [],
  handleModelToggle: () => {},
  clearChat: () => {},
});

const App: React.FC = () => {
  const [context, setContext] = useState<ContextType>('dashboard');
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [models, setModels] = useState<Model[]>(MOCK_MODELS);

  const getTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const handleModelToggle = (modelId: number, newStatus: ModelStatus) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;
    
    setModels(prevModels => 
        prevModels.map(m => m.id === modelId ? { ...m, status: newStatus } : m)
    );
    const actionText = newStatus === 'running' ? 'Started' : 'Stopped';
    const confirmationMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        text: `✅ ${actionText} trading on ${model.name}.`,
        timestamp: getTimestamp(),
    };
    setMessages(prev => [...prev, confirmationMessage]);
  };

  const clearChat = () => {
    setMessages(INITIAL_MESSAGES);
    setContext('dashboard');
    setSelectedModelId(null);
  };
  
  const sendMessage = useCallback((text: string) => {
    // Handle action messages
    if (text.startsWith('ACTION:')) {
        const [_, action, payload] = text.split(/:(.*)/s); // Split only on the first colon
        if (action === 'TOGGLE_MODEL') {
            const modelId = parseInt(payload, 10);
            const model = models.find(m => m.id === modelId);
            if(model) {
                handleModelToggle(modelId, model.status === 'running' ? 'stopped' : 'running');
            }
        }
        if (action === 'START_CLAUDE_TRADE') {
             handleModelToggle(2, 'running');
             setContext('model_live');
             setSelectedModelId(2);
        }
         if (action === 'APPLY_ANALYSIS_RULES') {
            const confirmationMessage: Message = {
                id: Date.now().toString(),
                type: 'ai',
                text: `✅ Applied 3 new rules to Claude Day Trader model.`,
                timestamp: getTimestamp(),
            };
            setMessages(prev => [...prev, confirmationMessage]);
        }
        if (action === 'CREATE_MODEL') {
            const { name, portfolio, instructions, strategy } = JSON.parse(payload);
            const newModel: Model = {
                id: Date.now(),
                name,
                status: 'stopped',
                portfolio: parseInt(portfolio, 10),
                return: 0,
                run: 0,
                strategy,
                sparklineData: Array(7).fill(parseInt(portfolio, 10)),
                instructions,
            };
            setModels(prev => [...prev, newModel]);
            
            const confirmationMessage: Message = {
                id: Date.now().toString() + 'confirm',
                type: 'ai',
                text: `✅ Successfully created new model: "${name}". You can start it from the sidebar.`,
                timestamp: getTimestamp(),
            };
            setMessages(prev => [...prev, confirmationMessage]);
            setContext('dashboard');
            return;
        }
        if (action === 'SHOW_EDIT_FORM') {
            const modelId = parseInt(payload, 10);
            const modelToEdit = models.find(m => m.id === modelId);
            if (modelToEdit) {
                const messageId = Date.now().toString();
                const editMessage: Message = {
                    id: messageId,
                    type: 'ai',
                    text: `Editing model: "${modelToEdit.name}"`,
                    timestamp: getTimestamp(),
                    component: {
                        type: 'edit_model_form',
                        props: { model: modelToEdit, messageId }
                    }
                };
                setMessages(prev => [...prev, editMessage]);
            }
            return;
        }
        if (action === 'UPDATE_MODEL') {
            const { model: updatedModel, messageId } = JSON.parse(payload);
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
            setModels(prev => prev.map(m => m.id === updatedModel.id ? updatedModel : m));
            
            const confirmationMessage: Message = {
                id: Date.now().toString(),
                type: 'ai',
                text: `✅ Model "${updatedModel.name}" has been updated.`,
                timestamp: getTimestamp(),
            };
            setMessages(prev => [...prev, confirmationMessage]);
            return;
        }
        if (action === 'DELETE_MODEL') {
            const { modelId, messageId } = JSON.parse(payload);
            const modelToDelete = models.find(m => m.id === modelId);
            if (modelToDelete) {
                setMessages(prev => prev.filter(msg => msg.id !== messageId));
                setModels(prev => prev.filter(m => m.id !== modelId));

                const confirmationMessage: Message = {
                    id: Date.now().toString(),
                    type: 'ai',
                    text: `🗑️ Model "${modelToDelete.name}" has been deleted.`,
                    timestamp: getTimestamp(),
                };
                setMessages(prev => [...prev, confirmationMessage]);
            }
            return;
        }
         if (action === 'CANCEL_EDIT') {
            const messageId = payload;
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
            return;
        }
        return;
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text,
      timestamp: getTimestamp()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsAiTyping(true);

    setTimeout(() => {
      const key = text.toLowerCase().trim();
      let responseTemplate = AI_RESPONSES[key] || AI_RESPONSES['default'];

      if (key.includes('claude')) {
          setContext('model');
          setSelectedModelId(2);
      } else if (key.includes('run #12')) {
          setContext('run');
          setSelectedModelId(2);
      } else if (key.includes('show my models') || key.includes('create new model')) {
          setContext('dashboard');
      }
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        ...responseTemplate,
        timestamp: getTimestamp(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsAiTyping(false);
    }, 1500);
  }, [models]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        document.getElementById('chat-input')?.focus();
      }
      if (event.key === 'Escape') {
        setIsLeftSidebarOpen(false);
        setIsRightSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const selectedModel = models.find(m => m.id === selectedModelId);

  return (
    <AppContext.Provider value={{ context, setContext, selectedModelId, setSelectedModelId, messages, setMessages, sendMessage, isAiTyping, models, handleModelToggle, clearChat }}>
      <div className="flex h-screen w-full font-sans text-text-primary bg-background">
        {/* Left Sidebar - Desktop */}
        <div className="hidden lg:block w-[20%] flex-shrink-0">
          <LeftSidebar user={MOCK_USER} />
        </div>

        {/* Left Sidebar - Mobile/Tablet (Drawer) */}
        <div className={`fixed inset-y-0 left-0 z-50 transform ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden w-72 bg-background border-r border-border`}>
            <LeftSidebar user={MOCK_USER} />
        </div>
        {isLeftSidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setIsLeftSidebarOpen(false)}></div>}


        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-surface">
          <header className="flex lg:hidden items-center justify-between p-4 border-b border-border h-[60px] flex-shrink-0">
              <button onClick={() => setIsLeftSidebarOpen(true)} className="p-2 -ml-2 text-text-secondary hover:text-text-primary">
                  <MenuIcon className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-semibold">AI Trading</h1>
              <button onClick={() => setIsRightSidebarOpen(true)} className="p-2 -mr-2 text-text-secondary hover:text-text-primary">
                  <InfoIcon className="w-6 h-6" />
              </button>
          </header>
          <ChatInterface />
        </main>

        {/* Right Sidebar - Desktop */}
        <aside className="hidden md:block md:w-[40%] lg:w-[30%] flex-shrink-0 bg-surface-elevated border-l border-border">
          <RightContextPanel model={selectedModel} />
        </aside>

        {/* Right Sidebar - Mobile/Tablet (Drawer) */}
        <div className={`fixed inset-y-0 right-0 z-50 transform ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out md:hidden w-full max-w-sm bg-surface-elevated border-l border-border`}>
          <div className="p-4 border-b border-border flex justify-end">
            <button onClick={() => setIsRightSidebarOpen(false)} className="p-2 text-text-secondary hover:text-text-primary">
              <XIcon className="w-6 h-6" />
            </button>
          </div>
          <RightContextPanel model={selectedModel} />
        </div>
        {isRightSidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setIsRightSidebarOpen(false)}></div>}
        
        <SystemStatusWidget />
      </div>
    </AppContext.Provider>
  );
};

export default App;