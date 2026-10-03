import { Repository } from "./repository.ts";
import type { readBibleModule } from "@whiteand/mybible";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, test, vi } from "vitest";

type BibleModule = ReturnType<typeof readBibleModule>;

function makeModule(id: string): BibleModule {
  return {
    id,
    // mybible types optional info keys as required `T | undefined`, but
    // readBibleModule omits them at runtime.
    info: {
      description: id,
      historyOfChanges: "",
      language: "en",
    } as BibleModule["info"],
    books: [],
    verses: [],
  };
}

const fakeReadModule = (filePath: string) =>
  makeModule(path.basename(filePath, ".SQLite3"));

const it = test.extend<{
  dir: string;
  touch: (...fileNames: string[]) => void;
  readModule: ReturnType<typeof vi.fn<typeof fakeReadModule>>;
}>({
  dir: async ({}, use) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bible-mcp-repo-"));
    await use(dir);
    fs.rmSync(dir, { recursive: true, force: true });
  },
  touch: async ({ dir }, use) => {
    await use((...fileNames) => {
      for (const name of fileNames) fs.writeFileSync(path.join(dir, name), "");
    });
  },
  readModule: async ({}, use) => {
    await use(vi.fn(fakeReadModule));
  },
});

describe("Repository.fromDirectory", () => {
  it("returns an empty repository for an empty directory", ({
    dir,
    readModule,
  }) => {
    const repo = Repository.fromDirectory(dir, { readModule });

    expect(repo.biblesById.size).toBe(0);
    expect(readModule).not.toHaveBeenCalled();
  });

  it("reads only bible module files", ({
    dir,
    touch,
    readModule,
  }) => {
    touch(
      "RST.sqlite3",
      "ESV.SQLite3",
      "ESV.commentaries.SQLite3",
      "ESV.dictionary.SQLite3",
      "notes.txt",
    );

    Repository.fromDirectory(dir, { readModule });

    expect(readModule.mock.calls).toEqual([
      [path.join(dir, "ESV.SQLite3")],
      [path.join(dir, "RST.sqlite3")],
    ]);
  });

  it("sorts file names regardless of directory listing order", ({
    dir,
    readModule,
  }) => {
    using _ = vi
      .spyOn(fs, "readdirSync")
      .mockReturnValue(["NASB.SQLite3", "ESV.SQLite3"] as never);

    const repo = Repository.fromDirectory(dir, { readModule });

    expect([...repo.biblesById.keys()]).toEqual(["ESV", "NASB"]);
  });

  it("passes absolute paths when given a relative directory", ({
    dir,
    touch,
    readModule,
  }) => {
    touch("ESV.SQLite3");
    const relativeDir = path.relative(process.cwd(), dir);

    Repository.fromDirectory(relativeDir, { readModule });

    expect(readModule).toHaveBeenCalledExactlyOnceWith(
      path.resolve(relativeDir, "ESV.SQLite3"),
    );
  });

  it("indexes modules by id", ({ dir, touch, readModule }) => {
    touch("NASB.SQLite3", "ESV.SQLite3");

    const repo = Repository.fromDirectory(dir, { readModule });

    expect(repo.biblesById).toEqual(
      new Map([
        ["ESV", makeModule("ESV")],
        ["NASB", makeModule("NASB")],
      ]),
    );
    expect([...repo.bibles()]).toEqual([makeModule("ESV"), makeModule("NASB")]);
  });

  it("throws when two files resolve to the same module id", ({
    dir,
    touch,
    readModule,
  }) => {
    touch("B.SQLite3", "A.SQLite3");
    readModule.mockImplementation(() => makeModule("same"));

    expect(() => Repository.fromDirectory(dir, { readModule })).toThrow(
      `Duplicate bible module id "same" in ${dir}: A.SQLite3 and B.SQLite3`,
    );
  });

  it("propagates errors from the module reader", ({
    dir,
    touch,
    readModule,
  }) => {
    touch("Broken.SQLite3");
    readModule.mockImplementation(() => {
      throw new Error("corrupt module");
    });

    expect(() => Repository.fromDirectory(dir, { readModule })).toThrow(
      "corrupt module",
    );
  });

  it("throws ENOENT when the directory does not exist", ({
    dir,
    readModule,
  }) => {
    expect(() =>
      Repository.fromDirectory(path.join(dir, "missing"), { readModule }),
    ).toThrow(expect.objectContaining({ code: "ENOENT" }));
  });

  it("loads a real MyBible module with the default reader", ({
    dir,
    touch,
  }) => {
    createMyBibleModule(path.join(dir, "KJV.SQLite3"));
    touch("KJV.commentaries.SQLite3");

    const repo = Repository.fromDirectory(dir);

    expect(repo.biblesById).toEqual(
      new Map([
        [
          "KJV",
          {
            id: "KJV",
            info: {
              description: "King James Version",
              historyOfChanges: "",
              language: "en",
            },
            books: [
              {
                bookNumber: 10,
                shortName: "Gen",
                longName: "Genesis",
                bookColor: "#ccccff",
              },
            ],
            verses: [
              {
                bookNumber: 10,
                chapter: 1,
                verse: 1,
                text: "In the beginning God created the heaven and the earth.",
              },
            ],
          },
        ],
      ]),
    );
  });
});

function createMyBibleModule(filePath: string) {
  const db = new DatabaseSync(filePath);
  try {
    db.exec(`
      CREATE TABLE info (name TEXT, value TEXT);
      CREATE TABLE books (book_number NUMERIC, short_name TEXT, long_name TEXT, book_color TEXT);
      CREATE TABLE verses (book_number NUMERIC, chapter NUMERIC, verse NUMERIC, text TEXT);
      INSERT INTO info VALUES
        ('description', 'King James Version'),
        ('history_of_changes', ''),
        ('language', 'en');
      INSERT INTO books VALUES (10, 'Gen', 'Genesis', '#ccccff');
      INSERT INTO verses VALUES (10, 1, 1, 'In the beginning God created the heaven and the earth.');
    `);
  } finally {
    db.close();
  }
}
