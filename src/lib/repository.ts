import {
  isBibleModuleFilePath,
  readBibleModule,
  type BibleModule,
} from "@whiteand/mybible";
import fs from "node:fs";
import path from "node:path";

export interface FromDirectoryOptions {
  readModule?: (filePath: string) => BibleModule;
}

export class Repository {
  constructor(public readonly biblesById: Map<string, BibleModule>) {}

  bibles(): IteratorObject<BibleModule> {
    return this.biblesById.values();
  }

  static fromDirectory(
    sourceDirPath: string,
    { readModule = readBibleModule }: FromDirectoryOptions = {},
  ) {
    const fileNames = fs
      .readdirSync(sourceDirPath)
      .filter((name) => isBibleModuleFilePath(name))
      .sort();
    const biblesById = new Map<string, BibleModule>();
    const fileNameById = new Map<string, string>();

    for (const fileName of fileNames) {
      const mod = readModule(path.resolve(sourceDirPath, fileName));
      const existingFileName = fileNameById.get(mod.id);
      if (existingFileName !== undefined) {
        throw new Error(
          `Duplicate bible module id "${mod.id}" in ${sourceDirPath}: ${existingFileName} and ${fileName}`,
        );
      }
      fileNameById.set(mod.id, fileName);
      biblesById.set(mod.id, mod);
    }

    return new Repository(biblesById);
  }
}
