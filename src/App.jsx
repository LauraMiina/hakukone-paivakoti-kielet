import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";

const norm = (s) => (s ?? "").toString().trim().toLowerCase().replace(/\s+/g, " ");

const fmtInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? new Intl.NumberFormat("fi-FI").format(n) : "–";
};

const fmtPct = (v) =>
  Number.isFinite(v)
    ? `${new Intl.NumberFormat("fi-FI", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(v)} %`
    : "–";

export default function App() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetch("/paivakoti_kielet.csv")
      .then((r) => {
        if (!r.ok) throw new Error(`CSV lataus epäonnistui (${r.status})`);
        return r.text();
      })
      .then((text) => {
        const parsed = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          delimiter: ";",
        });

        const cleaned = parsed.data
          .map((r) => {
            const alue = r["alue"] ?? r["Alue"] ?? r["ALUE"];
            const kaikki = Number(r["kaikki"]);
            const vieras = Number(r["vieraskieliset"]);

            if (!alue) return null;
            if (!Number.isFinite(kaikki) || kaikki <= 0) return null;
            if (!Number.isFinite(vieras) || vieras < 0) return null;

            return {
              alue: String(alue).trim(),
              key: norm(alue),
              kaikki,
              vieras,
              osuus: (vieras / kaikki) * 100,
            };
          })
          .filter(Boolean);

        setRows(cleaned);
        setLoadError("");
      })
      .catch((e) => {
        console.error(e);
        setLoadError(
          "Datan lataus epäonnistui. Tarkista että paivakoti_kielet.csv on public-kansiossa ja että tiedoston nimi on oikein."
        );
        setRows([]);
      });
  }, []);

  const kokoMaa = useMemo(
    () => rows.find((r) => norm(r.alue) === norm("KOKO MAA")) ?? null,
    [rows]
  );

  const municipalities = useMemo(
    () => rows.filter((r) => norm(r.alue) !== norm("KOKO MAA")),
    [rows]
  );

  const suggestions = useMemo(() => {
    const nq = norm(q);
    if (!nq) return [];
    return municipalities.filter((r) => r.key.includes(nq)).slice(0, 8);
  }, [q, municipalities]);

  const selected = useMemo(() => {
    const nq = norm(q);
    if (!nq) return null;
    return municipalities.find((r) => r.key === nq) ?? suggestions[0] ?? null;
  }, [q, municipalities, suggestions]);

  const comparisonText = useMemo(() => {
    if (!selected || !kokoMaa) return null;
    const d = selected.osuus - kokoMaa.osuus;
    const abs = Math.abs(d);

    if (abs < 0.5) return "Osuus on samaa luokkaa kuin koko Suomessa.";
    return d > 0
      ? "Osuus on suurempi kuin tyypillisesti koko maassa."
      : "Osuus on pienempi kuin tyypillisesti koko maassa.";
  }, [selected, kokoMaa]);

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 640,
        margin: "0 auto",
        padding: 24,
        color: "#4f6f8d",
      }}
    >
      {}
      <h1 style={{ marginBottom: 8, color: "#1c477f" }}>
        Mikä on tilanne omassa kotikunnassasi?
      </h1>

      <div style={{ color: "#1b4165ff", marginBottom: 16 }}>
        Hae kuntaa ja vertaa vieraskielisten osuutta koko Suomeen.
      </div>

      <label>
        <div style={{ marginBottom: 6, color: "#4f6f8d" }}>Hae kuntaa</div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Esim. Helsinki"
          style={{
            width: "90%", 
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #bfd4e9",
            outline: "none",
            color: "#4f6f8d",
          }}
        />
      </label>

      {suggestions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {suggestions.map((s) => (
            <button
              key={s.key}
              onClick={() => setQ(s.alue)}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid #1c477f",
                background: "#1c477f",
                cursor: "pointer",
                color: "white",
      }}

            >
              {s.alue}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 18,
          border: "1px solid #bfd4e9",
          borderRadius: 16,
          padding: 16,
          background: "white",
          color: "#000",
        }}
      >
        {!selected ? (
          <div>Hae kuntaa ja näet tuloksen.</div>
        ) : (
          <>
            <div style={{ fontSize: 34, fontWeight: 700 }}>{selected.alue}</div>

            <div style={{ fontSize: 16, marginTop: 6 }}>
              Vieraskielisten osuus kunnan varhaiskasvatuksessa on{" "}
              <span style={{ fontSize: 30, fontWeight: 800, color: "#000" }}>
                {fmtPct(selected.osuus)}
              </span>
            </div>

            <div style={{ marginTop: 6 }}>
              Varhaiskasvatuksessa on yhteensä <b>{fmtInt(selected.kaikki)}</b> lasta, joista
              vieraskielisiä on <b>{fmtInt(selected.vieras)}</b>.
            </div>

            {kokoMaa && comparisonText && (
              <div style={{ marginTop: 10 }}>
                <b>{comparisonText}</b>
              </div>
            )}

            {kokoMaa && (
              <div style={{ marginTop: 10 }}>
                Koko Suomen päiväkodeissa vieraskielisten osuus on <b>{fmtPct(kokoMaa.osuus)}</b>.
                Varhaiskasvatuksessa on yhteensä <b>{fmtInt(kokoMaa.kaikki)}</b> lasta, joista
                vieraskielisiä on <b>{fmtInt(kokoMaa.vieras)}</b>.
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                  <i>Lähde: Tilastokeskus</i>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {loadError && <div style={{ marginTop: 12, color: "#a00" }}>{loadError}</div>}

      {!loadError && !kokoMaa && rows.length > 0 && (
        <div style={{ marginTop: 12, color: "#a00" }}>
          Huom: “KOKO MAA” -riviä ei löytynyt datasta (tarkista, että alue-sarakkeessa lukee täsmälleen KOKO MAA).
        </div>
      )}
    </div>
  );
}
