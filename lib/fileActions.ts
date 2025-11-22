import { callAI } from './aiService';

export type FileItem = {
  name: string;
  type: string;
  size: string;
  path?: string;
};

export const handleFileAction = async (
  aiResponse: any,
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>,
  currentPath: string = ''
) => {
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
  } else if (aiResponse.action === 'move_file') {
    const destination = aiResponse.destination.endsWith('/') ? aiResponse.destination : aiResponse.destination + '/';
    setFiles(prev => prev.map(file =>
      file.name === aiResponse.source ? { ...file, path: destination } : file
    ));
  } else if (aiResponse.action === 'copy_file') {
    const destination = aiResponse.destination.endsWith('/') ? aiResponse.destination : aiResponse.destination + '/';
    const fileToCopy = await new Promise<FileItem | null>((resolve) => {
      setFiles(prev => {
        const file = prev.find(f => f.name === aiResponse.source);
        resolve(file || null);
        return prev;
      });
    });
    if (fileToCopy) {
      setFiles(prev => [...prev, { ...fileToCopy, name: fileToCopy.name + ' copy', path: destination }]);
    }
  }
};

export const createHandleSubmit = (
  setFiles: any,
  setPrompt: React.Dispatch<React.SetStateAction<string>>,
  currentPath: string = ''
) => {
  return async (e: any, prompt: string) => {
    e.preventDefault();
    const trimmedPrompt = prompt.trim();
    const aiResponse = await callAI(trimmedPrompt, currentPath);
    await handleFileAction(aiResponse, setFiles, currentPath);
    setPrompt('');
  };
};