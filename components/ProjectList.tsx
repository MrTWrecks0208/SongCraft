import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { Project } from '../types';
import { companions } from '../companions';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { MusicNoteIcon } from './icons/MusicNoteIcon';
import { User as UserIcon, Settings as SettingsIcon, LogOut, ChevronDown, CreditCard } from 'lucide-react';

import { handleFirestoreError, OperationType } from '../services/firestoreUtils';

interface ProjectListProps {
  onSelectProject: (projectId: string) => void;
  onGoToPricing: () => void;
  onGoToSettings: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onSelectProject, onGoToPricing, onGoToSettings }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const path = `users/${auth.currentUser.uid}/projects`;
    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'projects'),
      orderBy('lastModified', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const projectData: Project[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data) {
            // Robust mapping with defaults to prevent crashes
            const project: Project = {
              id: doc.id,
              title: typeof data.title === 'string' ? data.title : 'Untitled Song',
              lastModified: typeof data.lastModified === 'number' ? data.lastModified : Date.now(),
              lyrics: typeof data.lyrics === 'string' ? data.lyrics : '',
              suggestion: typeof data.suggestion === 'string' ? data.suggestion : '',
              feedback: typeof data.feedback === 'string' ? data.feedback : '',
              companion: data.companion || companions[0],
              messages: Array.isArray(data.messages) ? data.messages : [{ sender: 'greeting', content: companions[0].greeting }],
              activeTab: (data.activeTab === 'editor' || data.activeTab === 'chat' || data.activeTab === 'recordings') ? data.activeTab : 'editor',
              audioClips: Array.isArray(data.audioClips) ? data.audioClips : []
            };
            projectData.push(project);
          }
        });
        setProjects(projectData);
        setIsLoading(false);
      } catch (err) {
        console.error("Error processing projects snapshot:", err);
        setIsLoading(false);
      }
    }, (error) => {
      setIsLoading(false);
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateProject = async () => {
    if (!auth.currentUser) return;

    const path = `users/${auth.currentUser.uid}/projects`;
    const newProjectData = {
      title: 'Untitled Song',
      lastModified: Date.now(),
      lyrics: '',
      suggestion: '',
      feedback: '',
      companion: companions[0],
      messages: [{ sender: 'greeting', content: companions[0].greeting }],
      activeTab: 'editor',
      uid: auth.currentUser.uid
    };

    try {
      const docRef = await addDoc(collection(db, 'users', auth.currentUser.uid, 'projects'), newProjectData);
      onSelectProject(docRef.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!auth.currentUser) return;
    
    const path = `users/${auth.currentUser.uid}/projects/${projectId}`;
    // We cannot use window.confirm in an iframe, so we just proceed
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'projects', projectId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-main">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-accent to-accent-light mb-2">
            Your Projects
          </h1>
          <p className="text-gray-200">Manage your songs and creative ideas</p>
        </div>
        
        <div className="relative flex items-center gap-4">
          {auth.currentUser?.isAnonymous && (
            <div className="px-3 py-1 bg-accent/20 border border-accent/30 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Guest Mode</span>
            </div>
          )}
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="transition-transform hover:scale-110 active:scale-95 focus:outline-none hover:brightness-110"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shadow-lg shadow-accent-light/20 overflow-hidden">
              {auth.currentUser?.photoURL ? (
                <img src={auth.currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon className="w-5 h-5 text-white" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {isUserMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsUserMenuOpen(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-56 bg-main/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-40 overflow-hidden"
                >
                  <div className="p-4 border-bottom border-white/5 bg-white/5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                      {auth.currentUser?.isAnonymous ? 'Guest Session' : 'Account'}
                    </p>
                    <p className="text-sm font-medium text-white truncate">
                      {auth.currentUser?.isAnonymous ? 'Guest Artist' : auth.currentUser?.email}
                    </p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onGoToSettings();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onGoToPricing();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      Pricing
                    </button>
                    <div className="h-px bg-white/5 my-2" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Create New Card */}
        <motion.button
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreateProject}
          className="group relative flex flex-col items-center justify-center p-8 bg-white/10 border border-white/10 rounded-3xl hover:bg-white/30 transition-colors duration-300 min-h-[240px] shadow-xl overflow-hidden transform-gpu"
        >
          <div className="absolute inset-0 backdrop-blur-md pointer-events-none -z-10" />
          <div className="bg-gradient-to-br from-accent to-accent-light p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-accent/20">
            <PlusIcon className="w-8 h-8 text-white" />
          </div>
          <span className="text-xl font-bold text-white">New Project</span>
          <p className="text-sm text-gray-200 mt-2">Start a new project</p>
        </motion.button>

        {/* Project Cards */}
        <AnimatePresence mode="popLayout">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial="initial"
              whileHover="hover"
              animate="animate"
              exit="exit"
              variants={{
                initial: { opacity: 0, scale: 0.9 },
                animate: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 0.9 },
                hover: { y: -8 }
              }}
              onClick={() => onSelectProject(project.id)}
              className="group relative flex flex-col p-8 bg-white/10 rounded-3xl border border-white/10 hover:border-white/50 hover:bg-white/50 transition-colors duration-300 cursor-pointer min-h-[240px] shadow-xl overflow-hidden transform-gpu"
            >
              <div className="absolute inset-0 backdrop-blur-xl pointer-events-none -z-10" />
              {/* Delete Button - Positioned in the corner with improved centering and animation */}
              <motion.button
                variants={{
                  initial: { opacity: 0, x: 10, scale: 0.75 },
                  hover: { opacity: 1, x: 0, scale: 1 }
                }}
                whileHover={{ scale: 1.0, backgroundColor: 'rgba(239, 68, 68, 0.0)' }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-gray-200 hover:text-red-400 rounded-full transition-colors z-20"
                onClick={(e) => handleDeleteProject(e, project.id)}
                aria-label="Delete project"
              >
                <TrashIcon className="w-5 h-5" />
              </motion.button>

              <div className="flex flex-col items-center text-center flex-grow justify-center">
                <div className="bg-gradient-to-br from-accent to-accent-light p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-accent/20">
                  <MusicNoteIcon className="w-10 h-10 text-white" /> 
                </div>
                <h4 className="text-xl font-bold text-white mb-2 line-clamp-2 px-2 leading-tight" title={project.title}>
                  {project.title}
                </h4>
              </div>

              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold">
                <div className="flex items-center gap-2 text-gray-200">
                  <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                  <span>{project.companion?.name || 'Melody'}</span>
                </div>
                <span className="text-gray-200">{formatDate(project.lastModified)}</span>
              </div>
              
              {/* Subtle gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent-light/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProjectList;
