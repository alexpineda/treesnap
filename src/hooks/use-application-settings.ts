import { useState, useEffect } from "react";
import { ApplicationSettings } from "../types";
import { getApplicationSettings, updateApplicationSettings } from "@/platform";

export const useApplicationSettings = () => {
  const [settings, setSettings] = useState<ApplicationSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { settings, error } = await getApplicationSettings();
      if (error) {
        console.error("Error fetching settings:", error);
      } else {
        setSettings(settings);
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = (settings: ApplicationSettings) => {
    setSettings(settings);
    updateApplicationSettings(settings);
  };

  return { settings, saveSettings };
};
