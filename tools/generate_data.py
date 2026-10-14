#!/usr/bin/env python3
"""
Genererer EKSEMPELDATA til prototypen (js/data.js).

Tallene er opdigtede, men konsistente: mandater beregnes med d'Hondt ud fra
stemmetal, så sum af mandater = kommunens antal byrådsmedlemmer.
Prototypen bruger IKKE officielle valgresultater.

Kør:  python3 tools/generate_data.py
"""
import hashlib
import json
import math
import random
import re
from pathlib import Path

REGIONS = {
    "Region Hovedstaden": ["Albertslund", "Allerød", "Ballerup", "Bornholm", "Brøndby", "Dragør", "Egedal", "Fredensborg", "Frederiksberg", "Frederikssund", "Furesø", "Gentofte", "Gladsaxe", "Glostrup", "Gribskov", "Halsnæs", "Helsingør", "Herlev", "Hillerød", "Hvidovre", "Høje-Taastrup", "Hørsholm", "Ishøj", "København", "Lyngby-Taarbæk", "Rudersdal", "Rødovre", "Tårnby", "Vallensbæk"],
    "Region Sjælland": ["Faxe", "Greve", "Guldborgsund", "Holbæk", "Kalundborg", "Køge", "Lejre", "Lolland", "Næstved", "Odsherred", "Ringsted", "Roskilde", "Slagelse", "Solrød", "Sorø", "Stevns", "Vordingborg"],
    "Region Syddanmark": ["Assens", "Billund", "Esbjerg", "Fanø", "Fredericia", "Faaborg-Midtfyn", "Haderslev", "Kerteminde", "Kolding", "Langeland", "Middelfart", "Nordfyns", "Nyborg", "Odense", "Svendborg", "Sønderborg", "Tønder", "Varde", "Vejen", "Vejle", "Ærø", "Aabenraa"],
    "Region Midtjylland": ["Favrskov", "Hedensted", "Herning", "Holstebro", "Horsens", "Ikast-Brande", "Lemvig", "Norddjurs", "Odder", "Randers", "Ringkøbing-Skjern", "Samsø", "Silkeborg", "Skanderborg", "Skive", "Struer", "Syddjurs", "Viborg", "Aarhus"],
    "Region Nordjylland": ["Brønderslev", "Frederikshavn", "Hjørring", "Jammerbugt", "Læsø", "Mariagerfjord", "Morsø", "Rebild", "Thisted", "Vesthimmerland", "Aalborg"],
}

PARTIES = {
    "A": ("Socialdemokratiet", "#E4003B"),
    "B": ("Radikale Venstre", "#733280"),
    "C": ("Det Konservative Folkeparti", "#00583C"),
    "D": ("Nye Borgerlige", "#0F4C5C"),
    "F": ("SF – Socialistisk Folkeparti", "#E5007D"),
    "I": ("Liberal Alliance", "#12B7C4"),
    "K": ("Kristendemokraterne", "#F58220"),
    "M": ("Moderaterne", "#8B5CB8"),
    "O": ("Dansk Folkeparti", "#C9A400"),
    "V": ("Venstre", "#0B6CB5"),
    "Æ": ("Danmarksdemokraterne", "#5D6D7E"),
    "Ø": ("Enhedslisten", "#B5162B"),
    "Å": ("Alternativet", "#2EBD59"),
}

# Landsgennemsnitlige "basisandele" (eksempel) pr. valg
BASE = {
    "kv2025": {"A": 22, "B": 5, "C": 9, "F": 10, "I": 7, "K": 1.5, "M": 5, "O": 4, "V": 15, "Æ": 5, "Ø": 6, "Å": 1.5},
    "kv2021": {"A": 24, "B": 6, "C": 11, "D": 3, "F": 9, "I": 3, "K": 2, "O": 7, "V": 22, "Ø": 7, "Å": 3},
}

# Faste profiler til testcases (så opgaverne T1–T4 har entydige svar)
FIXED = {
    "Hørsholm": {
        "seats": 19, "electorate": 18400,
        "kv2025": {"turnout": 74.5, "shares": {"C": 31.0, "V": 21.5, "A": 16.2, "F": 11.0, "I": 9.8, "B": 5.6, "Ø": 4.9}},
        "kv2021": {"turnout": 72.1, "shares": {"C": 36.0, "V": 24.0, "A": 14.0, "F": 8.0, "I": 4.0, "B": 6.0, "Ø": 4.0, "O": 2.0, "Å": 2.0}},
    },
    "Ishøj": {
        "seats": 15, "electorate": 17200,
        "kv2025": {"turnout": 54.3, "shares": {"A": 44.0, "F": 11.0, "V": 8.5, "O": 7.5, "Ø": 8.0, "C": 4.5, "I": 5.0, "B": 4.5, "Æ": 4.0, "M": 3.0}},
        "kv2021": {"turnout": 52.0, "shares": {"A": 52.0, "O": 12.0, "V": 9.0, "F": 8.0, "Ø": 6.0, "C": 4.0, "B": 3.0, "K": 2.0, "Å": 4.0}},
    },
}

BIG = {"København": (55, 460000), "Aarhus": (31, 260000), "Odense": (29, 165000), "Aalborg": (31, 155000), "Frederiksberg": (25, 82000),
       "Esbjerg": (31, 85000), "Randers": (31, 75000), "Kolding": (31, 70000), "Horsens": (31, 70000), "Vejle": (31, 80000), "Roskilde": (31, 70000)}
SMALL = {"Fanø": 11, "Samsø": 11, "Ærø": 11, "Læsø": 11}
OFFICIAL_NAMES = {"Aabenraa": "Aabenraa", "Aalborg": "Aalborg", "Aarhus": "Aarhus"}


def rng(*parts):
    h = hashlib.md5("|".join(parts).encode()).hexdigest()
    return random.Random(int(h[:12], 16))


def slug(name):
    s = name.lower()
    for a, b in (("æ", "ae"), ("ø", "o"), ("å", "aa")):
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def dhondt(votes, seats):
    res = {p: 0 for p in votes}
    for _ in range(seats):
        best = max(votes, key=lambda p: (votes[p] / (res[p] + 1), votes[p], p))
        res[best] += 1
    return res


def make_result(name, valg, seats, electorate, fixed):
    r = rng(name, valg)
    if fixed:
        turnout = fixed["turnout"]
        shares = dict(fixed["shares"])
    else:
        turnout = round(r.uniform(60, 77) if valg == "kv2025" else r.uniform(62, 75), 1)
        shares = {}
        for p, b in BASE[valg].items():
            v = b * math.exp(r.gauss(0, 0.45))
            if v >= 2.0:
                shares[p] = v
    tot = sum(shares.values())
    shares = {p: s / tot * 100 for p, s in shares.items()}
    cast = round(electorate * turnout / 100)
    valid = round(cast * 0.992)
    votes = {p: max(1, round(valid * s / 100)) for p, s in shares.items()}
    diff = valid - sum(votes.values())
    top = max(votes, key=votes.get)
    votes[top] += diff
    mand = dhondt(votes, seats)
    return {
        "electorate": electorate, "cast": cast, "valid": valid, "turnout": turnout,
        "votes": votes, "mandates": mand,
    }


def main():
    komm = []
    for region, names in REGIONS.items():
        for n in names:
            r = rng(n, "meta")
            if n in FIXED:
                seats, electorate = FIXED[n]["seats"], FIXED[n]["electorate"]
            elif n in BIG:
                seats, electorate = BIG[n]
                electorate = round(electorate * r.uniform(0.95, 1.05))
            elif n in SMALL:
                seats, electorate = SMALL[n], r.randint(3000, 5000)
            else:
                seats = r.choice([25, 27, 29, 31]) if r.random() < 0.55 else r.choice([19, 21, 23, 25])
                electorate = r.randint(9000, 65000)
            results = {}
            for valg in ("kv2025", "kv2021"):
                fixed = FIXED.get(n, {}).get(valg)
                results[valg] = make_result(n, valg, seats, round(electorate * (1.0 if valg == "kv2025" else 0.985)), fixed)
            komm.append({"id": slug(n), "name": n, "region": region, "seats": seats, "results": results})
    komm.sort(key=lambda k: k["name"].replace("Aa", "Å").replace("Æ", "Zæ").replace("Ø", "Zø").replace("Å", "Zå"))
    data = {
        "meta": {"note": "EKSEMPELDATA – ikke officielle valgresultater", "count": len(komm)},
        "parties": {k: {"name": v[0], "color": v[1]} for k, v in PARTIES.items()},
        "elections": {
            "kv2025": {"name": "Kommunalvalg 2025", "date": "18. november 2025", "prev": "kv2021"},
            "kv2021": {"name": "Kommunalvalg 2021", "date": "16. november 2021", "prev": None},
        },
        "kommuner": komm,
    }
    out = Path(__file__).resolve().parent.parent / "js" / "data.js"
    out.write_text("// GENERERET af tools/generate_data.py – eksempeldata, ikke officielle tal\nwindow.DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Skrev {out} ({len(komm)} kommuner, {out.stat().st_size // 1024} kB)")
    for n in ("Hørsholm", "Ishøj"):
        k = next(x for x in komm if x["name"] == n)
        for valg in ("kv2025", "kv2021"):
            m = {p: v for p, v in sorted(k["results"][valg]["mandates"].items(), key=lambda x: -x[1]) if v}
            print(n, valg, m)


if __name__ == "__main__":
    main()
