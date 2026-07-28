from pathlib import Path
from PIL import Image
import re, wave, sys
root=Path(__file__).parent
errors=[]
required=['project.godot','scenes/Main.tscn','scripts/Main.gd','scripts/VehiclePreview.gd','assets/icon.png','assets/splash.png']
for f in required:
    if not (root/f).exists(): errors.append(f'Missing {f}')
for p in (root/'audio').glob('*.wav'):
    try:
        with wave.open(str(p),'rb') as w:
            if w.getframerate()!=44100 or w.getnchannels()!=1: errors.append(f'Unexpected audio format: {p.name}')
    except Exception as e: errors.append(f'Invalid WAV {p.name}: {e}')
for name,size in [('icon.png',(1024,1024)),('splash.png',(1080,1920))]:
    try:
        with Image.open(root/'assets'/name) as im:
            if im.size!=size: errors.append(f'{name} is {im.size}, expected {size}')
    except Exception as e: errors.append(f'Invalid image {name}: {e}')
for script in [root/'scripts/Main.gd',root/'scripts/VehiclePreview.gd']:
    text=script.read_text()
    stack=[]; pairs={')':'(',']':'[','}':'{'}; in_string=False; esc=False
    for line_no,line in enumerate(text.splitlines(),1):
        if line.startswith(' '): errors.append(f'{script.name}:{line_no} uses spaces instead of tabs')
        for ch in line+'\n':
            if in_string:
                if esc: esc=False
                elif ch=='\\': esc=True
                elif ch=='"': in_string=False
                continue
            if ch=='"': in_string=True
            elif ch in '([{': stack.append((ch,line_no))
            elif ch in ')]}':
                if not stack or stack[-1][0]!=pairs[ch]: errors.append(f'{script.name}:{line_no} mismatched {ch}')
                else: stack.pop()
    if stack: errors.append(f'{script.name} unclosed delimiters: {stack[-3:]}')
refs=set()
for p in root.rglob('*'):
    if p.suffix in {'.gd','.tscn','.godot'}:
        refs.update(re.findall(r'res://[^"\s)]+',p.read_text(errors='ignore')))
for ref in refs:
    if not (root/ref.replace('res://','')).exists(): errors.append(f'Broken resource reference: {ref}')
if errors:
    print('\n'.join(errors)); sys.exit(1)
print(f'PASS: {len(required)} required files, {len(list((root/"audio").glob("*.wav")))} WAV files, {len(refs)} resource references.')
