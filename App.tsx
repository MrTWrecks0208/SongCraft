import React, { useState, useCallback, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getDocFromServer, doc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Landing from './components/Landing';
import Workspace from './components/Workspace';
import ProjectList from './components/ProjectList';
import Pricing from './components/Pricing';
import Settings from './components/Settings';

type View = 'landing' | 'projects' | 'workspace' | 'pricing' | 'settings';

function App() {
  const [view, setView] = useState<View>('landing');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
        // Skip logging for other errors, as this is simply a connection test.
      }
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
      if (user) {
        setView('projects');
      } else {
        setView('landing');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleStart = useCallback(() => {
    if (user) {
      setView('projects');
    } else {
      setView('landing');
    }
  }, [user]);
  
  const handleSelectProject = useCallback((projectId: string) => {
    setCurrentProjectId(projectId);
    setView('workspace');
  }, []);

  const handleBackToProjects = useCallback(() => {
    setCurrentProjectId(null);
    setView('projects');
  }, []);

  const handleGoToPricing = useCallback(() => {
    setView('pricing');
  }, []);

  const handleGoToSettings = useCallback(() => {
    setView('settings');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-main">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main">
      {view === 'landing' && !user && <Landing onStart={handleStart} />}
      {view === 'projects' && user && (
        <ProjectList onSelectProject={handleSelectProject} onGoToPricing={handleGoToPricing} onGoToSettings={handleGoToSettings} />
      )}
      {view === 'pricing' && user && <Pricing onBack={handleBackToProjects} />}
      {view === 'settings' && user && <Settings onBack={handleBackToProjects} onGoToPricing={handleGoToPricing} />}
      {view === 'workspace' && currentProjectId && user && (
        <Workspace projectId={currentProjectId} onBack={handleBackToProjects} onGoToPricing={handleGoToPricing} />
      )}
    </div>
  );
}

export default App;
