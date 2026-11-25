"""Procedural sound design + score for Episode 1 (no voice).
Reads cues.json (from timeline.js) and writes out/sfx.wav, out/music.wav, out/mix.wav (44.1 kHz stereo)."""
import json, wave, numpy as np

SR = 44100
rng = np.random.default_rng(7)
cues = json.load(open('cues.json'))
TOTAL = cues['total']
N = int((TOTAL + 2) * SR)

# ------------------------------------------------------------------ dsp helpers
def t_(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def fftfilt(x, lo=0, hi=20000, slope=1.0):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(f)
    if lo > 0: m *= 1 / (1 + (lo / np.maximum(f, 1)) ** (4 * slope))
    if hi < 20000: m *= 1 / (1 + (f / hi) ** (4 * slope))
    return np.fft.irfft(X * m, len(x))
def env(d, a=0.005, r=None, shape=4.0):
    n = int(d * SR); t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    rel = (d - a) if r is None else r
    return e * np.exp(-np.maximum(0, t - a) * shape / max(rel, 1e-3))
def adsr(d, a, r):
    n = int(d * SR); t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.minimum(1, np.maximum(0, (d - t) / max(r, 1e-4)))
def sine(f, d, ph=0):
    t = t_(d)
    if callable(f): return np.sin(2 * np.pi * np.cumsum(f(t)) / SR + ph)
    return np.sin(2 * np.pi * f * t + ph)
def saw(f, d):
    t = t_(d); ph = (np.cumsum(f(t)) / SR) if callable(f) else f * t
    return 2 * (ph % 1) - 1
def norm(x, p=1.0): m = np.max(np.abs(x)) + 1e-9; return x / m * p
_IR = {}
def ir(sec, bright=6000):
    k = (sec, bright)
    if k not in _IR:
        n = int(sec * SR); t = np.arange(n) / SR
        L = fftfilt(rng.standard_normal(n), 80, bright) * np.exp(-t * 6.9 / sec)
        R = fftfilt(rng.standard_normal(n), 80, bright) * np.exp(-t * 6.9 / sec)
        _IR[k] = (L / np.sqrt(np.sum(L ** 2)), R / np.sqrt(np.sum(R ** 2)))
    return _IR[k]
def conv(x, h):
    n = len(x) + len(h) - 1; F = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(h, F), F)[:n]
def verb(x, sec=2.0, wet=0.3, bright=6000, pan=0.0):
    hL, hR = ir(sec, bright)
    L = conv(x, hL) * wet; R = conv(x, hR) * wet
    dry = np.pad(x, (0, len(L) - len(x)))
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return np.stack([dry * gl * 1.41 * (1 - wet * 0.5) + L, dry * gr * 1.41 * (1 - wet * 0.5) + R])
def st(x, pan=0.0):
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * gl * 1.41, x * gr * 1.41])

# ------------------------------------------------------------------ sound building blocks
def hit(f0=60, f1=30, d=1.2, nz=0.5, lp=900, rv=1.8, wet=0.35):
    t = t_(d); f = f1 + (f0 - f1) * np.exp(-t * 12)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.002, d, 5)
    n = fftfilt(noise(d), 30, lp) * env(d, 0.001, 0.25, 6) * nz
    return verb(norm(body + n), rv, wet)
def whooshs(d=0.8, lo=300, hi=3000, pan=(-0.8, 0.8)):
    t = t_(d); x = noise(d); out = np.zeros_like(x)
    seg = 2048
    for i in range(0, len(x), seg):
        k = i / len(x); fc = lo + (hi - lo) * np.sin(np.pi * k)
        out[i:i + seg] = fftfilt(x[i:i + seg] if len(x[i:i + seg]) > 64 else x[i:i + seg], fc * 0.5, fc * 1.5)
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    y = out * e; p = np.linspace(pan[0], pan[1], len(y))
    return norm(np.stack([y * np.cos((p + 1) * np.pi / 4), y * np.sin((p + 1) * np.pi / 4)]), 0.8)
def click(d=0.01, lo=1500, hi=9000): return fftfilt(noise(0.03), lo, hi) * env(0.03, 0.0005, d, 6)
def train(times, unit, d):
    y = np.zeros(int(d * SR) + len(unit))
    for tt in times:
        if tt < d: i = int(tt * SR); y[i:i + len(unit)] += unit
    return y[: int(d * SR)]
def fit(x, d):
    n = int(d * SR); return np.pad(x, (0, max(0, n - len(x))))[:n]
def tone(fs, d, a=0.01, dec=3, amps=None):
    y = sum((amps[i] if amps else 1 / (i + 1)) * sine(f, d) for i, f in enumerate(fs)); return y * env(d, a, d, dec)
def heartbeat(bpm, d):
    beat = 60 / bpm; one = fit(hit(70, 40, 0.25, 0.2, 200, 0.6, 0.15)[0], 0.25)
    times = []; t = 0
    while t < d: times += [t, t + 0.18]; t += beat
    return st(norm(fftfilt(train(times, one, d), 20, 180)), 0)
def whaleclick():
    p = fftfilt(noise(0.02), 200, 6000) * env(0.02, 0.0005, 0.004, 5)
    res = fit(sine(320, 0.25) * env(0.25, 0.001, 0.25, 9), 0.4) * 0.6 + sine(80, 0.4) * env(0.4, 0.002, 0.4, 7) * 0.8
    return verb(norm(np.pad(p, (0, len(res) - len(p))) + res), 2.5, 0.5, 3000)
def creak(d=1.0, f=90):
    t = t_(d); g = (np.sin(2 * np.pi * f * t * (1 + 0.3 * np.sin(2 * np.pi * 3 * t))) > 0.95).astype(float)
    return verb(norm(fftfilt(g + 0.2 * noise(d), 100, 1800) * adsr(d, 0.1, 0.3)), 1.2, 0.3)
def metalring(d=2.0, base=420):
    return verb(norm(tone([base, base * 2.76, base * 5.4, base * 8.9], d, 0.002, 4, [1, .6, .4, .2])), 2.0, 0.35)

S = {}
def reg(name, fn): S[name] = fn
reg('drone_low', lambda: st(norm(fftfilt(noise(6), 20, 160) * 0.6 + sine(41, 6) * 0.5) * adsr(6, 1.5, 2.5), 0))
reg('drone_swell', lambda: st(norm(sum(sine(f, 5) for f in [55, 82.4, 110, 116.5]) * np.linspace(0, 1, int(5 * SR)) ** 2 * adsr(5, 0.1, 0.8)), 0))
reg('breath', lambda: st(norm(fftfilt(noise(3), 300, 1800) * (np.sin(np.pi * np.clip(t_(3) / 1.4, 0, 1)) ** 2 + 0.7 * np.sin(np.pi * np.clip((t_(3) - 1.6) / 1.3, 0, 1)) ** 2)), 0))
reg('exhale', lambda: st(norm(fftfilt(noise(1.5), 250, 1500) * np.sin(np.pi * t_(1.5) / 1.5) ** 2), 0))
reg('breath_shallow', lambda: st(norm(fftfilt(noise(4), 300, 2000) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.9 * t_(4))) ** 3), 0))
reg('breath_hold', lambda: st(norm(fftfilt(noise(0.6), 300, 2000) * env(0.6, 0.02, 0.5)), 0))
reg('blip', lambda: verb(sine(1250, 0.09) * env(0.09, 0.002, 0.08), 0.8, 0.2))
reg('tick', lambda: verb(click() + 0.4 * sine(3000, 0.03) * env(0.03, 0.001, 0.02), 0.6, 0.15))
reg('hull_tick', lambda: metalring(0.8, 1300))
reg('click', lambda: verb(click(0.01, 800, 6000), 0.4, 0.1))
reg('ticks_fast', lambda: st(norm(train(np.arange(0, 3, 0.09), click(), 3))))
reg('clock_fast', lambda: st(norm(train(np.arange(0, 4, 0.125), click(0.01, 2000, 8000), 4))))
reg('typewriter', lambda: st(norm(train(np.cumsum(rng.uniform(0.06, 0.12, 20)), click(0.012, 1000, 7000), 2.6))))
reg('ice', lambda: verb(norm(train(np.sort(rng.uniform(0, 1.5, 60)), click(0.004, 2500, 9000), 1.6)), 1.5, 0.3))
reg('squeak', lambda: verb(sine(lambda t: 950 + 450 * t / 0.4 + 30 * np.sin(2 * np.pi * 18 * t), 0.4) * adsr(0.4, 0.03, 0.1) * 0.6, 0.6, 0.15))
reg('clunk', lambda: verb(norm(fit(hit(90, 50, 0.4, 0.6, 1200, 0.5, 0.1)[0], 0.4) + 0.5 * tone([420, 760, 1130], 0.4, 0.001, 8)), 1.0, 0.3))
reg('hum_on', lambda: st(norm(sum(sine(50 * k, 2.5) / k for k in range(1, 7)) * np.minimum(1, t_(2.5) / 0.4) * adsr(2.5, 0.01, 1.0)) * 0.6))
reg('hum', lambda: st(norm(sum(sine(60 * k, 3) / k for k in range(1, 5)) * adsr(3, 0.5, 1.0)) * 0.5))
reg('servo', lambda: st(norm(fftfilt(saw(lambda t: 320 + 180 * np.sin(np.pi * t / 1.0), 1.0), 100, 2500) * adsr(1.0, 0.08, 0.2)) * 0.5, 0.3))
reg('winddown', lambda: st(norm(fftfilt(saw(lambda t: 420 * np.exp(-t * 1.2) + 40, 2.2), 60, 2000) * adsr(2.2, 0.01, 0.8)) * 0.6))
reg('heartbeat', lambda: heartbeat(68, 4))
reg('heartbeat_fast', lambda: heartbeat(135, 4.5))
reg('subhit', lambda: hit(55, 28, 2.0, 0.5, 400, 2.5, 0.4))
reg('impact', lambda: hit(75, 35, 1.6, 0.9, 1500, 2.0, 0.35))
reg('impact_big', lambda: hit(60, 25, 2.8, 1.0, 2500, 3.0, 0.45) * 1.2)
reg('boom', lambda: hit(48, 22, 4.0, 0.8, 900, 4.0, 0.5) * 1.2)
reg('slam', lambda: hit(55, 25, 2.5, 1.0, 1800, 2.5, 0.4) * 1.2)
reg('smash', lambda: hit(70, 30, 2.0, 1.2, 6000, 2.0, 0.35) * 1.3)
reg('thump', lambda: hit(65, 38, 0.6, 0.2, 300, 0.8, 0.15))
reg('thud', lambda: hit(80, 45, 0.7, 0.5, 700, 0.8, 0.2) * 0.8)
reg('elephant_thud', lambda: hit(50, 26, 1.4, 0.7, 500, 1.5, 0.3))
reg('rewind', lambda: st(norm(fftfilt(saw(lambda t: 900 * np.exp(-t * 3) + 120, 0.7), 80, 5000) * adsr(0.7, 0.01, 0.2)) * 0.5))
reg('creak', lambda: creak(1.2, 70))
reg('jaw', lambda: creak(2.0, 45) * 1.2)
reg('constrict', lambda: creak(3.0, 55))
reg('whoosh', lambda: whooshs(0.8, 300, 3500))
reg('whoosh_big', lambda: whooshs(1.3, 120, 1500) * 1.2)
reg('swish', lambda: whooshs(0.4, 800, 5000, (0.6, -0.6)) * 0.6)
reg('displace', lambda: whooshs(2.2, 60, 500) * 1.1)
reg('tunnel', lambda: whooshs(1.6, 100, 900))
reg('jet', lambda: whooshs(1.2, 200, 2500, (0, -1)) * 1.1)
reg('ratchet', lambda: verb(norm(train(np.arange(0, 0.6, 0.035), click(0.006, 1500, 7000), 0.75) + 0.3 * tone([2200, 3100], 0.75, 0.001, 6)), 0.8, 0.2))
reg('crack', lambda: verb(norm(fftfilt(noise(0.25), 1500, 12000) * env(0.25, 0.0005, 0.05, 6) + fit(hit(120, 60, 0.25, 0, 500, 0.1, 0)[0], 0.25) * 0.6), 1.2, 0.25))
reg('snap', lambda: S['crack']() * 0.9)
reg('chop', lambda: verb(norm(fftfilt(noise(0.15), 300, 3000) * env(0.15, 0.001, 0.06, 6)), 0.4, 0.15) * 0.7)
reg('clicks', lambda: st(norm(train([0, 0.55, 1.1, 1.65, 2.2, 2.75], whaleclick()[0][: int(0.5 * SR)], 3.4))))
reg('click_whale', lambda: whaleclick() * 1.2)
def _accel():
    times, t, gap = [], 0, 0.6
    while t < 4: times.append(t); t += gap; gap = max(0.07, gap * 0.8)
    u = whaleclick()[0][: int(0.4 * SR)]
    return st(norm(train(times, u, 4.6)))
reg('clicks_accel', _accel)
reg('wind', lambda: st(norm(fftfilt(noise(8), 150, 1200) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.15 * t_(8))) * adsr(8, 1, 2)), -0.2))
reg('waves', lambda: st(norm(fftfilt(noise(8), 80, 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.22 * t_(8))) ** 2 * adsr(8, 0.8, 2)), 0.2))
reg('wavecrash', lambda: verb(norm(fftfilt(noise(2.6), 60, 3000) * env(2.6, 0.05, 2.5, 3)), 1.5, 0.3))
reg('hydraulic', lambda: st(norm(fftfilt(noise(1.6), 2000, 7000) * adsr(1.6, 0.1, 0.4) * 0.4 + fftfilt(saw(110, 1.6), 50, 800) * adsr(1.6, 0.3, 0.3)), 0.3))
reg('chains', lambda: verb(norm(train(np.sort(rng.uniform(0, 1.4, 14)), tone([1800, 2600, 4100], 0.08, 0.001, 8), 1.6)), 1.0, 0.3))
reg('blueprint', lambda: verb(norm(train([0, 0.15, 0.3, 0.9, 1.05], sine(1600, 0.06) * env(0.06, 0.002, 0.05), 1.3)), 1.0, 0.25) * 0.5)
def _hatch():
    x = hit(70, 40, 1.2, 1.0, 2000, 1.6, 0.35); r = metalring(1.0, 300)
    n = max(x.shape[1], r.shape[1]); x = np.pad(x, ((0, 0), (0, n - x.shape[1]))); r = np.pad(r, ((0, 0), (0, n - r.shape[1])))
    return x + 0.4 * r
reg('hatch', _hatch)
reg('bolts', lambda: verb(norm(train(np.arange(0, 0.7, 0.05), click(0.01, 800, 5000), 0.85) + 0.4 * tone([900, 1500], 0.85, 0.001, 5)), 0.8, 0.2) * 0.7)
reg('splash', lambda: verb(norm(fftfilt(noise(1.3), 400, 9000) * env(1.3, 0.005, 1.2, 4)), 1.0, 0.2))
reg('underwater', lambda: st(norm(fftfilt(noise(3.5), 30, 400) * adsr(3.5, 0.2, 2.0))))
def _bubbles(d=3, n=40):
    y = np.zeros(int(d * SR))
    for _ in range(n):
        dd = rng.uniform(0.03, 0.08); f0 = rng.uniform(400, 1400)
        b = sine(lambda t: f0 * (1 + t * 12), dd) * env(dd, 0.002, dd, 5); i = int(rng.uniform(0, d - dd) * SR); y[i:i + len(b)] += b
    return verb(norm(y) * 0.6, 0.8, 0.25)
reg('bubbles', _bubbles)
reg('tss', lambda: st(norm(fftfilt(noise(0.2), 3000, 9000) * env(0.2, 0.01, 0.15)) * 0.3))
reg('chime', lambda: verb(norm(tone([880, 880 * 2.76, 880 * 5.4], 2.5, 0.002, 3)) * 0.5, 3.0, 0.5))
reg('twinkle', lambda: verb(norm(train([0, 0.25, 0.6, 0.8], tone([2600, 3900], 0.3, 0.001, 6), 1.2)) * 0.4, 2.5, 0.5))
reg('shimmer', lambda: verb(norm(sum(sine(f, 2.6) for f in [1760, 2217, 2637, 3520]) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t_(2.6))) * adsr(2.6, 0.6, 1.2)) * 0.35, 2.5, 0.5))
reg('drip', lambda: verb(sine(lambda t: 900 + 2400 * t / 0.05, 0.05) * env(0.05, 0.001, 0.05) * 0.6, 1.5, 0.45))
reg('drip_big', lambda: verb(sine(lambda t: 500 + 1500 * t / 0.07, 0.07) * env(0.07, 0.001, 0.07), 2.5, 0.55))
reg('squeeze', lambda: verb(norm(fftfilt(saw(lambda t: 140 + 80 * t, 1.6), 100, 1500) * adsr(1.6, 0.1, 0.3)) * 0.5, 0.6, 0.15))
reg('pop', lambda: verb(norm(sine(lambda t: 300 + 900 * np.exp(-t * 40), 0.12) * env(0.12, 0.001, 0.1)) * 0.7, 0.6, 0.2))
reg('pulse', lambda: st(norm(sum(sine(55, 0.5) * env(0.5, 0.01, 0.5, 5) * 1 for _ in [0])) * 0.8))
reg('groan', lambda: verb(norm(fftfilt(saw(lambda t: 70 + 25 * np.sin(2 * np.pi * 0.4 * t) + 10 * t, 3.2), 40, 700) * adsr(3.2, 0.4, 1.2) + 0.3 * fftfilt(noise(3.2), 200, 900) * adsr(3.2, 0.6, 1.0)), 2.0, 0.35))
reg('spin_groan', lambda: S['groan']() * 1.1)
reg('ping', lambda: verb(sine(1500, 0.25) * env(0.25, 0.002, 0.25, 4), 3.0, 0.6))
reg('sonar', lambda: S['ping']())
reg('projector', lambda: st(norm(train(np.arange(0, 3, 1 / 24), click(0.004, 600, 4000), 3.1) + 0.15 * fftfilt(noise(3.1), 2000, 8000)) * 0.35))
reg('saw', lambda: st(norm(fftfilt(noise(1.6), 500, 4000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 3 * t_(1.6))))) * 0.5))
reg('slap', lambda: verb(norm(fftfilt(noise(0.2), 150, 2500) * env(0.2, 0.001, 0.08, 6)), 0.6, 0.2))
reg('ring', lambda: metalring(2.2, 620))
reg('ring_soft', lambda: metalring(3.0, 440) * 0.4)
reg('pen', lambda: st(norm(fftfilt(noise(1.6), 2500, 8000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 4 * t_(1.6))))) * 0.25))
def _clatter():
    y = np.zeros(int(1.6 * SR))
    for _ in range(50):
        u = tone([rng.uniform(1500, 3500)], 0.05, 0.001, 8); i = int(rng.uniform(0, 1.5) * SR); y[i:i + len(u)] += u
    return verb(norm(y) * 0.6, 0.6, 0.2)
reg('clatter', _clatter)
reg('engine', lambda: st(norm(fftfilt(saw(lambda t: 38 + 2 * np.sin(2 * np.pi * 0.5 * t), 4.5), 30, 400) * adsr(4.5, 0.8, 1.5)) * 0.6))
reg('linecreak', lambda: verb(norm(fftfilt(saw(lambda t: 220 + 60 * t, 1.6), 400, 3000) * adsr(1.6, 0.2, 0.4)) * 0.45, 1.0, 0.25))
reg('museum', lambda: st(norm(fftfilt(noise(5), 100, 600) * adsr(5, 1, 1.5)) * 0.25))
reg('tinnitus', lambda: st(sine(6200, 5) * adsr(5, 1.5, 2) * 0.05))
reg('cello', lambda: verb(norm(fftfilt(saw(lambda t: 65.4 * (1 + 0.004 * np.sin(2 * np.pi * 5 * t)), 4.5), 40, 900) * adsr(4.5, 1.0, 1.5)) * 0.7, 3.0, 0.4))
reg('slide', lambda: st(norm(fftfilt(noise(2.2), 80, 700) * adsr(2.2, 0.4, 0.8)) * 0.7))
reg('slide_long', lambda: st(norm(fftfilt(noise(5.5), 60, 600) * adsr(5.5, 0.8, 1.5)) * 0.8))
reg('glass', lambda: verb(norm(tone([2900, 2900 * 2.3, 2900 * 3.7], 1.5, 0.001, 4)) * 0.5, 2.0, 0.4))
reg('squelch', lambda: verb(norm(fftfilt(noise(0.35), 150, 1800) * env(0.35, 0.01, 0.3, 4) * (0.5 + 0.5 * np.sin(2 * np.pi * 30 * t_(0.35)))) * 0.6, 0.5, 0.15))
reg('lownote', lambda: verb(norm(tone([55, 110, 165, 220], 4.0, 0.005, 3, [1, .5, .3, .15])), 3.0, 0.4))
reg('reveal', lambda: (st(norm(sum(sine(f, 3) for f in [110, 164.8, 220, 329.6]) * np.linspace(0, 1, int(3 * SR)) ** 1.5 * adsr(3, 0.1, 0.4)) * 0.6)))
reg('ruler', lambda: S['tape']())
reg('tape', lambda: st(norm(fftfilt(noise(1.4), 1500, 6000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 40 * t_(1.4)))) * adsr(1.4, 0.02, 0.2)) * 0.35))
reg('spring', lambda: verb(norm(sine(lambda t: 300 + 200 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 3), 0.9) * env(0.9, 0.002, 0.9, 4)) * 0.4, 0.6, 0.2))
reg('shing', lambda: verb(norm(fftfilt(noise(0.6), 4000, 12000) * env(0.6, 0.005, 0.5, 4) + 0.5 * tone([3300, 4800], 0.6, 0.002, 4)) * 0.6, 1.5, 0.35))
reg('tear', lambda: st(norm(fftfilt(noise(0.9), 300, 4000) * (rng.random(int(0.9 * SR)) > 0.7) * adsr(0.9, 0.05, 0.2)) * 0.6))
reg('scanner', lambda: st(norm(sine(420, 3) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 6 * t_(3)))) * adsr(3, 0.2, 0.5)) * 0.3))
reg('flow', lambda: st(norm(fftfilt(noise(4), 200, 1500) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.4 * t_(4))) * adsr(4, 0.5, 1)) * 0.5))
reg('alarm', lambda: st(norm(np.concatenate([sine(880, 0.25), sine(660, 0.25)] * 3) * 0.6)))
reg('glitch', lambda: st(norm(fftfilt(noise(0.8), 500, 8000) * (rng.random(int(0.8 * SR)) > 0.5) * (np.sin(2 * np.pi * 13 * t_(0.8)) > 0)) * 0.6))
reg('glass_shriek', lambda: verb(norm(fftfilt(saw(lambda t: 2400 + 800 * np.sin(2 * np.pi * 3 * t), 1.2), 1500, 9000) * env(1.2, 0.01, 1.1, 3)) * 0.5, 1.5, 0.3))
reg('scrape', lambda: verb(norm(fftfilt(noise(3), 800, 6000) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 2.5 * t_(3)))) * adsr(3, 0.05, 0.6) + 0.4 * fftfilt(saw(lambda t: 1800 + 400 * np.sin(2 * np.pi * 1.3 * t), 3), 1000, 6000) * adsr(3, 0.05, 0.6)) * 0.7, 1.5, 0.3))
reg('slowroar', lambda: verb(norm(fftfilt(noise(3), 30, 500) * adsr(3, 0.05, 2) + fftfilt(saw(lambda t: 45 - 8 * t, 3), 30, 400) * adsr(3, 0.05, 2)), 3.0, 0.4))
reg('suckers', lambda: verb(norm(train(np.sort(rng.uniform(0, 2.5, 18)), fftfilt(noise(0.08), 200, 2000) * env(0.08, 0.002, 0.07), 2.7)) * 0.6, 0.6, 0.2))
reg('scratch', lambda: st(norm(fftfilt(saw(lambda t: 600 * np.abs(np.sin(2 * np.pi * 2.2 * t)) + 80, 0.6), 200, 5000) * adsr(0.6, 0.01, 0.1)) * 0.6))
reg('stop', lambda: st(norm(fftfilt(saw(lambda t: 300 * np.exp(-t * 5), 0.8), 40, 3000) * adsr(0.8, 0.01, 0.1)) * 0.6))
reg('ding', lambda: verb(norm(tone([1318, 1318 * 2.01], 1.5, 0.002, 4)) * 0.5, 1.5, 0.3))
reg('twang', lambda: verb(norm(saw(lambda t: 110 * (1 + 0.02 * np.exp(-t * 6)), 2.0) * env(2.0, 0.002, 2.0, 4)) * 0.6, 1.5, 0.3))
reg('release', lambda: verb(norm(fftfilt(noise(1.2), 100, 1500) * env(1.2, 0.05, 1.1, 3)) * 0.7, 1.0, 0.2))
reg('rumble', lambda: st(norm(fftfilt(noise(4.5), 20, 140) * adsr(4.5, 1.5, 1.5)) * 1.0))
reg('ink', lambda: verb(norm(fit(hit(60, 35, 1.0, 0.8, 500, 0.8, 0.2)[0], 1.0) + fit(_bubbles(1.0, 20)[0], 1.0)), 1.2, 0.3))
reg('thrash', lambda: st(norm(fftfilt(noise(4), 60, 1500) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 1.7 * t_(4)))) * adsr(4, 0.1, 1)) * 1.0))
reg('winch', lambda: st(norm(fftfilt(saw(lambda t: 95 + 3 * np.sin(2 * np.pi * 0.7 * t), 6), 50, 1200) * adsr(6, 0.5, 2)) * 0.5))
reg('swell', lambda: st(norm(sum(sine(f, 4) for f in [220, 277.2, 329.6, 440]) * np.linspace(0, 1, int(4 * SR)) ** 2 * adsr(4, 0.1, 1)) * 0.5))
def _gulls():
    y = np.zeros(int(3.5 * SR))
    for k in range(4):
        d = 0.45; g = sine(lambda t: 1400 + 900 * np.sin(np.pi * t / d) - 600 * t / d, d) * adsr(d, 0.03, 0.15)
        i = int((0.3 + k * 0.7) * SR); y[i:i + len(g)] += fftfilt(g, 600, 4000) * 0.4
    return verb(y, 1.5, 0.35, 5000, 0.4)
reg('gulls', _gulls)
reg('gasp', lambda: st(norm(fftfilt(noise(0.6), 400, 3000) * env(0.6, 0.05, 0.5)) * 0.4))
reg('lure', lambda: verb(norm(tone([1975, 2960], 1.2, 0.002, 3)) * 0.5, 3.0, 0.6))
reg('silence', lambda: np.zeros((2, 10)))
reg('saw_', lambda: np.zeros((2, 10)))

# ------------------------------------------------------------------ music beds
A1, A2 = 55.0, 110.0
def pad(freqs, d, cutoff=900, det=0.006, att=1.5, rel=1.5):
    y = np.zeros(int(d * SR))
    for f in freqs:
        for k in (-1, 0, 1): y += saw(f * (1 + det * k), d) / len(freqs)
    return fftfilt(y, 30, cutoff) * adsr(d, att, rel)
from functools import lru_cache
_tone = lru_cache(None)(lambda fs, d, a, dec, amps: tone(list(fs), d, a, dec, list(amps)))
def music(mood, d):
    t = t_(d); n = len(t)
    if mood == 'dark':
        y = pad([A1, A1 * 1.5, A2], d, 300) * 0.8 + fftfilt(noise(d), 40, 220) * 0.25 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t))
        U = hit(48, 30, 2.0, 0.1, 200, 1.0, 0.2)[0] * 0.5
        for b in np.arange(2.0, d, 4.0): u = U; i = int(b * SR); y[i:i + len(u)] += u[: max(0, n - i)]
        return verb(y, 3.0, 0.35, 2500)
    if mood == 'pulse':
        y = pad([A1, A1 * 1.5], d, 400) * 0.6
        U = (sine(A1, 0.2) + 0.4 * sine(A2, 0.2)) * env(0.2, 0.005, 0.18, 5) * 0.6
        for b in np.arange(0, d, 60 / 90 / 2): u = U; i = int(b * SR); y[i:i + len(u)] += u[: max(0, n - i)]
        return verb(y, 2.0, 0.25, 3000)
    if mood == 'archive':
        y = pad([A1 * 2, A1 * 2 * 1.189, A1 * 3], d, 500) * 0.35 + fftfilt(noise(d), 1500, 7000) * 0.02 * (rng.random(n) > 0.997)
        mel = [440, 392, 349.2, 329.6, 349.2, 392, 329.6, 293.7]
        for k, b in enumerate(np.arange(0.5, d, 1.6)): u = _tone((mel[k % 8], mel[k % 8] * 2), 1.6, 0.003, 3, (1, 0.25)) * 0.35; i = int(b * SR); y[i:i + len(u)] += u[: max(0, n - i)]
        return verb(y, 3.0, 0.45, 4000)
    if mood == 'tension':
        y = pad([A2, A2 * 1.059, A2 * 1.5, 220 * 1.414], d, 1400) * (0.3 + 0.5 * t / d) * (0.75 + 0.25 * np.sin(2 * np.pi * 6 * t))
        return verb(y, 2.5, 0.35, 5000)
    if mood == 'wonder':
        y = np.zeros(n); chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]]
        for k, b in enumerate(np.arange(0, d, 4.0)):
            seg = min(4.6, d - b); u = pad(chords[k % 4], seg, 1800, 0.004, 1.2, 1.4) * 0.6; i = int(b * SR); y[i:i + len(u)] += u[: max(0, n - i)]
        return verb(y, 3.5, 0.5, 6000)
    if mood == 'action':
        HT = fit(hit(70, 40, 0.18, 0.4, 900, 0.2, 0.05)[0], 0.18)
        y = pad([A1, A1 * 1.189, A1 * 1.5], d, 600) * 0.5
        for b in np.arange(0, d, 60 / 120 / 2):
            u = HT * (0.7 if int(b * 4) % 2 == 0 else 0.35); i = int(b * SR); y[i:i + len(u)] += u[: max(0, n - i)]
        return verb(y, 1.5, 0.2, 3000)
    if mood == 'epic':
        y = pad([A1, A1 * 1.5, A2, A2 * 1.189, A2 * 1.5], d, 1100, 0.008, 2.5, 2) * 0.9
        U = hit(55, 28, 1.6, 0.6, 600, 1.0, 0.3)[0] * 0.7
        for b in np.arange(0, d, 2.0): u = U; i = int(b * SR); y[i:i + len(u)] += u[: max(0, n - i)]
        return verb(y, 3.0, 0.35, 3500)
    if mood == 'sad':
        y = np.zeros(n); chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [130.8, 196, 261.6], [164.8, 207.7, 246.9]]
        for k, b in enumerate(np.arange(0, d, 3.2)):
            for j, f in enumerate(chords[k % 4]): u = _tone((f, f * 2), 3.0, 0.004, 2.5, (1, 0.2)) * 0.3; i = int((b + j * 0.12) * SR); y[i:i + len(u)] += u[: max(0, n - i)]
        y += pad([A2, A2 * 1.5], d, 600) * 0.2
        return verb(y, 3.5, 0.5, 5000)
    return np.zeros((2, n))

# ------------------------------------------------------------------ assemble
sfx = np.zeros((2, N)); mus = np.zeros((2, N)); amb = np.zeros((2, N))
cache = {}
def place(buf, x, t0, g=1.0):
    i = int(t0 * SR)
    if x.ndim == 1: x = st(x)
    j = min(N, i + x.shape[1]); buf[:, i:j] += x[:, : j - i] * g
missing = set()
for b in cues['beats']:
    for s in b['sfx']:
        name, off = s[0], s[1]; g = s[2] if len(s) > 2 else 1.0
        if name not in S: missing.add(name); continue
        if name not in cache: cache[name] = S[name]()
        x = cache[name]
        place(sfx, x / (np.max(np.abs(x)) + 1e-9), b['start'] + off, 0.55 * g)
if missing: print('missing sfx:', sorted(missing))
# music segments
segs, cur, t0 = [], 'dark', 0.0
for b in cues['beats']:
    if b['music'] and b['music'] != cur: segs.append((cur, t0, b['start'])); cur, t0 = b['music'], b['start']
segs.append((cur, t0, TOTAL))
import time
for mood, a, z in segs:
    _t=time.time()
    d = z - a + 1.0
    if mood == 'cut' or d < 0.3: continue
    m = music(mood, d)
    if m.ndim == 1: m = st(m)
    m = m / (np.max(np.abs(m)) + 1e-9)
    fade = np.minimum(1, np.minimum(np.arange(m.shape[1]) / (0.6 * SR), (m.shape[1] - np.arange(m.shape[1])) / (1.0 * SR)))
    place(mus, m * fade, a, 0.32); print(mood, round(z-a), "s", round(time.time()-_t,1), flush=True)
# underwater ambience everywhere except surface/title shots
ambient = fftfilt(rng.standard_normal(N), 25, 260); ambient = ambient / np.max(np.abs(ambient))
mask = np.zeros(N)
for b in cues['beats']:
    if b['type'] not in ('surface', 'card', 'title', 'diagram', 'archive', 'endcard'): mask[int(b['start'] * SR): int((b['start'] + b['dur']) * SR)] = 1
k = int(0.4 * SR); cs = np.concatenate([[0], np.cumsum(mask)]); idx = np.arange(N); lo = np.clip(idx - k // 2, 0, N); hi = np.clip(idx + k // 2, 0, N); mask = (cs[hi] - cs[lo]) / k
amb[0] = ambient * mask * 0.12; amb[1] = np.roll(ambient, 1500) * mask * 0.12

def write(path, x, peak=0.89):
    x = np.tanh(x * 1.2) / np.tanh(1.2); x = x / (np.max(np.abs(x)) + 1e-9) * peak
    y = (x.T * 32767).astype('<i2')
    with wave.open(path, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())
write('out/sfx.wav', sfx + amb, 0.85)
write('out/music.wav', mus, 0.6)
write('out/mix.wav', sfx + amb + mus, 0.8)
import sys; print('audio done', round(TOTAL, 1), 's; segments', len(segs))
