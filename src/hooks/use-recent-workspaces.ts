import { useState, useEffect } from "react";
import { RecentWorkspace } from "../types";
import { loadRecentWorkspaces, saveRecentWorkspaces } from "../services/tauri";

export const useRecentWorkspaces = () => {
  const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspace[]>(
    []
  );

  const addToRecentWorkspaces = async (dir: string) => {
    if (recentWorkspaces.some((workspace) => workspace.path === dir)) {
      return;
    }
    const newWorkspaces: RecentWorkspace[] = [
      { name: dir, path: dir },
      ...recentWorkspaces,
    ].slice(0, 5); // Keep only last 5

    setRecentWorkspaces(newWorkspaces);

    // Save to store if it's initialized
    try {
      saveRecentWorkspaces(newWorkspaces);
    } catch (err) {
      console.error("Failed to save recent workspaces:", err);
    }
  };

  const initStore = async () => {
    try {
      const saved = await loadRecentWorkspaces();
      if (saved) {
        setRecentWorkspaces(saved);
      }
    } catch (err) {
      console.error("Error loading recent workspaces:", err);
      // Try to create a new store if loading failed
      try {
        await saveRecentWorkspaces([]);
      } catch (e) {
        console.error("Failed to create new store:", e);
      }
    }
  };

  // Initialize store and load recent workspaces on mount
  useEffect(() => {
    initStore();
  }, []);

  return { recentWorkspaces, addToRecentWorkspaces };
};
