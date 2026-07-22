import { describe, it, expect } from "vitest";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Parser, Language } from "web-tree-sitter";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TS_GRAMMAR = join(
  __dirname,
  "..",
  "node_modules",
  "tree-sitter-typescript",
  "tree-sitter-typescript.wasm"
);

const SAMPLE = `import { foo } from "./bar";
export class MyClass {
  method() {
    console.log("hello");
  }
}
function greet(name: string): void {
  console.log(\`Hi, \${name}\`);
}`;

describe("web-tree-sitter proof", () => {
  it("initializes the WASM runtime", async () => {
    await Parser.init();
  });

  it("loads the TypeScript grammar from node_modules", async () => {
    await Parser.init();
    const lang = await Language.load(TS_GRAMMAR);
    expect(lang).toBeDefined();
  });

  it("parses TS source and returns a syntax tree", async () => {
    await Parser.init();
    const lang = await Language.load(TS_GRAMMAR);
    const parser = new Parser();
    parser.setLanguage(lang);

    const tree = parser.parse(SAMPLE);
    expect(tree).toBeDefined();
    expect(tree.rootNode.type).toBe("program");
    expect(tree.rootNode.startIndex).toBe(0);
    expect(tree.rootNode.endIndex).toBeGreaterThan(0);
    expect(tree.rootNode.endIndex).toBe(SAMPLE.length);
  });

  it("walks the tree to find function and class nodes with correct positions", async () => {
    await Parser.init();
    const lang = await Language.load(TS_GRAMMAR);
    const parser = new Parser();
    parser.setLanguage(lang);

    const tree = parser.parse(SAMPLE);
    const root = tree.rootNode;

    const functions: Array<{ startIndex: number; endIndex: number }> = [];
    const classes: Array<{ startIndex: number; endIndex: number }> = [];

    if (typeof root.descendantsOfType === "function") {
      root.descendantsOfType("function_declaration").forEach((n) => {
        functions.push({ startIndex: n.startIndex, endIndex: n.endIndex });
      });
      root.descendantsOfType("class_declaration").forEach((n) => {
        classes.push({ startIndex: n.startIndex, endIndex: n.endIndex });
      });
    } else {
      const cursor = root.walk();
      do {
        if (cursor.type === "function_declaration") {
          functions.push({ startIndex: cursor.startIndex, endIndex: cursor.endIndex });
        }
        if (cursor.type === "class_declaration") {
          classes.push({ startIndex: cursor.startIndex, endIndex: cursor.endIndex });
        }
      } while (cursor.gotoNextSibling());
    }

    expect(functions.length).toBeGreaterThanOrEqual(1);
    expect(classes.length).toBeGreaterThanOrEqual(1);

    const fnNode = functions[0];
    const classNode = classes[0];

    expect(fnNode.startIndex).toBeGreaterThanOrEqual(0);
    expect(fnNode.endIndex).toBeGreaterThan(fnNode.startIndex);
    expect(classNode.startIndex).toBeGreaterThanOrEqual(0);
    expect(classNode.endIndex).toBeGreaterThan(classNode.startIndex);
    expect(classNode.startIndex).toBeLessThan(fnNode.startIndex);

    expect(SAMPLE.slice(fnNode.startIndex, fnNode.endIndex)).toContain(
      "function greet"
    );
    expect(SAMPLE.slice(classNode.startIndex, classNode.endIndex)).toContain(
      "class MyClass"
    );
  });
});
