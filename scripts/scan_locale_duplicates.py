import os, re, json
root = r"c:\Users\FLAMZY\Desktop\web__projects\Tameri Train\Event-Discovery-Platform\Frontend\src\shared\i18n\locales"
key_re = re.compile(r'"([^"\\]+)"\s*:')
result = {}
for dirpath, dirs, files in os.walk(root):
    for fname in files:
        if not fname.endswith('.json'):
            continue
        path = os.path.join(dirpath, fname)
        with open(path, 'r', encoding='utf-8') as fh:
            txt = fh.read()
        lines = txt.splitlines()
        keys = {}
        for i, line in enumerate(lines, start=1):
            for m in key_re.finditer(line):
                k = m.group(1)
                keys.setdefault(k, []).append({'line': i, 'text': line.strip()})
        dups = {k: v for k, v in keys.items() if len(v) > 1}
        if dups:
            rel = os.path.relpath(path, start=r"c:\Users\FLAMZY\Desktop\web__projects\Tameri Train\Event-Discovery-Platform")
            result[rel] = dups
print(json.dumps(result, ensure_ascii=False, indent=2))
