import { Parser, Language } from "web-tree-sitter";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..", "..", "..");

const TS_GRAMMAR = join(PROJECT_ROOT, "node_modules", "tree-sitter-typescript", "tree-sitter-typescript.wasm");
const TSX_GRAMMAR = join(PROJECT_ROOT, "node_modules", "tree-sitter-typescript", "tree-sitter-tsx.wasm");
const JS_GRAMMAR = join(PROJECT_ROOT, "node_modules", "tree-sitter-javascript", "tree-sitter-javascript.wasm");

const grammarCache = new Map<string, Language>();

async function getLanguage(grammarPath: string, cacheKey: string): Promise<Language> {
  const cached = grammarCache.get(cacheKey);
  if (cached) return cached;

  await Parser.init();
  const lang = await Language.load(grammarPath);
  grammarCache.set(cacheKey, lang);
  return lang;
}

function pickLanguage(filePath: string, language: string | null): Promise<Language> {
  if (language === "typescript") {
    const ext = extname(filePath).toLowerCase();
    if (ext === ".tsx" || ext === ".mtsx") {
      return getLanguage(TSX_GRAMMAR, "tsx");
    }
    return getLanguage(TS_GRAMMAR, "typescript");
  }
  if (language === "javascript") {
    const ext = extname(filePath).toLowerCase();
    if (ext === ".jsx") {
      return getLanguage(TSX_GRAMMAR, "tsx");
    }
    return getLanguage(JS_GRAMMAR, "javascript");
  }
  return getLanguage(TS_GRAMMAR, "typescript");
}

function extname(filePath: string): string {
  const base = filePath.split("/").pop() || filePath;
  const idx = base.lastIndexOf(".");
  if (idx === -1) return "";
  return base.slice(idx);
}

function getIdentifier(node: any): string | null {
  if (!node) return null;
  if (node.type === "identifier") return node.text;
  if (node.type === "type_identifier") return node.text;
  if (node.type === "property_identifier") return node.text;
  return null;
}

export interface ExtractedSymbol {
  kind: "function" | "class" | "interface" | "import" | "export";
  name: string;
  startLine: number;
  endLine: number;
}

export async function extractSymbols(
  content: string | null,
  filePath: string,
  language: string | null
): Promise<ExtractedSymbol[]> {
  const symbols: ExtractedSymbol[] = [];

  if (!content) return symbols;

  let lang: Language;
  try {
    lang = await pickLanguage(filePath, language);
  } catch (e) {
    console.error(`[symbols] failed to load grammar for ${filePath}:`, e);
    return symbols;
  }

  const parser = new Parser();
  parser.setLanguage(lang);
  const tree = parser.parse(content)!;

  if (tree.rootNode.hasError) {
    console.warn(`[symbols] parse error in ${filePath}, skipping`);
    return symbols;
  }

  const root = tree.rootNode!;

  for (let i = 0; i < root.namedChildCount; i++) {
    const child = root.namedChild(i)!;

    if (child.type === "function_declaration") {
      const name = getIdentifier(child.childForFieldName("name"));
      if (name) {
        symbols.push({
          kind: "function",
          name,
          startLine: child.startPosition.row + 1,
          endLine: child.endPosition.row + 1
        });
      }
      continue;
    }

    if (child.type === "class_declaration" || child.type === "abstract_class_declaration") {
      const name = getIdentifier(child.childForFieldName("name"));
      if (name) {
        symbols.push({
          kind: "class",
          name,
          startLine: child.startPosition.row + 1,
          endLine: child.endPosition.row + 1
        });
      }
      continue;
    }

    if (child.type === "interface_declaration") {
      const name = getIdentifier(child.childForFieldName("name"));
      if (name) {
        symbols.push({
          kind: "interface",
          name,
          startLine: child.startPosition.row + 1,
          endLine: child.endPosition.row + 1
        });
      }
      continue;
    }

    if (child.type === "lexical_declaration" || child.type === "variable_declaration") {
      for (let j = 0; j < child.childCount; j++) {
        const decl = child.child(j)!;
        if (decl.type !== "variable_declarator") continue;

        const value = decl.childForFieldName("value");
        if (!value || (value.type !== "arrow_function" && value.type !== "function_expression")) continue;

        const name = getIdentifier(decl.childForFieldName("name")!);
        if (name) {
          symbols.push({
            kind: "function",
            name,
            startLine: decl.startPosition.row + 1,
            endLine: decl.endPosition.row + 1
          });
        }
      }
      continue;
    }
  }

  const methodNodeTypes = ["method_definition", "abstract_method_signature"];
  methodNodeTypes.forEach((nodeType) => {
    root.descendantsOfType(nodeType).forEach((node: any) => {
      const name = getIdentifier(node.childForFieldName("name"));
      if (name) {
        symbols.push({
          kind: "function",
          name,
          startLine: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1
        });
      }
    });
  });

  root.descendantsOfType("import_statement").forEach((node: any) => {
    let importClause: any = null;
    for (let i = 0; i < node.childCount; i++) {
      const c = node.child(i);
      if (c.type === "import_clause") {
        importClause = c;
        break;
      }
    }
    if (!importClause) return;

    let actualNamedImports: any = null;
    for (let i = 0; i < importClause.childCount; i++) {
      const c = importClause.child(i);
      if (c.type === "named_imports") {
        actualNamedImports = c;
        break;
      }
    }

    if (actualNamedImports) {
      actualNamedImports.descendantsOfType("import_specifier").forEach((spec: any) => {
        let lastId: any = null;
        for (let i = 0; i < spec.childCount; i++) {
          if (spec.child(i).type === "identifier") lastId = spec.child(i);
        }
        if (lastId) {
          symbols.push({
            kind: "import",
            name: lastId.text,
            startLine: lastId.startPosition.row + 1,
            endLine: lastId.endPosition.row + 1
          });
        }
      });
      return;
    }

    let nsImport = importClause.childForFieldName("namespace_import");
    if (!nsImport) {
      for (let i = 0; i < importClause.childCount; i++) {
        if (importClause.child(i).type === "namespace_import") {
          nsImport = importClause.child(i);
          break;
        }
      }
    }
    if (nsImport) {
      const name = getIdentifier(nsImport) || getIdentifier((nsImport as any).namedChild((nsImport as any).namedChildCount - 1));
      if (name) {
        symbols.push({
          kind: "import",
          name,
          startLine: nsImport.startPosition.row + 1,
          endLine: nsImport.endPosition.row + 1
        });
      }
      return;
    }

    let idNode = importClause.childForFieldName("name");
    if (!idNode) {
      for (let i = 0; i < importClause.namedChildCount; i++) {
        const c = importClause.namedChild(i);
        if (c.type === "identifier") {
          idNode = c;
          break;
        }
      }
    }
    if (idNode && idNode.type === "identifier") {
      symbols.push({
        kind: "import",
        name: idNode.text,
        startLine: idNode.startPosition.row + 1,
        endLine: idNode.endPosition.row + 1
      });
    }
  });

  root.descendantsOfType("export_statement").forEach((node: any) => {
    const decl = node.childForFieldName("declaration");

    if (decl) {
      if (decl.type === "function_declaration") {
        const name = getIdentifier(decl.childForFieldName("name"));
        if (name) {
          pushDefinition(symbols, { kind: "function", name, startLine: decl.startPosition.row + 1, endLine: decl.endPosition.row + 1 });
          addExport(symbols, node, name);
        }
        return;
      }
      if (decl.type === "class_declaration" || decl.type === "abstract_class_declaration") {
        const name = getIdentifier(decl.childForFieldName("name"));
        if (name) {
          pushDefinition(symbols, { kind: "class", name, startLine: decl.startPosition.row + 1, endLine: decl.endPosition.row + 1 });
          addExport(symbols, node, name);
        }
        return;
      }
      if (decl.type === "interface_declaration") {
        const name = getIdentifier(decl.childForFieldName("name"));
        if (name) {
          pushDefinition(symbols, { kind: "interface", name, startLine: decl.startPosition.row + 1, endLine: decl.endPosition.row + 1 });
          addExport(symbols, node, name);
        }
        return;
      }
      if (decl.type === "type_alias_declaration" || decl.type === "enum_declaration") {
        const name = getIdentifier(decl.childForFieldName("name"));
        if (name) addExport(symbols, node, name);
        return;
      }
      if (decl.type === "lexical_declaration" || decl.type === "variable_declaration") {
        for (let j = 0; j < decl.childCount; j++) {
          const vd = decl.child(j);
          if (vd.type !== "variable_declarator") continue;
          const name = getIdentifier(vd.childForFieldName("name"));
          if (name) addExport(symbols, vd, name);
        }
        return;
      }
      if (decl.type === "internal_module") {
        const name = getIdentifier(decl.childForFieldName("name"));
        if (name) addExport(symbols, node, name);
        return;
      }
      return;
    }

    if (hasKeyword(node, "default")) {
      const value = findNonKeywordChild(node);
      if (value.type === "function_expression") {
        addExport(symbols, node, "default");
      } else if (value.type === "class") {
        addExport(symbols, node, "default");
      } else if (value.type === "identifier") {
        addExport(symbols, node, value.text);
      } else {
        addExport(symbols, node, "default");
      }
      return;
    }

    let exportClause: any = null;
    for (let i = 0; i < node.childCount; i++) {
      if (node.child(i).type === "export_clause") {
        exportClause = node.child(i);
        break;
      }
    }
    if (exportClause) {
      exportClause.descendantsOfType("export_specifier").forEach((spec: any) => {
        let lastId: any = null;
        for (let i = 0; i < spec.childCount; i++) {
          if (spec.child(i).type === "identifier") lastId = spec.child(i);
        }
        if (lastId) addExport(symbols, lastId, lastId.text);
      });
    }
  });

  return symbols;
}

function pushDefinition(symbols: ExtractedSymbol[], s: ExtractedSymbol) {
  symbols.push(s);
}

function hasKeyword(node: any, keyword: string): boolean {
  for (let i = 0; i < node.childCount; i++) {
    if (node.child(i).type === keyword) return true;
  }
  for (let i = 0; i < node.namedChildCount; i++) {
    if (node.namedChild(i).type === keyword) return true;
  }
  return false;
}

function findNonKeywordChild(node: any): any {
  const keywords = new Set(["export", "default", ";"]);
  for (let i = 0; i < node.childCount; i++) {
    if (!keywords.has(node.child(i).type)) return node.child(i);
  }
  return node.namedChild(node.namedChildCount - 1);
}

function addExport(symbols: ExtractedSymbol[], refNode: any, name: string) {
  symbols.push({
    kind: "export",
    name,
    startLine: refNode.startPosition.row + 1,
    endLine: refNode.endPosition.row + 1
  });
}
