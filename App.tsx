import React, { useState, useCallback, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getDocFromServer, doc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Landing from './components/Landing';
import Workspace from './components/Workspace';
import ProjectList from './components/ProjectList';

type View = 'landing' | 'projects' | 'workspace';

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1d2951]">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1d2951]">
      {view === 'landing' && !user && <Landing onStart={handleStart} />}
      {view === 'projects' && user && <ProjectList onSelectProject={handleSelectProject} />}
      {view === 'workspace' && currentProjectId && user && (
        <Workspace projectId={currentProjectId} onBack={handleBackToProjects} />
      )}
    </div>
  );
}

export default App;
