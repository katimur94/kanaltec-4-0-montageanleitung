"""Soundtrack for the film "Verpressen hinter dem Liner" (66 s, 16:9).
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
 (3.15,5.35,'Die Haltung ist mit einem Liner saniert. Doch dahinter liegt ein Hohlraum.'),
 (8.6,3.7,'Der Fräsroboter fährt an die Stelle.'),
 (12.6,3.3,'Die CutterCam findet die Bohrstelle.'),
 (16.6,6.1,'Der Kegelfräser öffnet den Liner, genau dort, wo dahinter der Hohlraum liegt.'),
 (25.8,5.4,'Werkzeugwechsel: Der De Vau Ka Flex Verpresskegel kommt auf die Spindel.'),
 (31.3,3.6,'Der Schlauch sitzt auf der schrägen Messingtülle.'),
 (35.2,5.8,'Der Kegel fährt an die Bohrung. Die rote Dichtauflage legt sich an den Liner.'),
 (41.4,2.5,'Jetzt wird verpresst.'),
 (44.2,7.7,'Der Mörtel läuft durch Schlauch und Kegel in die Bohrung und füllt den Hohlraum hinter dem Liner, von unten nach oben.'),
 (52.2,2.7,'Kurz aushärten lassen.'),
 (55.2,3.3,'Die Bohrung ist verschlossen.'),
 (58.7,2.7,'Der Hohlraum ist verfüllt.'),
 (61.6,4.25,'Ditom. Präzision für die Kanalsanierung.')]
if __name__=='__main__':
 asyncio.run(ka.speak(FILM,'film'))
 m=ka.music(66,20102026,[.3,61.6])
 ka.wav(ka.OUT/'film-music.wav',m*(.89/max(.01,float(abs(m).max()))))
 x,rep=ka.mix(66,FILM,'film',m);ka.wav(ka.OUT/'film-narrated.wav',x)
 (ka.OUT/'report.json').write_text(json.dumps({'voice':'de-DE-ConradNeural (Microsoft, synthetic)','music':'own procedural instrumental','film':rep},ensure_ascii=False,indent=1),encoding='utf-8')
 print(json.dumps([(r['text'][:34],r['raw'],r['speed']) for r in rep],ensure_ascii=False,indent=0))
