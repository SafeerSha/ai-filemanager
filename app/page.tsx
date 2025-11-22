'use client';

import { useState, useEffect } from 'react';
import { Home as HomeIcon, Folder, Star, Trash2, File, FileImage, FileVideo, FileAudio, FileText, Upload, Plus, Settings, Search, Sparkles, Mic, Menu, X } from 'lucide-react';
import jsPDF from 'jspdf';
import Link from 'next/link';
import { callAI } from '../lib/aiService';
import { apiService } from '../lib/apiService';

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

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, file: FileItem} | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [namingModal, setNamingModal] = useState<{type: string, defaultName: string, ext?: string} | null>(null);
  const [namingValue, setNamingValue] = useState('');
  const [drives, setDrives] = useState<any[]>([]);
  const [specialFolders, setSpecialFolders] = useState<any>({});
  const [hoveredFile, setHoveredFile] = useState<FileItem | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [clipboardItem, setClipboardItem] = useState<{ file: FileItem; operation: 'move' | 'copy' } | null>(null);

  useEffect(() => {
    // Initially show empty or welcome content
    if (!currentPath) {
      setFiles([]);
    }
  }, [currentPath]);

  useEffect(() => {
    localStorage.setItem('ai-files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    const fetchDrives = async () => {
      try {
        const data = await apiService.getDrives();
        setDrives(data);
      } catch (error) {
        console.error('Failed to fetch drives:', error);
      }
    };

    const fetchSpecialFolders = async () => {
      try {
        const data = await apiService.getSpecialFolders();
        setSpecialFolders(data);
      } catch (error) {
        console.error('Failed to fetch special folders:', error);
        // Fallback to default paths
        setSpecialFolders({
          downloads: 'C:\\Users\\Default\\Downloads',
          documents: 'C:\\Users\\Default\\Documents',
          desktop: 'C:\\Users\\Default\\Desktop',
          pictures: 'C:\\Users\\Default\\Pictures',
          music: 'C:\\Users\\Default\\Music',
          videos: 'C:\\Users\\Default\\Videos'
        });
      }
    };

    fetchDrives();
    fetchSpecialFolders();
  }, []);


  const handleSubmit = async (e:any) => {
    e.preventDefault();
    const trimmedPrompt = prompt.trim();
    const aiResponse = await callAI(trimmedPrompt, currentPath);
    // If backend returns updated files, use them; otherwise refresh
    if (aiResponse.files) {
      setFiles(aiResponse.files);
    } else {
      fetchFiles(currentPath);
    }
    setPrompt('');
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const handleRename = async () => {
    if (!contextMenu) return;
    const newName = window.prompt('Enter new name:', contextMenu.file.name);
    if (newName && newName !== contextMenu.file.name) {
      try {
        await apiService.rename(currentPath, contextMenu.file.name, newName);
        fetchFiles(currentPath); // Refresh
      } catch (error) {
        console.error('Rename failed:', error);
        alert('Rename failed');
      }
    }
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (!contextMenu) return;
    // For delete, perhaps move to trash or use process API
    // For now, keep frontend
    setFiles(prev => prev.filter(f => f !== contextMenu.file));
    setContextMenu(null);
  };

  const handleMove = () => {
    if (!contextMenu) return;
    setClipboardItem({ file: contextMenu.file, operation: 'move' });
    setContextMenu(null);
  };

  const handleCopy = () => {
    if (!contextMenu) return;
    setClipboardItem({ file: contextMenu.file, operation: 'copy' });
    setContextMenu(null);
  };

  const handlePaste = async () => {
    if (!clipboardItem) return;
    const source = currentPath ? `${currentPath}\\${clipboardItem.file.name}` : clipboardItem.file.name;
    try {
      if (clipboardItem.operation === 'move') {
        await apiService.move(source, currentPath);
      } else {
        await apiService.copy(source, currentPath);
      }
      fetchFiles(currentPath); // Refresh
      setClipboardItem(null); // Clear clipboard after paste
    } catch (error) {
      console.error('Paste failed:', error);
      alert('Paste failed');
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, file: FileItem) => {
    setHoveredFile(file);
    setTooltipPosition({ x: e.clientX + 10, y: e.clientY + 10 });
  };

  const handleMouseLeave = () => {
    setHoveredFile(null);
  };


  const closeFileViewer = () => {
    setSelectedFile(null);
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
    }
  };

  const fetchFiles = async (path: string) => {
    try {
      const data = await apiService.getFiles(path);
      setFiles(data);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  };

  const createNewFolder = () => {
    setNamingModal({ type: 'folder', defaultName: 'New Folder' });
    setPlusMenuOpen(false);
  };

  const createNewFile = (type: string, ext: string, defaultName: string) => {
    setNamingModal({ type, defaultName, ext });
    setPlusMenuOpen(false);
  };

  const handleNamingSubmit = () => {
    if (!namingModal || !namingValue.trim()) return;
    if (namingModal.type === 'folder') {
      setFiles(prev => [...prev, { name: namingValue.trim(), type: 'folder', size: 'Folder', path: currentPath }]);
    } else {
      const ext = namingModal.ext!;
      const fullName = namingValue.trim().endsWith(`.${ext}`) ? namingValue.trim() : `${namingValue.trim()}.${ext}`;
      setFiles(prev => [...prev, { name: fullName, type: namingModal.type, size: '1 KB', path: currentPath }]);
    }
    setNamingModal(null);
    setNamingValue('');
  };

  const handleNamingCancel = () => {
    setNamingModal(null);
    setNamingValue('');
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plusMenuOpen && !(event.target as Element).closest('.plus-menu')) {
        setPlusMenuOpen(false);
      }
      if (contextMenu && !(event.target as Element).closest('.context-menu')) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [plusMenuOpen, contextMenu]);

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
            <li className="p-2 bg-gray-700 rounded cursor-pointer flex items-center"><HomeIcon className="w-5 h-5 mr-2" /> Home</li>
            <li className="p-2 hover:bg-gray-700 rounded cursor-pointer flex items-center">
              <Link href="/folders" className="flex items-center"><Folder className="w-5 h-5 mr-2" /> Folders</Link>
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
          <h3 className="text-lg font-semibold mb-2">Drives</h3>
          <ul className="space-y-1">
            {drives.map((drive, index) => (
              <li key={index} className="p-2 hover:bg-gray-700 rounded cursor-pointer text-sm" onClick={() => { setCurrentPath(drive.name); fetchFiles(drive.name); }}>
                <div className="flex items-center">
                  <span className="mr-2">💾</span>
                  <div>
                    <div className="font-medium">{drive.label || drive.name}</div>
                    <div className="text-xs text-gray-400">
                      {(drive.availableFreeSpace / (1024 ** 3)).toFixed(1)} GB free
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Quick Access</h3>
          <ul className="space-y-1">
            {specialFolders.downloads && <li className="p-2 hover:bg-gray-700 rounded cursor-pointer text-sm" onClick={() => { setCurrentPath(specialFolders.downloads); fetchFiles(specialFolders.downloads); }}>Downloads</li>}
            {specialFolders.desktop && <li className="p-2 hover:bg-gray-700 rounded cursor-pointer text-sm" onClick={() => { setCurrentPath(specialFolders.desktop); fetchFiles(specialFolders.desktop); }}>Desktop</li>}
            {specialFolders.documents && <li className="p-2 hover:bg-gray-700 rounded cursor-pointer text-sm" onClick={() => { setCurrentPath(specialFolders.documents); fetchFiles(specialFolders.documents); }}>Documents</li>}
            {specialFolders.pictures && <li className="p-2 hover:bg-gray-700 rounded cursor-pointer text-sm" onClick={() => { setCurrentPath(specialFolders.pictures); fetchFiles(specialFolders.pictures); }}>Pictures</li>}
            {specialFolders.music && <li className="p-2 hover:bg-gray-700 rounded cursor-pointer text-sm" onClick={() => { setCurrentPath(specialFolders.music); fetchFiles(specialFolders.music); }}>Music</li>}
            {specialFolders.videos && <li className="p-2 hover:bg-gray-700 rounded cursor-pointer text-sm" onClick={() => { setCurrentPath(specialFolders.videos); fetchFiles(specialFolders.videos); }}>Videos</li>}
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
            <input
              type="text"
              placeholder="Search files..."
              className="px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center"><Sparkles className="w-4 h-4 mr-2" />AI Search</button>
          </div>
          <div className="flex space-x-2">
            {clipboardItem && (
              <button onClick={handlePaste} className="p-2 bg-green-600 hover:bg-green-700 rounded flex items-center mr-2" title={`Paste ${clipboardItem.operation}`}>
                📋 {clipboardItem.operation === 'move' ? 'Move' : 'Copy'} here
              </button>
            )}
            <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center"><Upload className="w-5 h-5" /></button>
            <div className="relative plus-menu">
              <button onClick={() => setPlusMenuOpen(!plusMenuOpen)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center"><Plus className="w-5 h-5" /></button>
              {plusMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded shadow-lg z-50 plus-menu">
                  <button onClick={createNewFolder} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Folder</button>
                  <button onClick={() => createNewFile('pdf', 'pdf', 'Document.pdf')} className="block w-full text-left px-4 py-2 hover:bg-gray-700">PDF</button>
                  <button onClick={() => createNewFile('text', 'txt', 'Text.txt')} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Text File</button>
                  <button onClick={() => createNewFile('image', 'jpg', 'Image.jpg')} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Image</button>
                  <button onClick={() => createNewFile('video', 'mp4', 'Video.mp4')} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Video</button>
                  <button onClick={() => createNewFile('audio', 'mp3', 'Audio.mp3')} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Audio</button>
                </div>
              )}
            </div>
            <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center"><Settings className="w-5 h-5" /></button>
          </div>
        </header>

        {/* Breadcrumb */}
        {currentPath && (
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center">
            <button onClick={() => setCurrentPath('')} className="mr-2 text-blue-400 hover:text-blue-300">🏠 Home</button>
            {currentPath.split('\\').filter(p => p).map((part, index, arr) => {
              const pathTo = arr.slice(0, index + 1).join('\\');
              return (
                <span key={index} className="flex items-center">
                  <span className="mx-1 text-gray-400">\</span>
                  <button onClick={() => { setCurrentPath(pathTo); fetchFiles(pathTo); }} className="text-blue-400 hover:text-blue-300 hover:underline">{part}</button>
                </span>
              );
            })}
          </div>
        )}

        {/* File Grid */}
        <main className="flex-1 p-6 overflow-auto">
          {!currentPath ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Welcome to AI File Manager</h2>
              <p className="text-gray-400 mb-6">Select a drive from the sidebar to start browsing your files.</p>
              <div className="text-sm text-gray-500">
                Use AI commands to create, move, copy, and manage your files naturally.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {files.map((file, index) => {
              const Icon = getIcon(file.type);
              const color = getColor(file.type);
              return (
                <div
                  key={index}
                  onClick={() => {
                    if (file.type === 'drive') {
                      const drive = drives.find(d => d.label === file.name || d.name === file.name);
                      if (drive) {
                        setCurrentPath(drive.name);
                        fetchFiles(drive.name);
                      }
                    } else if (file.type === 'folder') {
                      const newPath = currentPath ? `${currentPath}\\${file.name}` : file.name;
                      setCurrentPath(newPath);
                      fetchFiles(newPath);
                    }
                  }}
                  onDoubleClick={() => {
                    if (file.type !== 'folder' && file.type !== 'drive') {
                      // For files, could open or do nothing
                    }
                  }}
                  onContextMenu={(e) => handleContextMenu(e, file)}
                  onMouseEnter={(e) => handleMouseEnter(e, file)}
                  onMouseLeave={handleMouseLeave}
                  className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg hover:bg-gray-700/70 hover:scale-105 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Icon className={`w-8 h-8 ${color} mb-2`} />
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{file.size}</p>
                </div>
              );
            })}
            </div>
          )}
        </main>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-600 rounded shadow-lg z-50 context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}
        >
          <button onClick={handleRename} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Rename</button>
          <button onClick={handleMove} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Move</button>
          <button onClick={handleCopy} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Copy</button>
          <button onClick={handleDelete} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Delete</button>
        </div>
      )}

      {/* File Tooltip */}
      {hoveredFile && (
        <div
          className="fixed bg-gray-800 border border-gray-600 rounded shadow-lg p-3 z-40 pointer-events-none"
          style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
        >
          <div className="text-sm">
            <div className="font-medium">{hoveredFile.name}</div>
            <div className="text-gray-400">Type: {hoveredFile.type}</div>
            <div className="text-gray-400">Size: {hoveredFile.size}</div>
          </div>
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

      {/* File Viewer Modal */}
      {selectedFile && fileUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeFileViewer}>
          <div className="bg-gray-800 p-4 rounded-lg max-w-4xl max-h-full overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{selectedFile.name}</h3>
              <button onClick={closeFileViewer} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="flex justify-center">
              {selectedFile.type === 'image' && <img src={fileUrl} alt={selectedFile.name} className="max-w-full max-h-96" />}
              {selectedFile.type === 'video' && <video src={fileUrl} controls className="max-w-full max-h-96" />}
              {selectedFile.type === 'audio' && <audio src={fileUrl} controls className="w-full" />}
              {selectedFile.type === 'pdf' && <embed src={fileUrl} type="application/pdf" width="100%" height="600px" />}
              {selectedFile.type === 'text' && <iframe src={fileUrl} className="w-full h-96 border" />}
              {selectedFile.type === 'file' && <p className="text-gray-400">Cannot preview this file type.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Naming Modal */}
      {namingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Create {namingModal.type === 'folder' ? 'Folder' : namingModal.type.charAt(0).toUpperCase() + namingModal.type.slice(1)}</h3>
            <input
              type="text"
              value={namingValue}
              onChange={(e) => setNamingValue(e.target.value)}
              placeholder={namingModal.defaultName}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNamingSubmit();
                if (e.key === 'Escape') handleNamingCancel();
              }}
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button onClick={handleNamingCancel} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded">Cancel</button>
              <button onClick={handleNamingSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
