"""Soundtrack for the film "Verpressen hinter dem Liner" (73 s, 16:9; nine-step sequence of 21.10.2026).
Usage: python work/liner-audio.py   (edge-tts >= 7.3, imageio-ffmpeg, numpy in work/qa/video-runtime)
Writes work/qa/liner/audio/{film-narrated,film-music}.wav and report.json.
Speech: Microsoft neural voice de-DE-ConradNeural (synthetic), as in the other films.
Music: own procedural instrumental from work/komplett-audio.py, no third-party material."""
import asyncio,importlib.util,json
from pathlib import Path
spec=importlib.util.spec_from_file_location('ka','work/komplett-audio.py');ka=importlib.util.module_from_spec(spec);spec.loader.exec_module(ka)
ka.OUT=Path('work/qa/liner/audio');ka.OUT.mkdir(parents=True,exist_ok=True)
# "Ditom" and "De Vau Ka Flex" (DVK-Flex) are written phonetically for the voice.
FILM=[(0.3,2.6,'Verpressen hinter dem Liner.'),
 (3.2,4.1,'Ein gebrochenes Altrohr, dahinter ein großer Hohlraum.'),
 (7.6,2.8,'Zuerst wird eingemessen.'),
 (10.6,3.3,'Die CutterCam markiert die spätere Bohrstelle.'),
 (14.2,7.5,'Dann kommt der Liner rein. Der Packer presst den K-Liner an die Rohrwand, der Hohlraum dahinter bleibt.'),
 (22.2,5.6,'Der Roboter fährt zurück an die eingemessene Stelle, Station und Uhrzeit wie notiert.'),
 (28.4,5.4,'Der Kegelfräser öffnet den Liner genau an der Markierung.'),
 (36.65,4.85,'Werkzeugwechsel: Der De Vau Ka Flex Verpresskegel kommt auf die Spindel.'),
 (41.65,3.35,'Der Schlauch sitzt auf der schrägen Messingtülle.'),
 (45.1,4.8,'Die rote Dichtauflage dichtet an der Bohrung ab.'),
 (50.2,2.2,'Jetzt wird verpresst.'),
 (52.6,7.2,'Der Mörtel füllt den großen Hohlraum hinter dem Liner, von unten nach oben.'),
 (60.1,2.3,'Kurz aushärten lassen.'),
 (62.6,2.8,'Die Bohrung ist verschlossen.'),
 (65.6,2.8,'Der Hohlraum ist verfüllt.'),
 (68.6,4.2,'Ditom. Präzision für die Kanalsanierung.')]
if __name__=='__main__':
 asyncio.run(ka.speak(FILM,'film'))
 m=ka.music(73,20102026,[.3,68.6])
 ka.wav(ka.OUT/'film-music.wav',m*(.89/max(.01,float(abs(m).max()))))
 x,rep=ka.mix(73,FILM,'film',m);ka.wav(ka.OUT/'film-narrated.wav',x)
 (ka.OUT/'report.json').write_text(json.dumps({'voice':'de-DE-ConradNeural (Microsoft, synthetic)','music':'own procedural instrumental','film':rep},ensure_ascii=False,indent=1),encoding='utf-8')
 print(json.dumps([(r['text'][:34],r['raw'],r['speed']) for r in rep],ensure_ascii=False,indent=0))
