#!/usr/bin/env python3
"""
Security checker script - Run before pushing to git
Checks for exposed secrets and sensitive data
"""
import re
import sys
import os

def check_file_for_secrets(filepath):
    """Check a single file for potential secrets"""
    sensitive_patterns = [
        (r'mongodb\+srv://[^:]+:[^@]+@', 'MongoDB connection string with credentials'),
        (r'password\s*=\s*["\'][^"\']+["\']', 'Hardcoded password'),
        (r'secret_key\s*=\s*["\'][^"\']+["\']', 'Hardcoded secret key'),
        (r'api_key\s*=\s*["\'][^"\']+["\']', 'API key'),
        (r'token\s*=\s*["\'][^"\']+["\']', 'Authentication token'),
    ]
    
    issues = []
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            line_num = 0
            for line in content.split('\n'):
                line_num += 1
                for pattern, description in sensitive_patterns:
                    if re.search(pattern, line, re.IGNORECASE):
                        # Skip safe patterns
                        skip_keywords = ['example', 'template', 'placeholder', 'username:password', 
                                        'user name', 'pass/word', '****', 'sample', 'your-', 
                                        'documentation', '✅', '❌', '```']
                        if any(keyword in line.lower() for keyword in skip_keywords):
                            continue
                        # Skip if it's a code comment showing format
                        if line.strip().startswith('#') or line.strip().startswith('//'):
                            continue
                        issues.append({
                            'file': filepath,
                            'line': line_num,
                            'description': description,
                            'content': line.strip()[:80]
                        })
    except Exception as e:
        pass
    
    return issues

def check_repository():
    """Check all tracked files for secrets"""
    print("🔍 Checking for exposed secrets...\n")
    
    # Files to check
    extensions = ['.py', '.js', '.html', '.txt', '.json', '.yml', '.yaml']
    exclude_dirs = ['node_modules', 'venv', 'env', '__pycache__', '.git', 'harvest', '.venv', 'site-packages']
    exclude_files = ['security_check.py', '.env.example', 'SECURITY.md']
    
    all_issues = []
    
    for root, dirs, files in os.walk('.'):
        # Remove excluded directories from search
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
        
        for file in files:
            # Skip excluded files
            if file in exclude_files:
                continue
            if any(file.endswith(ext) for ext in extensions):
                filepath = os.path.join(root, file)
                issues = check_file_for_secrets(filepath)
                all_issues.extend(issues)
    
    if all_issues:
        print("❌ SECURITY ISSUES FOUND:\n")
        for issue in all_issues:
            print(f"File: {issue['file']}")
            print(f"Line: {issue['line']}")
            print(f"Issue: {issue['description']}")
            print(f"Content: {issue['content']}")
            print("-" * 80)
        print(f"\n❌ Found {len(all_issues)} potential security issue(s)")
        print("⚠️  DO NOT COMMIT until these are resolved!")
        return False
    else:
        print("✅ No obvious secrets found in tracked files")
        return True

def check_gitignore():
    """Verify .gitignore has required entries"""
    print("\n🔍 Checking .gitignore configuration...\n")
    
    required_entries = ['.env', '.env.local', '*.log', '__pycache__']
    
    if not os.path.exists('.gitignore'):
        print("❌ No .gitignore file found!")
        return False
    
    with open('.gitignore', 'r') as f:
        gitignore_content = f.read()
    
    missing = []
    for entry in required_entries:
        if entry not in gitignore_content:
            missing.append(entry)
    
    if missing:
        print(f"❌ Missing entries in .gitignore: {', '.join(missing)}")
        return False
    else:
        print("✅ .gitignore properly configured")
        return True

def check_env_example():
    """Verify .env.example exists"""
    print("\n🔍 Checking environment template...\n")
    
    if not os.path.exists('.env.example'):
        print("⚠️  No .env.example file found")
        print("   Consider creating one as a template for others")
        return True  # Not critical
    
    print("✅ .env.example exists")
    return True

def main():
    print("=" * 80)
    print("🔒 HARVEST LINK SECURITY CHECKER")
    print("=" * 80)
    
    checks = [
        check_gitignore(),
        check_env_example(),
        check_repository()
    ]
    
    print("\n" + "=" * 80)
    if all(checks):
        print("✅ All security checks passed!")
        print("✅ Safe to commit and push to repository")
        print("=" * 80)
        return 0
    else:
        print("❌ Security checks failed!")
        print("⚠️  Fix issues before pushing to git")
        print("=" * 80)
        return 1

if __name__ == '__main__':
    sys.exit(main())
