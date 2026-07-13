import json
paths = [
    r'Frontend\\src\\shared\\i18n\\locales\\en\\common.json',
    r'Frontend\\src\\shared\\i18n\\locales\\fr\\common.json',
]
for p in paths:
    try:
        with open(p, 'r', encoding='utf-8') as f:
            json.load(f)
        print(p, 'OK')
    except Exception as e:
        print(p, 'ERROR', e)
