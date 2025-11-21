'use client';

import { useState, useEffect } from 'react';
import { Home as HomeIcon, Folder, Star, Trash2, File, FileImage, FileVideo, FileAudio, FileText, Upload, Plus, Settings, Search, Sparkles, Mic, Menu, X } from 'lucide-react';
import jsPDF from 'jspdf';
import Link from 'next/link';
import { callAI } from '../../lib/aiService';

type FileItem = {
  name: string;
  type: string;
  size: string;
  path: string;
};

const getIcon = (type: string) => {
  switch (type) {
    case 'pdf': return File;
    case 'image': return FileImage;
    case 'video': return FileVideo;
    case 'audio': return FileAudio;
    case 'text': return FileText;
    case 'folder': return Folder;
    default: return File;
  }
};

const getColor = (type: string) => {
  switch (type) {
    case 'pdf': return 'text-red-400';
    case 'image': return 'text-green-400';
    case 'video': return 'text-blue-400';
    case 'audio': return 'text-purple-400';
    case 'text': return 'text-gray-400';
    case 'folder': return 'text-yellow-400';
    default: return 'text-gray-400';
  }
};

export default function Folders() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentDir, setCurrentDir] = useState<FileSystemDirectoryHandle | null>(null);
  const [currentPath, setCurrentPath] = useState('');
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, file: FileItem} | null>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ai-files');
    if (saved) {
      setFiles(JSON.parse(saved));
    } else {
      setFiles([
        { name: 'Projects', type: 'folder', size: 'Folder', path: '' },
        { name: 'Documents', type: 'folder', size: 'Folder', path: '' },
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ai-files', JSON.stringify(files));
  }, [files]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const trimmedPrompt = prompt.trim();
    const aiResponse = await callAI(trimmedPrompt);
    debugger;
    if (aiResponse.action === 'create_pdf') {
      setFiles(prev => [...prev, { name: aiResponse.name || 'Unnamed.pdf', type: 'pdf', size: '1 KB', path: currentPath }]);
    } else if (aiResponse.action === 'create_txt') {
      setFiles(prev => [...prev, { name: aiResponse.name || 'Unnamed.txt', type: 'text', size: '1 KB', path: currentPath }]);
    } else if (aiResponse.action === 'create_image') {
      setFiles(prev => [...prev, { name: aiResponse.name || 'Unnamed.jpg', type: 'image', size: '1 KB', path: currentPath }]);
    } else if (aiResponse.action === 'create_video') {
      setFiles(prev => [...prev, { name: aiResponse.name || 'Unnamed.mp4', type: 'video', size: '1 KB', path: currentPath }]);
    } else if (aiResponse.action === 'create_audio') {
      setFiles(prev => [...prev, { name: aiResponse.name || 'Unnamed.mp3', type: 'audio', size: '1 KB', path: currentPath }]);
    } else if (aiResponse.action === 'delete_file') {
      setFiles(prev => prev.filter(file => file.name !== aiResponse.name && file.path === currentPath));
    } else if (aiResponse.action === 'create_folder') {
      setFiles(prev => [...prev, { name: aiResponse.name || 'New Folder', type: 'folder', size: 'Folder', path: currentPath }]);
    }
    setPrompt('');
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const handleRename = () => {
    if (!contextMenu) return;
    const newName = window.prompt('Enter new name:', contextMenu.file.name);
    if (newName && newName !== contextMenu.file.name) {
      setFiles(prev => prev.map(f => f === contextMenu.file ? { ...f, name: newName } : f));
    }
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (!contextMenu) return;
    setFiles(prev => prev.filter(f => f !== contextMenu.file));
    setContextMenu(null);
  };

  const handleCopy = () => {
    if (!contextMenu) return;
    const copy = { ...contextMenu.file, name: contextMenu.file.name + ' copy' };
    setFiles(prev => [...prev, copy]);
    setContextMenu(null);
  };

  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(transcript);
      // Automatically submit the voice prompt
      await handleSubmit({ preventDefault: () => {} } as any);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <aside className={`fixed md:relative top-0 left-0 z-10 w-64 h-full bg-gradient-to-b from-gray-800 to-gray-900 p-4 shadow-xl ${sidebarOpen ? 'block' : 'hidden'} md:block`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">AI File Manager</h2>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav>
          <ul className="space-y-2">
            <li className="p-2 hover:bg-gray-700 rounded cursor-pointer flex items-center">
              <Link href="/" className="flex items-center"><HomeIcon className="w-5 h-5 mr-2" /> Home</Link>
            </li>
            <li className="p-2 bg-gray-700 rounded cursor-pointer flex items-center">
              <Folder className="w-5 h-5 mr-2" /> Folders
            </li>
            <li className="p-2 hover:bg-gray-700 rounded cursor-pointer flex items-center">
              <Link href="/favorites" className="flex items-center"><Star className="w-5 h-5 mr-2" /> Favorites</Link>
            </li>
            <li className="p-2 hover:bg-gray-700 rounded cursor-pointer flex items-center">
              <Link href="/trash" className="flex items-center"><Trash2 className="w-5 h-5 mr-2" /> Trash</Link>
            </li>
          </ul>
        </nav>
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Quick Access</h3>
          <ul className="space-y-1">
            <li className="p-2 hover:bg-gray-700 rounded cursor-pointer text-sm">Documents</li>
            <li className="p-2 hover:bg-gray-700 rounded cursor-pointer text-sm">Images</li>
            <li className="p-2 hover:bg-gray-700 rounded cursor-pointer text-sm">Videos</li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 flex items-center justify-between border-b border-gray-700 shadow-lg">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">Folders</h1>
          </div>
          <div className="flex space-x-2">
            <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center"><Plus className="w-5 h-5" /></button>
            <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center"><Settings className="w-5 h-5" /></button>
          </div>
        </header>

        {/* Breadcrumb */}
        {currentPath && (
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center">
            <button onClick={() => setCurrentPath('')} className="mr-2 text-blue-400 hover:text-blue-300">🏠 Folders</button>
            {currentPath.split('/').filter(p => p).map((part, index, arr) => {
              const pathTo = arr.slice(0, index + 1).join('/') + '/';
              return (
                <span key={index} className="flex items-center">
                  <span className="mx-1 text-gray-400">/</span>
                  <button onClick={() => setCurrentPath(pathTo)} className="text-blue-400 hover:text-blue-300 hover:underline">{part}</button>
                </span>
              );
            })}
          </div>
        )}

        {/* File Grid */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {files.filter(f => f.path === currentPath).map((file, index) => {
              const Icon = getIcon(file.type);
              const color = getColor(file.type);
              return (
                <div
                  key={index}
                  onClick={() => file.type === 'folder' && setCurrentPath(currentPath + file.name + '/')}
                  className={`bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg hover:bg-gray-700/70 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl ${file.type === 'folder' ? 'cursor-pointer' : ''}`}
                >
                  <Icon className={`w-8 h-8 ${color} mb-2`} />
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{file.size}</p>
                </div>
              );
            })}
          </div>
        </main>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed bg-gray-800 border border-gray-600 rounded shadow-lg z-50"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={() => setContextMenu(null)}
          >
            <button onClick={handleRename} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Rename</button>
            <button onClick={handleDelete} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Delete</button>
            <button onClick={handleCopy} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Copy</button>
          </div>
        )}

        {/* Floating Prompt Input */}
        <form onSubmit={handleSubmit} className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-2xl flex items-center space-x-2 w-96 max-w-[90vw]">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt..."
            className="flex-1 px-4 py-2 bg-transparent rounded-lg focus:outline-none text-white placeholder-gray-400"
          />
          <button type="submit" className="p-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 rounded-lg transition-all duration-200">
            <Sparkles className="w-5 h-5 text-white" />
          </button>
          <button type="button" onClick={handleMicClick} className={`p-2 rounded-lg transition-all duration-200 ${isListening ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'}`}>
            <Mic className={`w-5 h-5 ${isListening ? 'text-white animate-pulse' : 'text-white'}`} />
          </button>
        </form>
      </div>
    </div>
  );
}