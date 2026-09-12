import {
  readTextFile,
  writeTextFile,
  exists,
  mkdir,
  BaseDirectory,
  remove,
} from "@tauri-apps/plugin-fs";
import { type StateStorage } from "zustand/middleware";

const APP_FOLDER = "Snippit";

export const fsStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const filePath = `${APP_FOLDER}/${name}.json`;
      const fileExists = await exists(filePath, {
        baseDir: BaseDirectory.Document,
      });

      if (!fileExists) return null;

      return await readTextFile(filePath, { baseDir: BaseDirectory.Document });
    } catch (error) {
      console.error(`Failed to read ${name}:`, error);
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      // Ensure the Snippit directory exists before attempting to save
      const folderExists = await exists(APP_FOLDER, {
        baseDir: BaseDirectory.Document,
      });
      if (!folderExists) {
        await mkdir(APP_FOLDER, {
          baseDir: BaseDirectory.Document,
          recursive: true,
        });
      }

      const filePath = `${APP_FOLDER}/${name}.json`;
      await writeTextFile(filePath, value, { baseDir: BaseDirectory.Document });
    } catch (error) {
      console.error(`Failed to save ${name}:`, error);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      const filePath = `${APP_FOLDER}/${name}.json`;
      const fileExists = await exists(filePath, {
        baseDir: BaseDirectory.Document,
      });

      if (fileExists) {
        await remove(filePath, { baseDir: BaseDirectory.Document });
      }
    } catch (error) {
      console.error(`Failed to delete ${name}:`, error);
    }
  },
};
