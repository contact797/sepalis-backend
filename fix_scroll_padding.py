#!/usr/bin/env python3
import re
import os

# Liste des fichiers à modifier
files_to_fix = [
    '/app/frontend/app/(tabs)/academy.tsx',
    '/app/frontend/app/(tabs)/zones.tsx',
    '/app/frontend/app/(tabs)/plants.tsx',
    '/app/frontend/app/(tabs)/tasks.tsx',
    '/app/frontend/app/(tabs)/profile.tsx',
    '/app/frontend/app/(tabs)/diagnostic.tsx',
    '/app/frontend/app/(tabs)/course-detail.tsx',
    '/app/frontend/app/(tabs)/course-preregister.tsx',
]

def fix_file(filepath):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath} - file not found")
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already has contentContainerStyle
    if 'contentContainerStyle' in content:
        print(f"Skipping {filepath} - already has contentContainerStyle")
        return
    
    # Find ScrollView without contentContainerStyle
    pattern = r'<ScrollView\s+style={styles\.(?:container|scrollView)}'
    replacement = r'<ScrollView\n      style={styles.\1}\n      contentContainerStyle={styles.scrollContent}'
    
    # More flexible pattern
    pattern2 = r'(<ScrollView[^>]*style={styles\.(container|scrollView)})'
    
    if re.search(pattern2, content):
        # Add contentContainerStyle after style
        content = re.sub(
            r'(<ScrollView[^>]*)(style={styles\.(container|scrollView)})',
            r'\1\2\n      contentContainerStyle={styles.scrollContent}',
            content
        )
        
        # Add scrollContent style if not exists
        if 'scrollContent:' not in content:
            # Find the StyleSheet.create section
            stylesheet_pattern = r'(const styles = StyleSheet\.create\({\s*(?:container|scrollView): {[^}]+},)'
            if re.search(stylesheet_pattern, content):
                content = re.sub(
                    stylesheet_pattern,
                    r'\1\n  scrollContent: {\n    paddingBottom: 80,\n  },',
                    content
                )
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Fixed {filepath}")
    else:
        print(f"Skipping {filepath} - no matching ScrollView found")

for file in files_to_fix:
    fix_file(file)

print("\n✅ Done!")
