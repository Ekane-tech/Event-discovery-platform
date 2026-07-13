import os, json

root = r"c:\Users\FLAMZY\Desktop\web__projects\Tameri Train\Event-Discovery-Platform\Frontend\src\shared\i18n\locales"

def line_of(idx, lines_starts):
    # binary search
    lo, hi = 0, len(lines_starts)-1
    while lo <= hi:
        mid = (lo+hi)//2
        if lines_starts[mid] <= idx:
            lo = mid+1
        else:
            hi = mid-1
    return hi+1


def scan_file(path):
    with open(path, 'r', encoding='utf-8') as fh:
        txt = fh.read()
    lines = txt.splitlines()
    lines_starts = []
    acc = 0
    for L in lines:
        lines_starts.append(acc)
        acc += len(L) + 1

    i = 0
    n = len(txt)
    stack = []  # each entry: {'keys':{k:[occurrences]}, 'path': [path_keys]}
    last_key = None
    duplicates = []

    def add_key(k, idx):
        if not stack:
            # root context
            stack.append({'keys':{}, 'path': []})
        obj = stack[-1]
        occ = obj['keys'].setdefault(k, [])
        line = line_of(idx, lines_starts)
        occ.append({'line': line, 'text': lines[line-1].strip()})

    while i < n:
        c = txt[i]
        if c == '"':
            # parse string
            j = i+1
            s_chars = []
            while j < n:
                if txt[j] == '\\':
                    if j+1 < n:
                        s_chars.append(txt[j:j+2])
                        j += 2
                        continue
                if txt[j] == '"':
                    break
                s_chars.append(txt[j])
                j += 1
            if j >= n:
                break
            s = ''.join(s_chars)
            # pos after closing quote
            k = s
            i = j+1
            # skip whitespace
            while i < n and txt[i].isspace():
                i += 1
            if i < n and txt[i] == ':':
                # this string is a key
                last_key = k
                add_key(k, j)
                # do not consume ':' here, loop continues
                continue
            else:
                # not a key, continue
                last_key = None
                continue
        elif c == '{':
            # start new object; if previous token was a key, this object is value of that key
            # push a new object context
            path = []
            if stack and last_key:
                path = stack[-1]['path'] + [last_key]
            else:
                path = stack[-1]['path'][:] if stack else []
            stack.append({'keys':{}, 'path': path})
            last_key = None
            i += 1
            continue
        elif c == '}':
            # finish object
            if stack:
                obj = stack.pop()
                # check duplicates in this object
                for k, occ in obj['keys'].items():
                    if len(occ) > 1:
                        duplicates.append({'path': '.'.join(obj['path']) if obj['path'] else '(root)', 'key': k, 'occurrences': occ})
            last_key = None
            i += 1
            continue
        else:
            i += 1
    # after parsing, also check remaining stack
    while stack:
        obj = stack.pop()
        for k, occ in obj['keys'].items():
            if len(occ) > 1:
                duplicates.append({'path': '.'.join(obj['path']) if obj['path'] else '(root)', 'key': k, 'occurrences': occ})
    return duplicates

report = {}
for dirpath, dirs, files in os.walk(root):
    for f in files:
        if f.endswith('.json'):
            path = os.path.join(dirpath, f)
            dups = scan_file(path)
            if dups:
                rel = os.path.relpath(path, start=r"c:\Users\FLAMZY\Desktop\web__projects\Tameri Train\Event-Discovery-Platform")
                report[rel] = dups
print(json.dumps(report, ensure_ascii=False, indent=2))
