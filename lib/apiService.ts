import axios from 'axios';

const API_BASE_URL = 'https://localhost:7188/api/NewItems';

export const apiService = {
  // Get all drives
  getDrives: async () => {
    const response = await axios.get(`${API_BASE_URL}/drives`);
    return response.data;
  },

  // Get files in a path
  getFiles: async (path: string) => {
    const response = await axios.get(`${API_BASE_URL}/files`, {
      params: { path }
    });
    return response.data;
  },

  // Process AI command
  processAI: async (command: string, path?: string) => {
    const response = await axios.post(`${API_BASE_URL}/process`, {
      Prompt: command,
      Path: path || ''
    });
    return response.data;
  },

  // Rename file/folder
  rename: async (path: string, oldName: string, newName: string) => {
    const response = await axios.post(`${API_BASE_URL}/rename`, {
      path,
      oldName,
      newName
    });
    return response.data;
  },

  // Move file/folder
  move: async (source: string, destination: string) => {
    const response = await axios.post(`${API_BASE_URL}/move`, {
      source,
      destination
    });
    return response.data;
  },

  // Copy file/folder
  copy: async (source: string, destination: string) => {
    const response = await axios.post(`${API_BASE_URL}/copy`, {
      source,
      destination
    });
    return response.data;
  },

  // Get special folder paths
  getSpecialFolders: async () => {
    const response = await axios.get(`${API_BASE_URL}/specialFolders`);
    return response.data;
  },

  // Get recycle bin contents
  getRecycleBin: async () => {
    const response = await axios.get(`${API_BASE_URL}/recycleBin`);
    return response.data;
  }
};