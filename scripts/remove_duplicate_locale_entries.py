import os, re

root = r"c:\Users\FLAMZY\Desktop\web__projects\Tameri Train\Event-Discovery-Platform\Frontend\src\shared\i18n\locales"

string_re = re.compile(r'"([^"\\]*(?:\\.[^"\\]*)*)"')


def scan_and_clean(path):
    with open(path, 'r', encoding='utf-8') as f:
        txt = f.read()
    n = len(txt)
    i = 0
    stack = []  # each item: {'keys': {name: value_text}, 'start': pos}
    delete_ranges = []

    def parse_string(idx):
        assert txt[idx] == '"'
        j = idx + 1
        while j < n:
            if txt[j] == '\\':
                j += 2
                continue
            if txt[j] == '"':
                break
            j += 1
        if j >= n:
            return None, None
        return txt[idx:j+1], txt[idx+1:j], j+1

    def skip_whitespace(idx):
        while idx < n and txt[idx].isspace():
            idx += 1
        return idx

    def parse_value(idx):
        idx = skip_whitespace(idx)
        if idx >= n:
            return None, idx
        c = txt[idx]
        if c == '"':
            val_raw, _, end = parse_string(idx)
            return val_raw, end
        if c == '{':
            # parse balanced braces, keep raw text including nested content
            depth = 0
            j = idx
            while j < n:
                if txt[j] == '"':
                    _, _, j = parse_string(j)
                    continue
                if txt[j] == '{':
                    depth += 1
                elif txt[j] == '}':
                    depth -= 1
                    if depth == 0:
                        return txt[idx:j+1], j+1
                j += 1
            return None, idx
        if c == '[':
            depth = 0
            j = idx
            while j < n:
                if txt[j] == '"':
                    _, _, j = parse_string(j)
                    continue
                if txt[j] == '[':
                    depth += 1
                elif txt[j] == ']':
                    depth -= 1
                    if depth == 0:
                        return txt[idx:j+1], j+1
                j += 1
            return None, idx
        # primitive true/false/null/number
        m = re.match(r'(true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)', txt[idx:])
        if m:
            return m.group(0), idx + len(m.group(0))
        return None, idx

    while i < n:
        c = txt[i]
        if c == '{':
            stack.append({'keys': {}, 'start': i})
            i += 1
            continue
        if c == '}':
            if stack:
                stack.pop()
            i += 1
            continue
        if c == '"':
            # candidate key string
            raw_key, key, j = parse_string(i)
            k = key
            j = skip_whitespace(j)
            if j < n and txt[j] == ':':
                j += 1
                v_raw, end = parse_value(j)
                if v_raw is None:
                    i = j
                    continue
                if stack:
                    obj = stack[-1]
                    if k in obj['keys'] and obj['keys'][k] == v_raw:
                        # remove duplicate entry including trailing comma if present
                        start_del = i
                        end_del = end
                        # consume trailing whitespace and comma if exists
                        j2 = skip_whitespace(end_del)
                        if j2 < n and txt[j2] == ',':
                            end_del = j2 + 1
                        else:
                            # if previous char is comma before start_del, remove that comma too
                            k1 = start_del - 1
                            while k1 >= 0 and txt[k1].isspace():
                                k1 -= 1
                            if k1 >= 0 and txt[k1] == ',':
                                start_del = k1
                        delete_ranges.append((start_del, end_del))
                    else:
                        obj['keys'][k] = v_raw
                i = end
                continue
        if c == '\\':
            i += 2
            continue
        i += 1

    if not delete_ranges:
        return False
    # merge ranges
    delete_ranges.sort()
    merged = []
    cur_start, cur_end = delete_ranges[0]
    for s, e in delete_ranges[1:]:
        if s <= cur_end:
            cur_end = max(cur_end, e)
        else:
            merged.append((cur_start, cur_end))
            cur_start, cur_end = s, e
    merged.append((cur_start, cur_end))
    out = []
    last = 0
    for s, e in merged:
        out.append(txt[last:s])
        last = e
    out.append(txt[last:])
    with open(path, 'w', encoding='utf-8') as f:
        f.write(''.join(out))
    return True


if __name__ == '__main__':
    changed = []
    for dirpath, dirs, files in os.walk(root):
        for f in files:
            if not f.endswith('.json'):
                continue
            path = os.path.join(dirpath, f)
            if scan_and_clean(path):
                changed.append(path)
    print('cleaned:', changed)
