import { useState, useMemo } from "react";

const lawData = {
  categories: [
    {
      id: "license",
      name: "資格・技能証明",
      color: "#3b82f6",
      articles: [
        {
          id: "law2",
          law: "航空法",
          article: "第2条",
          title: "定義",
          summary: "「航空運送事業」＝他人の需要に応じ、航空機を使用して有償で旅客又は貨物を運送する事業。「国際航空運送事業」＝本邦内と本邦外の地点間又は本邦外の各地間で行う航空運送事業。",
          keywords: ["航空運送事業", "国際航空運送事業", "有償", "旅客", "貨物"],
          relatedTo: ["law100", "law72", "law77"],
        },
        {
          id: "law28",
          law: "航空法",
          article: "第28条",
          title: "業務範囲",
          summary: "技能証明（航空機に乗り組んで運航を行う者）及び第31条第1項の航空身体検査証明を有するものでなければ、業務範囲の欄に掲げる行為を行ってはならない。",
          keywords: ["技能証明", "航空身体検査証明", "業務範囲"],
          relatedTo: ["law29", "law31", "law67", "law149"],
        },
        {
          id: "law29",
          law: "航空法",
          article: "第29条",
          title: "技能証明の試験",
          summary: "国土交通大臣は技能証明のため試験を行う。試験は学科試験及び実地試験。学科試験合格者でなければ実地試験を受けられない。指定養成施設修了者は試験の全部又は一部を免除可。",
          keywords: ["学科試験", "実地試験", "技能証明", "指定養成施設"],
          relatedTo: ["law28", "law72"],
        },
        {
          id: "law31",
          law: "航空法",
          article: "第31条第1項",
          title: "航空身体検査証明",
          summary: "航空業務に従事するには航空身体検査証明が必要。身体検査に適合の状態での受審が必要であり、不適合の状態では技能審査を受けることが出来ない。",
          keywords: ["航空身体検査証明", "身体検査", "乗員健康管理医"],
          relatedTo: ["law28", "law67"],
        },
        {
          id: "law67",
          law: "航空法",
          article: "第67条",
          title: "携帯する書類",
          summary: "航空従事者は航空業務を行う場合、技能証明書を携帯しなければならない。航空機に乗り組む場合は航空身体検査証明書も携帯。",
          keywords: ["技能証明書", "航空身体検査証明書", "携帯"],
          relatedTo: ["law28", "law31", "om5710"],
        },
        {
          id: "law72",
          law: "航空法",
          article: "第72条第1項",
          title: "機長の認定",
          summary: "国土交通大臣による知識及び能力の認定を受けなければ、航空運送事業の用に供する航空機には機長として乗り組んではならない。",
          keywords: ["機長認定", "知識及び能力", "航空運送事業"],
          relatedTo: ["law2", "law29", "rule163"],
        },
        {
          id: "law149",
          law: "航空法",
          article: "第149条",
          title: "罰則",
          summary: "業務範囲を超えて操縦を行った者等は、1年以下の懲役又は30万円以下の罰金。航空従事者への罰としては最も重い。偽りの手段で航空身体検査証明書の交付を受けた者も同様。",
          keywords: ["懲役1年", "罰金30万円", "業務範囲違反", "最重罰"],
          relatedTo: ["law28"],
        },
      ],
    },
    {
      id: "captain",
      name: "機長の責務・権限",
      color: "#ef4444",
      articles: [
        {
          id: "law73",
          law: "航空法",
          article: "第73条",
          title: "機長の指揮監督権",
          summary: "機長は、当該航空機に乗り組んでその職務を行う者を指揮監督する。航空法上の「指揮」という文言はこれと施行規則163条の2点のみ。",
          keywords: ["指揮監督", "乗組員", "職務"],
          relatedTo: ["rule163", "law73_4", "law74"],
        },
        {
          id: "law71_2",
          law: "航空法",
          article: "第71条の2",
          title: "見張りの義務",
          summary: "航空機の操縦を行っている者の見張り義務。定期運送用操縦士に限らず、航空機の操縦を行っている者が対象。",
          keywords: ["見張り義務", "操縦者"],
          relatedTo: ["law76"],
        },
        {
          id: "law73_2",
          law: "航空法",
          article: "第73条の2",
          title: "出発前の確認",
          summary: "機長は、国土交通省令で定めるところにより、出発前に航空機の整備状況、気象情報、航空情報、燃料・オイル搭載量、重量・重心位置等を確認しなければならない。",
          keywords: ["出発前確認", "整備状況", "気象情報", "航空情報", "燃料", "重量・重心位置"],
          relatedTo: ["law73", "law99", "rule175", "om2_1_3_10"],
        },
        {
          id: "law73_4",
          law: "航空法",
          article: "第73条の4",
          title: "安全阻害行為等の措置",
          summary: "機長は安全阻害行為等を抑止するための措置をとる権限があり、「拘束」したり「降機」させることができる。禁止命令対象8行為に対しては行為を止めるよう「命令」できる。",
          keywords: ["安全阻害行為", "拘束", "降機", "命令", "禁止命令"],
          relatedTo: ["law73", "law74"],
        },
        {
          id: "law74",
          law: "航空法",
          article: "第74条",
          title: "旅客への命令権",
          summary: "機長は、航空機又は旅客の危難が生じた場合又は危難が生ずるおそれがあると認める場合は、旅客に対し避難の方法その他安全のため必要な事項について命令できる。SBS点灯も法的にはこの条文に基づく命令。",
          keywords: ["旅客命令権", "危難", "避難", "Seat Belt Sign"],
          relatedTo: ["law73", "law73_4"],
        },
        {
          id: "law76",
          law: "航空法",
          article: "第76条",
          title: "報告の義務",
          summary: "機長の「報告の義務」。航空法に明記されている「義務」は、見張り義務（第71条の2）と報告の義務（第76条）の2つ。報告の義務は機長が対象。",
          keywords: ["報告義務", "機長"],
          relatedTo: ["law71_2"],
        },
        {
          id: "law77",
          law: "航空法",
          article: "第77条",
          title: "運航管理者",
          summary: "航空運送事業の用に供する航空機は、運航管理者の承認を受けなければ出発し又は飛行計画を変更してはならない。出発の可否は機長が決めるが、運航管理者の承認も必要。",
          keywords: ["運航管理者", "承認", "出発", "飛行計画変更"],
          relatedTo: ["law2", "law73_2", "law100"],
        },
      ],
    },
    {
      id: "safety",
      name: "安全・危険物",
      color: "#f59e0b",
      articles: [
        {
          id: "law86_2",
          law: "航空法",
          article: "第86条の2",
          title: "危険物の取扱い",
          summary: "航空運送事業者は危険物の輸送・持ち込みを拒絶し、取卸しを要求できる。自ら取り卸せるのは託送人又は所持人がその場に居合わせない場合に限る。国土交通大臣は航空運送事業者に措置を命ずることができる。",
          keywords: ["危険物", "輸送拒絶", "取卸し", "持ち込み拒絶"],
          relatedTo: ["law73_4"],
        },
        {
          id: "law99",
          law: "航空法",
          article: "第99条",
          title: "航空情報の提供",
          summary: "国土交通大臣が提供する航空情報。普段確認しているNOTAMと法的に要求される航空情報の確認がどのような関係にあるか理解が必要。",
          keywords: ["航空情報", "NOTAM", "国土交通大臣"],
          relatedTo: ["law73_2", "aip"],
        },
        {
          id: "law100",
          law: "航空法",
          article: "第100条",
          title: "航空運送事業の許可",
          summary: "航空機に有償で旅客や貨物を載せる航空会社を経営しようとする場合、事業開始の前に国土交通大臣の許可を受けなければならない。",
          keywords: ["事業許可", "国土交通大臣"],
          relatedTo: ["law2", "law77"],
        },
      ],
    },
    {
      id: "rules",
      name: "施行規則",
      color: "#8b5cf6",
      articles: [
        {
          id: "rule_bt2",
          law: "航空法施行規則",
          article: "別表第二",
          title: "飛行時間の定義",
          summary: "定期運送用操縦士の資格に必要な飛行時間の定義。飛行日誌記入要領に基づき記録。",
          keywords: ["飛行時間", "飛行日誌"],
          relatedTo: ["rule44"],
        },
        {
          id: "rule44",
          law: "航空法施行規則",
          article: "第44条",
          title: "飛行日誌の証明方法",
          summary: "飛行記録は航空機の種類ごとに飛行日誌を別にして記録。青又は黒のインク又はボールペンを使用。修正液は使用不可。副操縦士は機長の証明を受ける。",
          keywords: ["飛行日誌", "青又は黒", "修正液不可", "機長証明"],
          relatedTo: ["rule_bt2"],
        },
        {
          id: "rule163",
          law: "航空法施行規則",
          article: "第163条第2項",
          title: "機長の知識及び能力",
          summary: "法第72条第1項の国土交通省令で定める知識及び能力。「ハ」＝航空機乗組員及び客室乗務員に対する指揮監督。",
          keywords: ["知識及び能力", "指揮監督", "客室乗務員"],
          relatedTo: ["law72", "law73"],
        },
        {
          id: "rule175",
          law: "航空法施行規則",
          article: "第164条の16",
          title: "燃料搭載基準",
          summary: "タービン発動機装備の飛行機でIFRにより飛行し代替空港を飛行計画に表示するもの：着陸地まで+代替空港まで+上空450mで30分待機+不測の事態の燃料。発動機不作動/与圧喪失の場合は15分待機。",
          keywords: ["燃料搭載", "450m", "30分", "15分", "代替空港", "不測の事態"],
          relatedTo: ["law73_2"],
        },
        {
          id: "rule189",
          law: "航空法施行規則",
          article: "第189条",
          title: "空港等付近の航行方法",
          summary: "計器飛行方式により着陸しようとする場合の復行条件：①進入限界高度より高い特定地点で気象条件未満、②進入限界高度以下で目視物標の視認・識別による位置確認不能。",
          keywords: ["復行", "進入限界高度", "目視物標", "気象条件", "ILS"],
          relatedTo: ["law73_2"],
        },
      ],
    },
    {
      id: "reference",
      name: "AIP・基準等",
      color: "#10b981",
      articles: [
        {
          id: "aip",
          law: "AIP",
          article: "GEN 1.5",
          title: "RNAV航行の規定",
          summary: "航法精度が指定された経路又は空域におけるRNAV航行には国土交通大臣の許可が必要。RNP AR APCHは方式毎に許可。RNP10は広域航法システム2式が必要。",
          keywords: ["RNAV", "RNP AR APCH", "RNP10", "広域航法システム", "許可"],
          relatedTo: ["law99"],
        },
        {
          id: "aim_j",
          law: "AIM-J",
          article: "11-20",
          title: "航空情報サーキュラー（AIC）",
          summary: "運航の安全、飛行方法・技術、行政又は法律上の事項についての説明的、助言的性格の情報。暦年一連番号、チェックリスト年1回発行。",
          keywords: ["AIC", "説明的", "助言的", "年1回", "チェックリスト"],
          relatedTo: ["law99"],
        },
      ],
    },
    {
      id: "company",
      name: "社内規定（OM等）",
      color: "#06b6d4",
      articles: [
        {
          id: "om_sup98",
          law: "OM Supplement",
          article: "9.8",
          title: "飛行規程の代用",
          summary: "JALの航空機には飛行規程は搭載されていない。運航規程第3巻とAOM、MEL/CDL Manualをもって代用。",
          keywords: ["飛行規程代用", "運航規程第3巻", "AOM", "MEL/CDL"],
          relatedTo: ["law73_2"],
        },
        {
          id: "om2_1_3_10",
          law: "OM Supplement",
          article: "2.1.3.10",
          title: "機体の整備状況の確認",
          summary: "運航乗務員は①確認主任者からBriefingを受ける、②機体の外部点検、③搭載用航空日誌等の整備記録を点検する。",
          keywords: ["整備状況", "外部点検", "確認主任者", "Briefing"],
          relatedTo: ["law73_2"],
        },
        {
          id: "om5710",
          law: "OM",
          article: "5.7.10",
          title: "乗務に必要な携帯品",
          summary: "航空法第67条の技能証明書・航空身体検査証明書に加え、社内で定める携帯品。",
          keywords: ["携帯品", "技能証明書"],
          relatedTo: ["law67"],
        },
        {
          id: "om_sup2ii",
          law: "OM Supplement",
          article: "2-II, S-5-13",
          title: "Multi-Crew Co-operation (MCC)",
          summary: "PICはPF/PMにかかわらず運航全般のマネジメント及びチームによる意思決定を遂行。PFとPMの業務を明確にし、PFが操縦操作に集中できるよう業務配分。常に相互モニタリング。",
          keywords: ["MCC", "PIC", "PF", "PM", "チーム意思決定", "モニタリング"],
          relatedTo: ["law73", "rule163"],
        },
      ],
    },
  ],
};

const allArticles = lawData.categories.flatMap(c =>
  c.articles.map(a => ({ ...a, categoryId: c.id, categoryColor: c.color, categoryName: c.name }))
);

export default function LawRelationshipMap() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("map");

  const filtered = useMemo(() => {
    let items = allArticles;
    if (selectedCategory) items = items.filter(a => a.categoryId === selectedCategory);
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      items = items.filter(a =>
        a.title.toLowerCase().includes(t) ||
        a.article.toLowerCase().includes(t) ||
        a.summary.toLowerCase().includes(t) ||
        a.keywords.some(k => k.toLowerCase().includes(t))
      );
    }
    return items;
  }, [selectedCategory, searchTerm]);

  const related = useMemo(() => {
    if (!selectedArticle) return [];
    const art = allArticles.find(a => a.id === selectedArticle);
    if (!art) return [];
    const relatedIds = new Set(art.relatedTo || []);
    const reverseRelated = allArticles.filter(a => a.relatedTo?.includes(selectedArticle)).map(a => a.id);
    reverseRelated.forEach(id => relatedIds.add(id));
    return allArticles.filter(a => relatedIds.has(a.id));
  }, [selectedArticle]);

  const selectedArt = allArticles.find(a => a.id === selectedArticle);

  const s = {
    root: {
      minHeight: "100vh",
      background: "#0b0f1a",
      color: "#e2e8f0",
      fontFamily: "'Noto Sans JP', -apple-system, sans-serif",
    },
    topBar: {
      background: "rgba(15,20,35,0.95)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      padding: "16px 20px",
      position: "sticky",
      top: 0,
      zIndex: 10,
    },
    container: { maxWidth: 960, margin: "0 auto", padding: "0 16px" },
    h1: {
      fontSize: 22,
      fontWeight: 800,
      background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      marginBottom: 4,
    },
    search: {
      width: "100%",
      padding: "10px 14px",
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,0.1)",
      background: "rgba(255,255,255,0.04)",
      color: "#e2e8f0",
      fontSize: 14,
      fontFamily: "inherit",
      outline: "none",
      marginTop: 12,
    },
    catBtn: (active, color) => ({
      padding: "6px 12px",
      borderRadius: 6,
      border: `1.5px solid ${active ? color : "rgba(255,255,255,0.08)"}`,
      background: active ? `${color}20` : "transparent",
      color: active ? color : "#64748b",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 600,
      fontFamily: "inherit",
      transition: "all 0.15s",
    }),
    card: (isSelected, isRelated, color) => ({
      padding: "16px 18px",
      borderRadius: 12,
      border: `1.5px solid ${isSelected ? color : isRelated ? `${color}66` : "rgba(255,255,255,0.06)"}`,
      background: isSelected ? `${color}12` : isRelated ? `${color}08` : "rgba(255,255,255,0.02)",
      cursor: "pointer",
      transition: "all 0.2s",
      position: "relative",
      overflow: "hidden",
    }),
    badge: (color) => ({
      fontSize: 10,
      fontWeight: 700,
      padding: "2px 8px",
      borderRadius: 4,
      background: `${color}25`,
      color: color,
      letterSpacing: "0.03em",
    }),
    detailPanel: {
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14,
      padding: 24,
      marginBottom: 20,
    },
  };

  return (
    <div style={s.root}>
      {/* Top Bar */}
      <div style={s.topBar}>
        <div style={s.container}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={s.h1}>航空法条項 関係性マップ</h1>
              <p style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.1em" }}>CMD GS3 — 法条項の相互関係と体系</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["map", "tree"].map(m => (
                <button key={m} onClick={() => setViewMode(m)} style={{
                  ...s.catBtn(viewMode === m, "#60a5fa"),
                  fontSize: 11,
                }}>{m === "map" ? "マップ" : "ツリー"}</button>
              ))}
            </div>
          </div>
          <input
            style={s.search}
            placeholder="条文番号・キーワードで検索（例: 73条, 機長, 燃料）"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setSelectedArticle(null); }}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => { setSelectedCategory(null); setSelectedArticle(null); }}
              style={s.catBtn(!selectedCategory, "#94a3b8")}
            >全て</button>
            {lawData.categories.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedCategory(selectedCategory === c.id ? null : c.id); setSelectedArticle(null); }}
                style={s.catBtn(selectedCategory === c.id, c.color)}
              >{c.name} ({c.articles.length})</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...s.container, paddingTop: 20, paddingBottom: 40 }}>
        {/* Detail Panel */}
        {selectedArt && (
          <div style={s.detailPanel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <span style={s.badge(selectedArt.categoryColor)}>{selectedArt.categoryName}</span>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 8, color: "#f1f5f9" }}>
                  {selectedArt.law} {selectedArt.article}
                </h2>
                <p style={{ fontSize: 15, fontWeight: 600, color: selectedArt.categoryColor, marginTop: 2 }}>
                  {selectedArt.title}
                </p>
              </div>
              <button onClick={() => setSelectedArticle(null)} style={{
                background: "rgba(255,255,255,0.06)", border: "none", color: "#94a3b8",
                width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit",
              }}>✕</button>
            </div>

            <p style={{ fontSize: 14, lineHeight: 1.9, color: "#94a3b8", marginBottom: 16 }}>
              {selectedArt.summary}
            </p>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {selectedArt.keywords.map(kw => (
                <span key={kw} style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 4,
                  background: "rgba(255,255,255,0.05)", color: "#cbd5e1",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}>#{kw}</span>
              ))}
            </div>

            {related.length > 0 && (
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>
                  関連条項 ({related.length}件)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {related.map(r => (
                    <button key={r.id} onClick={() => setSelectedArticle(r.id)} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                      borderRadius: 8, border: `1px solid ${r.categoryColor}33`,
                      background: `${r.categoryColor}08`, cursor: "pointer", textAlign: "left",
                      fontFamily: "inherit", color: "#e2e8f0", fontSize: 13, transition: "all 0.15s",
                    }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                        background: r.categoryColor,
                      }} />
                      <span style={{ fontWeight: 700, color: r.categoryColor, minWidth: 100 }}>
                        {r.law} {r.article}
                      </span>
                      <span style={{ color: "#94a3b8" }}>{r.title}</span>
                      <span style={{ marginLeft: "auto", fontSize: 16, color: "#475569" }}>→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* View Mode: Map */}
        {viewMode === "map" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {filtered.map(art => {
              const isSel = selectedArticle === art.id;
              const isRel = related.some(r => r.id === art.id);
              const dimmed = selectedArticle && !isSel && !isRel;
              return (
                <div
                  key={art.id}
                  onClick={() => setSelectedArticle(isSel ? null : art.id)}
                  style={{
                    ...s.card(isSel, isRel, art.categoryColor),
                    opacity: dimmed ? 0.3 : 1,
                    transform: isSel ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={s.badge(art.categoryColor)}>{art.law}</span>
                    {isRel && !isSel && (
                      <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700 }}>関連</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", marginBottom: 2 }}>
                    {art.article}
                  </h3>
                  <p style={{ fontSize: 13, fontWeight: 600, color: art.categoryColor, marginBottom: 8 }}>
                    {art.title}
                  </p>
                  <p style={{ fontSize: 12, lineHeight: 1.7, color: "#64748b", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {art.summary}
                  </p>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                    {art.keywords.slice(0, 3).map(kw => (
                      <span key={kw} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "rgba(255,255,255,0.04)", color: "#475569" }}>
                        {kw}
                      </span>
                    ))}
                    {art.relatedTo?.length > 0 && (
                      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "rgba(255,255,255,0.04)", color: "#475569" }}>
                        🔗{art.relatedTo.length}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View Mode: Tree */}
        {viewMode === "tree" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {lawData.categories
              .filter(c => !selectedCategory || c.id === selectedCategory)
              .map(cat => {
                const catArticles = cat.articles.filter(a => 
                  filtered.some(f => f.id === a.id)
                );
                if (catArticles.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
                      paddingBottom: 8, borderBottom: `2px solid ${cat.color}33`,
                    }}>
                      <span style={{
                        width: 12, height: 12, borderRadius: 3, background: cat.color,
                      }} />
                      <h2 style={{ fontSize: 16, fontWeight: 800, color: cat.color }}>{cat.name}</h2>
                      <span style={{ fontSize: 12, color: "#475569" }}>({catArticles.length}条)</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 16, borderLeft: `2px solid ${cat.color}22` }}>
                      {catArticles.map(art => {
                        const isSel = selectedArticle === art.id;
                        const isRel = related.some(r => r.id === art.id);
                        const dimmed = selectedArticle && !isSel && !isRel;
                        return (
                          <div
                            key={art.id}
                            onClick={() => setSelectedArticle(isSel ? null : art.id)}
                            style={{
                              ...s.card(isSel, isRel, cat.color),
                              opacity: dimmed ? 0.25 : 1,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: cat.color, minWidth: 90 }}>
                                {art.article}
                              </span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>
                                {art.title}
                              </span>
                              {isRel && !isSel && (
                                <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, marginLeft: "auto" }}>← 関連</span>
                              )}
                            </div>
                            {(isSel || isRel) && (
                              <p style={{ fontSize: 12, lineHeight: 1.7, color: "#94a3b8", marginTop: 8 }}>
                                {art.summary}
                              </p>
                            )}
                            {isSel && art.relatedTo?.length > 0 && (
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                                {art.relatedTo.map(rid => {
                                  const rArt = allArticles.find(a => a.id === rid);
                                  return rArt ? (
                                    <span key={rid} onClick={e => { e.stopPropagation(); setSelectedArticle(rid); }} style={{
                                      fontSize: 11, padding: "3px 8px", borderRadius: 4,
                                      background: `${rArt.categoryColor}15`, color: rArt.categoryColor,
                                      border: `1px solid ${rArt.categoryColor}33`, cursor: "pointer",
                                    }}>→ {rArt.article}</span>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Legend */}
        <div style={{
          marginTop: 32, padding: 20, borderRadius: 12,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 12 }}>凡例 — 規定体系の対応関係</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
            <div>
              <p style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>社内規定 → 法的根拠</p>
              <p>OM（Operations Manual）＝ 運航規程第1巻</p>
              <p>AOM ＝ 飛行規程</p>
              <p>Route Manual ＝ 運航規程第2巻（航空図）</p>
              <p>Company Order ＝ 社内規定</p>
            </div>
            <div>
              <p style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>法令体系</p>
              <p>航空法 → 航空法施行規則 → 告示・通達</p>
              <p>AIP（航空路誌）→ NOTAM → AIC</p>
              <p>飛行方式設定基準 / 管制方式基準</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
