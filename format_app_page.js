const fs = require('fs');

const content = fs.readFileSync('app/page.tsx', 'utf8');
// Split by standard things like className, tags, and JSX curly braces, safely
let formatted = content
  .replace(/></g, '>\n<')
  .replace(/\{loading \?/g, '\n{loading ?')
  .replace(/\: <><section/g, ':\n<><section')
  .replace(/<\/section><section/g, '</section>\n<section')
  .replace(/<\/section><\/><\}/g, '</section>\n</>\n}')
  .replace(/className="/g, '\nclassName="')
  .replace(/<\/section>\{loading \?/g, '</section>\n{loading ?')
  .replace(/useEffect\(\(\) => \{ void load\(\) \}, \[load\]\)/g, 'useEffect(() => {\n  void load();\n}, [load]);')
  .replace(/const stats = useMemo\(\(\) => \{/g, 'const stats = useMemo(() => {\n');

fs.writeFileSync('app/page.tsx', formatted, 'utf8');
console.log('Formatted app/page.tsx');
