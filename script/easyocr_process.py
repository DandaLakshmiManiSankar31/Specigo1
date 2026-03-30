import sys
import json
import re
import easyocr

reader = None

def get_reader():
    global reader
    if reader is None:
        reader = easyocr.Reader(['en'], gpu=False, verbose=False)
    return reader

def is_arrow_artifact(bbox, text, conf, next_item=None):
    text_stripped = text.strip()
    if len(text_stripped) > 2:
        return False
    arrow_chars = set('|!1lIiT[]{}()\\/<>^vtVALj4')
    if not all(c in arrow_chars for c in text_stripped):
        return False
    w = abs(bbox[1][0] - bbox[0][0])
    h = abs(bbox[2][1] - bbox[0][1])
    if h > 0 and w / h < 0.5:
        return True
    if conf < 0.5:
        return True
    if next_item:
        _, next_text, _ = next_item
        if re.match(r'^\d', next_text.strip()) and conf < 0.75:
            return True
    return False

def process_image(image_path):
    r = get_reader()
    results = r.readtext(image_path, detail=1, paragraph=False)

    if not results:
        return ""

    filtered = []
    for i, (bbox, text, conf) in enumerate(results):
        next_item = results[i + 1] if i + 1 < len(results) else None
        if is_arrow_artifact(bbox, text, conf, next_item):
            continue
        filtered.append((bbox, text, conf))

    all_x_ends = [bbox[2][0] for (bbox, _, _) in filtered]
    max_x = max(all_x_ends) if all_x_ends else 1000

    all_heights = [(bbox[2][1] - bbox[0][1]) for (bbox, _, _) in filtered]
    avg_height = sum(all_heights) / len(all_heights) if all_heights else 20
    threshold = max(avg_height * 1.2, 20)

    lines = {}
    for (bbox, text, conf) in filtered:
        y_center = (bbox[0][1] + bbox[2][1]) / 2
        line_key = round(y_center / threshold) * threshold
        if line_key not in lines:
            lines[line_key] = []
        lines[line_key].append({
            'x': bbox[0][0],
            'x_end': bbox[2][0],
            'text': text,
            'conf': conf
        })

    sorted_lines = sorted(lines.keys())
    output_lines = []

    for lk in sorted_lines:
        words = sorted(lines[lk], key=lambda w: w['x'])
        line_parts = []
        for i, word in enumerate(words):
            if i == 0:
                line_parts.append(word['text'])
            else:
                gap = word['x'] - words[i - 1]['x_end']
                if gap > max_x * 0.05:
                    line_parts.append('\t' + word['text'])
                else:
                    line_parts.append(' ' + word['text'])
        output_lines.append(''.join(line_parts))

    return '\n'.join(output_lines)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]
    try:
        text = process_image(image_path)
        print(json.dumps({"text": text, "success": True}))
    except Exception as e:
        print(json.dumps({"error": str(e), "success": False}))
