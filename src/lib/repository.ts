import { isBibleModuleFilePath, readBibleModule } from "@whiteand/mybible";
import fs from "node:fs";
import path from "node:path";

type BibleModule = ReturnType<typeof readBibleModule>;

export class Repository {
  constructor(public readonly biblesById: Map<string, BibleModule>) {}

  bibles(): IteratorObject<BibleModule> {
    return this.biblesById.values();
  }

  static fromDirectory(sourceDirPath: string) {
    const filenames = fs.readdirSync(sourceDirPath);
    const bibleModuleFileNames = filenames.filter((x) =>
      isBibleModuleFilePath(x),
    );
    const bibleModules = new Map(
      bibleModuleFileNames.map((name) => {
        const mod = readBibleModule(path.resolve(sourceDirPath, name));

        return [mod.id, mod];
      }),
    );

    return new Repository(bibleModules);
  }
}
