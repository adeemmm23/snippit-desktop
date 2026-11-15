import {
  readTextFile,
  writeTextFile,
  exists,
  mkdir,
  BaseDirectory,
  remove,
} from "@tauri-apps/plugin-fs";
import { createJSONStorage, type StateStorage } from "zustand/middleware";

const APP_FOLDER = "Snippit";

/** Changes made within this time of each other are saved with one write. */
const SAVE_DELAY_MS = 400;

/** What is on disk, per store: the text last read or written. */
const lastSaved = new Map<string, string>();
/** The newest text still waiting to be written, per store. */
const pending = new Map<string, string>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
/** Writes of one store run one after the other, so an old save can't land after a newer one. */
const writing = new Map<string, Promise<void>>();

const filePathOf = (name: string) => `${APP_FOLDER}/${name}.json`;

let folderReady: Promise<void> | null = null;

/** Creates the Snippit folder once; later saves don't check again. */
const ensureFolder = () => {
  folderReady ??= (async () => {
    const folderExists = await exists(APP_FOLDER, {
      baseDir: BaseDirectory.Document,
    });
    if (!folderExists) {
      await mkdir(APP_FOLDER, {
        baseDir: BaseDirectory.Document,
        recursive: true,
      });
    }
  })().catch((error) => {
    folderReady = null;
    throw error;
  });

  return folderReady;
};

/** Writes the waiting text of a store, after any write of it that is already running. */
const save = (name: string): Promise<void> => {
  clearTimeout(timers.get(name));
  timers.delete(name);

  const run = async () => {
    const value = pending.get(name);
    pending.delete(name);

    // The store saves after every change, also when the saved part is the same.
    if (value === undefined || value === lastSaved.get(name)) return;

    try {
      await ensureFolder();
      await writeTextFile(filePathOf(name), value, {
        baseDir: BaseDirectory.Document,
      });
      lastSaved.set(name, value);
    } catch (error) {
      console.error(`Failed to save ${name}:`, error);
    }
  };

  const next = (writing.get(name) ?? Promise.resolve()).then(run);
  writing.set(name, next);
  return next;
};

/** Writes everything still waiting. Call it before the window closes. */
export const flushStorage = async (): Promise<void> => {
  for (const name of [...pending.keys()]) void save(name);
  await Promise.all([...writing.values()]);
};

const fsStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const filePath = filePathOf(name);
      const fileExists = await exists(filePath, {
        baseDir: BaseDirectory.Document,
      });

      if (!fileExists) return null;

      const content = await readTextFile(filePath, {
        baseDir: BaseDirectory.Document,
      });
      lastSaved.set(name, content);
      return content;
    } catch (error) {
      console.error(`Failed to read ${name}:`, error);
      return null;
    }
  },

  setItem: (name: string, value: string): void => {
    pending.set(name, value);

    clearTimeout(timers.get(name));
    timers.set(
      name,
      setTimeout(() => void save(name), SAVE_DELAY_MS),
    );
  },

  removeItem: async (name: string): Promise<void> => {
    // A save that is still waiting must not bring the file back.
    pending.delete(name);
    clearTimeout(timers.get(name));
    timers.delete(name);
    await writing.get(name);
    lastSaved.delete(name);

    try {
      const filePath = filePathOf(name);
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

export const createFsStorage = <S>() => createJSONStorage<S>(() => fsStorage);
