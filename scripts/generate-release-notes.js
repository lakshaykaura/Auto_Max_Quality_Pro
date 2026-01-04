const { execSync } = require('child_process');
const fs = require('fs');

try {
    // Get the latest two tags to find the range.
    // If only one tag, get from beginning.
    // If no tags, get all.

    // Note: formatting might depend on how the inputs are passed or git environment.
    // Assuming this runs in an environment where git is available.

    let range = '';
    try {
        const tags = execSync('git tag --sort=-creatordate').toString().split('\n').filter(Boolean);
        if (tags.length >= 2) {
            range = `${tags[1]}..HEAD`;
        } else if (tags.length === 1) {
            range = `${tags[0]}..HEAD`; // Or just HEAD if we are AT the tag? 
            // Usually release workflow runs ON the tag or commit.
            // If we are making a NEW release, we want logs since the LAST release.
            range = `${tags[0]}..HEAD`;
            // Wait, if the current commit IS the release commit (version bump), 
            // we might want logs since PREVIOUS tag.
            if (tags.length > 1) range = `${tags[1]}..HEAD`;
            else range = `HEAD`; // Fallback
        } else {
            range = 'HEAD';
        }

        // Better approach for GitHub Actions often involves getting the previous release from API, 
        // but let's try git first. 
        // Actually, standard practice: git log $(git describe --tags --abbrev=0 ^HEAD)..HEAD

    } catch (e) {
        console.log('Error getting tags, defaulting to all history');
        range = 'HEAD';
    }

    // Get commits
    // Format: "Subject|Body"
    // Using a simplified log format
    const logs = execSync(`git log ${range} --pretty=format:"%s"`).toString().split('\n');

    const categories = {
        'Major Update': [],
        'Minor Update': [],
        'New Feature': [],
        'Improvement': [],
        'Bug Fix': [],
        'Hotfix': [],
        'Performance': [],
        'Security Fix': [],
        'Documentation Update': [],
        'Other': []
    };

    const mappings = {
        'Major Update:': 'Major Update',
        'Minor Update:': 'Minor Update',
        'New Feature:': 'New Feature',
        'Improvement:': 'Improvement',
        'Bug Fix:': 'Bug Fix',
        'Hotfix:': 'Hotfix',
        'Performance:': 'Performance',
        'Security Fix:': 'Security Fix',
        'Documentation Update:': 'Documentation Update',
        'Build:': 'Other',
        'CI:': 'Other',
        'Style:': 'Other',
        'Revert': 'Other',
        'Merge': 'Other',
        '[auto-bump]': 'Other'
    };

    logs.forEach(line => {
        let matched = false;
        for (const [prefix, category] of Object.entries(mappings)) {
            if (line.startsWith(prefix)) {
                const message = line.replace(prefix, '').trim();
                if (category !== 'Other') {
                    categories[category].push(message);
                }
                matched = true;
                break;
            }
        }
        if (!matched) {
            // categories['Other'].push(line); // Optional: skip untagged commits to keep notes clean
        }
    });

    // Get version from env or manifest
    let version = process.env.CURRENT_RELEASE_VERSION || 'vX.X.X';
    if (!version.startsWith('v')) version = 'v' + version;

    let notes = `# Auto Max Quality Pro ${version} Release Notes\n\n`;

    notes += `🚀 **We are excited to announce Auto Max Quality Pro ${version}!** 🚀\n\n`;
    notes += `This update brings new improvements and fixes to enhance your YouTube viewing experience.\n\n`;

    notes += `## What's New in ${version}:\n\n`;

    // Display mappings to match user style
    const categoryDisplay = {
        'Major Update': '🔄 Major Updates',
        'New Feature': '✨ New Features',
        'Improvement': '🎨 Improvements & Enhancements', // User used palette for UI, generic fits well
        'Performance': '⚡ Performance Improvements',
        'Bug Fix': '�️ Bug Fixes',
        'Hotfix': '🔥 Hotfixes',
        'Security Fix': '🛡️ Security Updates',
        'Documentation Update': '📚 Documentation'
    };

    // Grouping "What's New" logic
    // The user nests everything under "What's New", effectively.
    // Or usually Major/Minor are there. 
    // Let's iterate our standard categories and render them.

    for (const [catKey, displayTitle] of Object.entries(categoryDisplay)) {
        const messages = categories[catKey];
        if (messages && messages.length > 0) {
            notes += `### ${displayTitle}\n`;
            messages.forEach(msg => notes += `- ${msg}\n`);
            notes += '\n';
        }
    }

    // Footer: Acknowledgements
    notes += '## 🙏 Acknowledgements\n';
    notes += 'Your feedback is invaluable to us, and it\'s what drives our continuous improvement. We\'re committed to delivering the best experience possible, and we\'re always eager to hear your thoughts and suggestions.\n\n';

    // Footer: Installation
    notes += '## 📥 Installation\n';
    notes += '[![Install from Chrome Web Store](https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/UV4C4ybeBTsZt43U4xis.png)](https://chromewebstore.google.com/detail/auto-max-quality-pro/habbodnofieogkocjdbdfabafpjgjbpb)\n\n';
    notes += 'Ready to transform your YouTube experience? Click the badge above to install the extension from the Chrome Web Store and dive into a world of crystal-clear videos tailored just for you!';

    console.log(notes);

    // Also write to file for the action to use
    fs.writeFileSync('RELEASE_NOTES.md', notes);

} catch (error) {
    console.error("Error generating release notes:", error);
    process.exit(1);
}
