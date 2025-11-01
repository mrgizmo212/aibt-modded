'use client';

import { useState } from 'react';
import LeftSidebar from '@/components/LeftSidebar';
import ChatInterface from '@/components/ChatInterface';
import RightSidebar from '@/components/RightSidebar';
import StatusDrawer from '@/components/StatusDrawer';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MockStoreProvider } from '@/lib/MockStoreContext';
import { ToastProvider } from '@/components/ui/toast';

export default function Home() {
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [currentContext, setCurrentContext] = useState<'dashboard' | 'model' | 'run' | 'admin'>('dashboard');
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  return (
    <MockStoreProvider>
      <ToastProvider>
        <div className="flex h-screen w-full overflow-hidden">
          {/* Mobile Header - Only visible on mobile */}
          <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4" style={{ background: '#0a0a0a', borderBottom: '1px solid #262626' }}>
            <Sheet open={leftSidebarOpen} onOpenChange={setLeftSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" style={{ color: '#ffffff' }}>
                  <Menu size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0" style={{ background: '#0a0a0a', border: 'none' }}>
                <LeftSidebar 
                  selectedModelId={selectedModelId}
                  onSelectModel={(id) => {
                    setSelectedModelId(id);
                    setLeftSidebarOpen(false);
                  }}
                />
              </SheetContent>
            </Sheet>
            
            <h1 className="text-lg font-semibold" style={{ color: '#ffffff' }}>AI Trading</h1>
            
            <Sheet open={rightSidebarOpen} onOpenChange={setRightSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" style={{ color: '#ffffff' }}>
                  <Info size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full p-0" style={{ background: '#1a1a1a', border: 'none' }}>
                <RightSidebar 
                  context={currentContext}
                  selectedModelId={selectedModelId}
                  selectedRunId={selectedRunId}
                />
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop & Tablet Layout */}
          {/* Left Sidebar - Hidden on mobile, 30% on tablet, 20% on desktop */}
          <div className="hidden md:block md:w-[30%] lg:w-[22%] xl:w-[20%]">
            <LeftSidebar 
              selectedModelId={selectedModelId}
              onSelectModel={setSelectedModelId}
            />
          </div>
          
          {/* Middle Column - Chat Interface - 100% on mobile, 70% on tablet, 50% on desktop */}
          <div className="w-full md:w-[70%] lg:w-[48%] xl:w-[50%] mt-16 md:mt-0">
            <ChatInterface 
              selectedModelId={selectedModelId}
              onContextChange={setCurrentContext}
              onRunSelect={setSelectedRunId}
              onSelectModel={setSelectedModelId}
            />
          </div>
          
          {/* Right Sidebar - Hidden on mobile/tablet, visible on desktop */}
          <div className="hidden lg:block lg:w-[30%]">
            <RightSidebar 
              context={currentContext}
              selectedModelId={selectedModelId}
              selectedRunId={selectedRunId}
            />
          </div>

          {/* Status Drawer - Bottom Right */}
          <StatusDrawer />
        </div>
      </ToastProvider>
    </MockStoreProvider>
  );
}
