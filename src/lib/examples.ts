// Load all .deql example files from docs/examples/ at build time using Vite's glob import
const modules = import.meta.glob('/docs/examples/*.deql', { query: '?raw', eager: true, import: 'default' }) as Record<string, string>;

export interface Example {
  name: string;
  filename: string;
  content: string;
}

export const examples: Example[] = Object.entries(modules)
  .map(([path, content]) => {
    const filename = path.split('/').pop() || '';
    const name = filename
      .replace('.deql', '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    return { name, filename, content };
  })
  .sort((a, b) => a.name.localeCompare(b.name));
