const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/**/*.tsx');

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  // Replace literal $ followed by an optional space and a digit or `{` (if it's ${var} wait we don't want to replace $ in ${var} unless it's for money. Actually if it's ${var} it's template literal, BUT if they did `$${amount}`, we want `₹${amount}`).
  // Let's replace `$${` with `₹${`
  if (content.includes('$${')) {
    content = content.replace(/\$\$\{/g, '₹${');
    changed = true;
  }
  
  // Replace `$` followed by digits: `$50` -> `₹50`
  if (/\$(\d+)/.test(content)) {
    content = content.replace(/\$(\d+)/g, '₹$1');
    changed = true;
  }

  // Replace `\$` strings in JSX: `> $` -> `> ₹`
  if (content.includes('> $')) {
    content = content.replace(/> \$/g, '> ₹');
    changed = true;
  }
  if (content.includes('>-$')) {
    content = content.replace(/>-\$/g, '>-₹');
    changed = true;
  }
  if (content.includes('>$')) {
    content = content.replace(/>\$/g, '>₹');
    changed = true;
  }
  if (content.includes('($)')) {
    content = content.replace(/\(\$\)/g, '(₹)');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(f, content);
    console.log(`Updated ${f}`);
  }
}
