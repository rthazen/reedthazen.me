const fs = require('fs');
const path = require('path');

const componentName = process.argv[2];

if (!componentName) {
    console.error('Please provide a component name.');
    process.exit(1);
}

const componentDir = path.join(__dirname, 'components', componentName);

if (fs.existsSync(componentDir)) {
    console.error('Component folder already exists.');
    process.exit(1);
}

fs.mkdirSync(componentDir);

const tsxContent = `import styles from './${componentName}.module.css';

const ${componentName} = () => {
    return (
        <div className={styles.${componentName}}>
            {/* Your component code */}
        </div>
    );
};

export default ${componentName};
`;

const cssContent = `.${componentName} {
    /* Your styles */
}
`;

const indexContent = `export { default } from './${componentName}';
`;

fs.writeFileSync(path.join(componentDir, `${componentName}.tsx`), tsxContent);
fs.writeFileSync(path.join(componentDir, `${componentName}.module.css`), cssContent);
fs.writeFileSync(path.join(componentDir, 'index.tsx'), indexContent);

console.log(`Component ${componentName} created successfully.`);
