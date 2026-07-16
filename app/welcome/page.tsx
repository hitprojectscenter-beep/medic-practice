"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WelcomePage() {
  const router = useRouter();

  const enterApp = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("has-seen-welcome", "1");
    }
    router.push("/");
  };

  // Preload the home page for a snappy transition
  useEffect(() => {
    router.prefetch("/");
  }, [router]);

  return (
    <>
      <style jsx global>{`
        :root {
          --uh-orange: #F26522;
          --uh-orange-deep: #C7401F;
          --uh-orange-glow: #FF8547;
          --uh-amber: #FFB147;
          --uh-ember: #8B1A1A;
          --w-ground: #FFF9F3;
          --w-ground-warm: #FDF1E4;
          --w-card: #FFFFFF;
          --w-card-elev: #FFFBF6;
          --w-ink: #1A1614;
          --w-ink-soft: #3E3A36;
          --w-muted: #7A6F65;
          --w-rule: #F0E4D6;
          --w-pill-bg: #FEF2E4;
          --w-shadow-sm: 0 1px 3px rgba(139, 26, 26, 0.06), 0 4px 12px rgba(139, 26, 26, 0.04);
          --w-shadow-md: 0 4px 12px rgba(199, 64, 31, 0.10), 0 12px 32px rgba(199, 64, 31, 0.08);
          --w-shadow-lg: 0 8px 24px rgba(199, 64, 31, 0.14), 0 24px 60px rgba(199, 64, 31, 0.12);
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --uh-orange: #FF7A45;
            --uh-orange-deep: #E85D2A;
            --uh-orange-glow: #FF9970;
            --uh-amber: #FFC677;
            --w-ground: #0F0906;
            --w-ground-warm: #1A100A;
            --w-card: #1E140E;
            --w-card-elev: #251910;
            --w-ink: #F8F1E8;
            --w-ink-soft: #D8CFC3;
            --w-muted: #9C8F80;
            --w-rule: #2A1F16;
            --w-pill-bg: #2B1D12;
            --w-shadow-sm: 0 1px 3px rgba(0,0,0,0.4);
            --w-shadow-md: 0 4px 12px rgba(255, 122, 69, 0.15), 0 12px 32px rgba(0,0,0,0.5);
            --w-shadow-lg: 0 8px 24px rgba(255, 122, 69, 0.22), 0 24px 60px rgba(0,0,0,0.6);
          }
        }
        .welcome-page {
          background: var(--w-ground);
          color: var(--w-ink);
          font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, "Arial Hebrew", "Tahoma", sans-serif;
          font-size: 17px;
          line-height: 1.6;
          overflow-x: hidden;
          direction: rtl;
        }
        .welcome-page * { box-sizing: border-box; }
        .welcome-page a { color: inherit; text-decoration: none; }
        .welcome-page button {
          font: inherit; cursor: pointer; border: 0; background: none; color: inherit;
        }
        .w-wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
        .w-wrap-narrow { max-width: 780px; margin: 0 auto; padding: 0 24px; }

        /* Top nav */
        .w-topnav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: color-mix(in oklab, var(--w-ground) 88%, transparent);
          -webkit-backdrop-filter: blur(20px);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--w-rule);
        }
        .w-topnav-inner {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px; max-width: 1080px; margin: 0 auto; gap: 16px;
        }
        .w-brand-mark {
          display: flex; align-items: center; gap: 12px;
          font-weight: 800; font-size: 15px; letter-spacing: -0.01em;
        }
        .w-brand-mark .w-brand-plus {
          width: 32px; height: 32px; border-radius: 8px;
          background: linear-gradient(135deg, var(--uh-orange), var(--uh-orange-deep));
          display: inline-flex; align-items: center; justify-content: center;
          color: white; font-size: 22px; font-weight: 900; line-height: 1;
          box-shadow: 0 4px 12px rgba(242, 101, 34, 0.4);
        }
        .w-brand-mark span { color: var(--w-ink); }
        .w-brand-mark small { color: var(--w-muted); font-weight: 500; margin-inline-start: 4px; }
        .w-nav-cta {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; background: var(--w-ink); color: var(--w-ground);
          border-radius: 999px; font-weight: 700; font-size: 14px;
          transition: transform .2s ease, background .2s ease;
        }
        .w-nav-cta:hover { transform: translateY(-1px); background: var(--uh-orange-deep); color: white; }

        /* Hero */
        .w-hero { position: relative; padding: 100px 24px 120px; overflow: hidden; }
        .w-hero-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
        .w-hero-bg::before {
          content: ""; position: absolute; top: -20%; inset-inline-start: -10%;
          width: 700px; height: 700px;
          background: radial-gradient(circle, var(--uh-orange-glow) 0%, transparent 60%);
          opacity: 0.18; filter: blur(80px);
        }
        .w-hero-bg::after {
          content: ""; position: absolute; bottom: -30%; inset-inline-end: -20%;
          width: 800px; height: 800px;
          background: radial-gradient(circle, var(--uh-amber) 0%, transparent 65%);
          opacity: 0.15; filter: blur(90px);
        }
        .w-hero-bg svg {
          position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.35;
        }
        .w-hero-inner {
          position: relative; z-index: 1; max-width: 1080px; margin: 0 auto;
          text-align: center;
        }
        .w-hero-badge {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 8px 18px 8px 12px;
          background: var(--w-card); border: 1px solid var(--w-rule);
          border-radius: 999px; box-shadow: var(--w-shadow-sm);
          font-size: 13px; font-weight: 600; color: var(--w-ink-soft);
          margin-bottom: 32px;
        }
        .w-hero-badge .w-dot {
          width: 8px; height: 8px; border-radius: 999px;
          background: var(--uh-orange);
          animation: w-livepulse 2s ease-out infinite;
        }
        @keyframes w-livepulse {
          0% { box-shadow: 0 0 0 0 rgba(242, 101, 34, 0.6); }
          70% { box-shadow: 0 0 0 12px rgba(242, 101, 34, 0); }
          100% { box-shadow: 0 0 0 0 rgba(242, 101, 34, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .w-hero-badge .w-dot, .w-mic-ring::before, .w-mic-ring::after { animation: none !important; }
        }
        .w-hero h1 {
          font-size: clamp(46px, 8vw, 92px);
          font-weight: 900; line-height: 0.98;
          letter-spacing: -0.03em;
          margin: 0 auto 32px;
          max-width: 22ch;
          text-wrap: balance;
        }
        .w-hero h1 .w-accent {
          background: linear-gradient(120deg, var(--uh-orange), var(--uh-orange-deep) 45%, var(--uh-ember) 90%);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          position: relative; display: inline-block;
        }
        .w-hero h1 .w-accent::after {
          content: ""; position: absolute; bottom: 0.1em; inset-inline-start: 0;
          width: 100%; height: 6px;
          background: var(--uh-orange); border-radius: 2px; opacity: 0.25;
        }
        .w-hero-lede {
          font-size: clamp(19px, 2.4vw, 24px);
          color: var(--w-ink-soft); max-width: 640px;
          line-height: 1.5; margin: 0 auto 40px; font-weight: 400;
        }
        .w-cta-row {
          display: flex; align-items: center; justify-content: center;
          gap: 16px; flex-wrap: wrap; margin-bottom: 64px;
        }
        .w-btn {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 18px 32px; border-radius: 999px;
          font-weight: 800; font-size: 17px; letter-spacing: -0.005em;
          transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
          white-space: nowrap;
        }
        .w-btn-primary {
          background: var(--uh-orange); color: white;
          box-shadow: 0 6px 20px rgba(242, 101, 34, 0.35), inset 0 -2px 0 rgba(0,0,0,0.08);
        }
        .w-btn-primary:hover {
          background: var(--uh-orange-deep); transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(242, 101, 34, 0.5), inset 0 -2px 0 rgba(0,0,0,0.08);
        }
        .w-btn-secondary { color: var(--w-ink); padding: 18px 24px; font-weight: 700; }
        .w-btn-secondary:hover { color: var(--uh-orange-deep); }
        .w-hero-stats {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px;
          padding-top: 40px; border-top: 1px solid var(--w-rule);
          max-width: 720px; margin: 0 auto; text-align: center;
        }
        @media (max-width: 640px) {
          .w-hero-stats { grid-template-columns: repeat(2, 1fr); gap: 24px; }
        }
        .w-stat { display: flex; flex-direction: column; gap: 4px; align-items: center; }
        .w-stat-num {
          font-size: clamp(32px, 5vw, 44px); font-weight: 900;
          line-height: 1; letter-spacing: -0.03em;
          font-variant-numeric: tabular-nums; color: var(--w-ink);
        }
        .w-stat-num .w-plus { color: var(--uh-orange); font-size: 0.7em; }
        .w-stat-label { font-size: 13px; color: var(--w-muted); font-weight: 500; }

        /* Sections */
        .w-section { padding: 100px 0; position: relative; }
        .w-section + .w-section { border-top: 1px solid var(--w-rule); }
        .w-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 800; letter-spacing: 0.22em;
          color: var(--uh-orange-deep); margin-bottom: 20px;
        }
        .w-eyebrow::before {
          content: ""; width: 24px; height: 2px;
          background: var(--uh-orange); border-radius: 2px;
        }
        .w-section-h2 {
          font-size: clamp(32px, 5.5vw, 52px); font-weight: 900;
          line-height: 1.05; letter-spacing: -0.025em;
          margin-bottom: 24px; max-width: 18ch; text-wrap: balance;
          color: var(--w-ink);
        }
        .w-section-lede {
          font-size: 19px; color: var(--w-ink-soft);
          max-width: 620px; margin-bottom: 60px; line-height: 1.55;
        }

        /* Features */
        .w-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        @media (max-width: 900px) { .w-features { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .w-features { grid-template-columns: 1fr; } }
        .w-feature {
          position: relative; background: var(--w-card);
          border: 1px solid var(--w-rule); border-radius: 20px;
          padding: 28px; display: flex; flex-direction: column; gap: 8px;
          overflow: hidden;
          transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
        }
        .w-feature:hover {
          transform: translateY(-4px); box-shadow: var(--w-shadow-md);
          border-color: color-mix(in oklab, var(--uh-orange) 40%, var(--w-rule));
        }
        .w-feature-icon {
          width: 52px; height: 52px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, var(--w-pill-bg), var(--w-card-elev));
          color: var(--uh-orange-deep); margin-bottom: 12px;
          box-shadow: inset 0 0 0 1px var(--w-rule);
        }
        .w-feature-num {
          font-size: 40px; font-weight: 900; line-height: 1;
          letter-spacing: -0.03em; color: var(--uh-orange-deep);
          font-variant-numeric: tabular-nums;
        }
        .w-feature-num .w-plus { color: var(--uh-orange); }
        .w-feature-name { font-size: 18px; font-weight: 800; color: var(--w-ink); letter-spacing: -0.005em; }
        .w-feature-desc { font-size: 15px; color: var(--w-muted); line-height: 1.55; margin-top: 2px; }
        .w-feature-tag {
          position: absolute; top: 24px; inset-inline-end: 24px;
          font-size: 10px; font-weight: 800; letter-spacing: 0.15em;
          color: var(--uh-orange); background: var(--w-pill-bg);
          padding: 4px 10px; border-radius: 999px;
        }

        /* How to use */
        .w-how-to { background: linear-gradient(180deg, transparent 0%, var(--w-ground-warm) 50%, transparent 100%); }
        .w-steps { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 780px) { .w-steps { grid-template-columns: 1fr; } }
        .w-step {
          background: var(--w-card); border: 1px solid var(--w-rule);
          border-radius: 20px; padding: 32px 28px; position: relative; overflow: hidden;
        }
        .w-step::before {
          content: ""; position: absolute; top: 0; inset-inline-start: 0;
          width: 4px; height: 100%; background: var(--uh-orange); opacity: 0.15;
        }
        .w-step-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 44px; height: 44px; border-radius: 14px;
          background: linear-gradient(135deg, var(--uh-orange), var(--uh-orange-deep));
          color: white; font-size: 20px; font-weight: 900;
          margin-bottom: 16px; box-shadow: 0 4px 12px rgba(242, 101, 34, 0.3);
        }
        .w-step h3 { font-size: 22px; font-weight: 800; color: var(--w-ink); margin-bottom: 12px; }
        .w-step p { color: var(--w-ink-soft); line-height: 1.65; font-size: 15.5px; }
        .w-step p + p { margin-top: 10px; }
        .w-step strong { color: var(--w-ink); font-weight: 700; }
        .w-step code {
          display: inline-block; background: var(--w-pill-bg);
          color: var(--uh-orange-deep); padding: 2px 8px; border-radius: 6px;
          font-family: "Menlo", "Consolas", monospace; font-size: 0.9em;
          font-weight: 700; direction: ltr; unicode-bidi: isolate;
        }

        /* Voice hero */
        .w-voice-hero {
          margin-top: 48px;
          background: linear-gradient(135deg, var(--w-card) 0%, var(--w-card-elev) 100%);
          border: 2px solid var(--uh-orange); border-radius: 28px;
          padding: 48px; display: grid; grid-template-columns: auto 1fr;
          gap: 40px; align-items: center; position: relative; overflow: hidden;
          box-shadow: var(--w-shadow-lg);
        }
        @media (max-width: 700px) {
          .w-voice-hero { grid-template-columns: 1fr; gap: 24px; padding: 32px 24px; text-align: center; }
        }
        .w-voice-hero::before {
          content: ""; position: absolute; top: -100px; inset-inline-end: -100px;
          width: 300px; height: 300px;
          background: radial-gradient(circle, var(--uh-orange-glow) 0%, transparent 65%);
          opacity: 0.2; pointer-events: none;
        }
        .w-mic-ring {
          position: relative; width: 120px; height: 120px;
          display: flex; align-items: center; justify-content: center; justify-self: center;
        }
        .w-mic-ring::before, .w-mic-ring::after {
          content: ""; position: absolute; inset: 0; border-radius: 999px;
          border: 2px solid var(--uh-orange); opacity: 0;
          animation: w-micpulse 2.5s ease-out infinite;
        }
        .w-mic-ring::after { animation-delay: 1.25s; }
        @keyframes w-micpulse {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .w-mic-core {
          position: relative; z-index: 1; width: 88px; height: 88px; border-radius: 999px;
          background: linear-gradient(145deg, var(--uh-orange), var(--uh-orange-deep));
          display: flex; align-items: center; justify-content: center; color: white;
          box-shadow: 0 10px 30px rgba(242, 101, 34, 0.45), inset 0 -3px 0 rgba(0,0,0,0.1);
        }
        .w-voice-content { min-width: 0; }
        .w-voice-label {
          font-size: 11px; font-weight: 800; letter-spacing: 0.22em;
          color: var(--uh-orange-deep); margin-bottom: 12px;
        }
        .w-voice-content h4 {
          font-size: clamp(22px, 3vw, 28px); font-weight: 900;
          color: var(--w-ink); margin-bottom: 12px; letter-spacing: -0.015em; line-height: 1.15;
        }
        .w-voice-content p { color: var(--w-ink-soft); line-height: 1.65; font-size: 16px; margin-bottom: 12px; }
        .w-voice-example {
          display: inline-block; background: var(--w-pill-bg);
          padding: 10px 18px; border-radius: 12px; font-weight: 700;
          color: var(--uh-orange-deep); margin-top: 6px;
        }
        .w-voice-example .w-quote { color: var(--uh-orange); font-weight: 900; margin-inline-end: 4px; }

        /* Dedication */
        .w-dedication-section { background: var(--w-ground-warm); position: relative; }
        .w-dedication {
          background: var(--w-card); border-radius: 28px; padding: 56px;
          box-shadow: var(--w-shadow-lg); position: relative; overflow: hidden;
          max-width: 820px; margin: 0 auto;
        }
        @media (max-width: 640px) { .w-dedication { padding: 36px 28px; border-radius: 22px; } }
        .w-dedication::before {
          content: ""; position: absolute; top: 0; inset-inline-start: 0;
          width: 100%; height: 6px;
          background: linear-gradient(90deg, var(--uh-orange) 0%, var(--uh-orange-deep) 100%);
        }
        .w-quote-mark {
          position: absolute; top: 40px; inset-inline-end: 48px;
          font-size: 90px; line-height: 1; color: var(--uh-orange);
          opacity: 0.15; font-weight: 900; font-family: "Georgia", serif; pointer-events: none;
        }
        .w-dedication-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-size: 12px; font-weight: 800; letter-spacing: 0.2em;
          color: var(--uh-orange-deep); margin-bottom: 24px;
        }
        .w-dedication p {
          font-size: 18px; line-height: 1.85; color: var(--w-ink-soft);
          margin-bottom: 20px; max-width: 640px;
        }
        .w-dedication-closing {
          font-size: 22px !important; font-weight: 800 !important;
          color: var(--w-ink) !important; line-height: 1.4 !important; margin-top: 24px !important;
        }
        .w-contact-panel {
          margin-top: 32px; padding-top: 28px;
          border-top: 1px dashed var(--w-rule);
          display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
        }
        .w-avatar {
          width: 56px; height: 56px; border-radius: 999px;
          background: linear-gradient(135deg, var(--uh-orange), var(--uh-orange-deep));
          color: white; display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 900;
          box-shadow: 0 6px 16px rgba(242, 101, 34, 0.3);
        }
        .w-contact-info { flex: 1; }
        .w-contact-info-label { font-size: 12px; color: var(--w-muted); font-weight: 600; }
        .w-contact-info-name { font-size: 18px; font-weight: 800; color: var(--w-ink); margin-top: 2px; }
        .w-phone {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 12px 20px; background: var(--uh-orange); color: white;
          border-radius: 999px; font-weight: 800; font-size: 16px;
          font-variant-numeric: tabular-nums; direction: ltr; unicode-bidi: isolate;
          transition: background .2s, transform .2s, box-shadow .2s;
          box-shadow: 0 4px 12px rgba(242, 101, 34, 0.3);
        }
        .w-phone:hover {
          background: var(--uh-orange-deep); transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(242, 101, 34, 0.45);
        }

        /* Hero dedication - compact card in hero */
        .w-hero-dedication {
          max-width: 720px; margin: 8px auto 36px;
          background: var(--w-card); border: 1px solid var(--w-rule);
          border-radius: 20px; padding: 28px 32px;
          box-shadow: var(--w-shadow-md); position: relative; overflow: hidden;
          text-align: right; direction: rtl;
        }
        @media (max-width: 640px) {
          .w-hero-dedication { padding: 22px 20px; margin: 8px auto 28px; border-radius: 18px; }
        }
        .w-hero-dedication::before {
          content: ""; position: absolute; top: 0; inset-inline-start: 0;
          width: 100%; height: 4px;
          background: linear-gradient(90deg, var(--uh-orange) 0%, var(--uh-orange-deep) 100%);
        }
        .w-hero-dedication .w-dedication-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 800; letter-spacing: 0.22em;
          color: var(--uh-orange-deep); margin-bottom: 14px;
        }
        .w-hero-dedication p {
          font-size: 15.5px; line-height: 1.7; color: var(--w-ink-soft);
          margin: 0 0 12px;
        }
        .w-hero-dedication .w-hero-dedication-closing {
          font-size: 17px; font-weight: 800; color: var(--w-ink);
          margin-top: 14px;
        }
        .w-hero-contact-panel {
          margin-top: 18px; padding-top: 18px;
          border-top: 1px dashed var(--w-rule);
          display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
          justify-content: flex-start;
        }
        @media (max-width: 640px) { .w-hero-contact-panel { justify-content: center; } }

        /* Final CTA */
        .w-final-cta {
          padding: 120px 24px 140px; text-align: center;
          background: linear-gradient(135deg, var(--w-card) 0%, var(--w-ground-warm) 100%);
          border-top: 1px solid var(--w-rule); position: relative; overflow: hidden;
        }
        .w-final-cta::before {
          content: ""; position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%); width: 600px; height: 600px;
          background: radial-gradient(circle, var(--uh-orange-glow) 0%, transparent 70%);
          opacity: 0.12; pointer-events: none;
        }
        .w-final-inner { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; }
        .w-final-cta h2 {
          font-size: clamp(36px, 6vw, 56px); font-weight: 900;
          letter-spacing: -0.025em; line-height: 1.05; margin-bottom: 20px;
          text-wrap: balance; color: var(--w-ink);
        }
        .w-final-cta p {
          color: var(--w-ink-soft); font-size: 19px; margin-bottom: 40px;
          max-width: 480px; margin-inline: auto;
        }
        .w-btn-mega {
          padding: 22px 44px; font-size: 19px;
          background: linear-gradient(135deg, var(--uh-orange) 0%, var(--uh-orange-deep) 100%);
          box-shadow: 0 12px 32px rgba(242, 101, 34, 0.4), inset 0 -3px 0 rgba(0,0,0,0.1);
        }
        .w-btn-mega:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 44px rgba(242, 101, 34, 0.55), inset 0 -3px 0 rgba(0,0,0,0.1);
        }

        /* Footer */
        .w-footer {
          padding: 40px 24px; background: var(--w-ink);
          color: color-mix(in oklab, var(--w-ground) 70%, transparent);
          text-align: center; font-size: 13px; line-height: 1.7;
        }
        .w-footer strong { color: var(--w-ground); font-weight: 600; }
        .w-footer-brand { color: var(--uh-orange); font-weight: 800; }
      `}</style>

      <div className="welcome-page">
        {/* ============ TOP NAV ============ */}
        <nav className="w-topnav">
          <div className="w-topnav-inner">
            <div className="w-brand-mark">
              <span className="w-brand-plus">+</span>
              <span>תרגול חובשים</span>
              <small>· שער הנגב</small>
            </div>
            <button onClick={enterApp} className="w-nav-cta">התחל תרגול ←</button>
          </div>
        </nav>

        {/* ============ HERO ============ */}
        <div className="w-hero">
          <div className="w-hero-bg">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="w-cross" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M4 2v4M2 4h4" stroke="#F26522" strokeWidth="0.15" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#w-cross)"/>
            </svg>
          </div>
          <div className="w-hero-inner">
            <div className="w-hero-badge">
              <span className="w-dot"></span>
              <span>שער הנגב · פרויקט קהילתי · חינמי לחלוטין</span>
            </div>

            <h1>
              תרגול חובשים<br/>ונהגי אמבולנס — <span className="w-accent">להרחיב את הידע,<br/>למקסם את המיומנות!</span>
            </h1>

            <div className="w-hero-dedication">
              <div className="w-dedication-eyebrow">
                <span>◆</span>
                <span>דבר היוצר</span>
              </div>
              <p>האפליקציה פותחה לטובת חניכים של קורס חובשים ונהגי אמבולנס של איחוד ההצלה, קבוצת שער הנגב. כלל השאלות באפליקציה נוצרו ע"י AI ונבדקו תוך שימוש במהלך הכנה למבחן. במידה והנכם עולים על טעות או אי דיוק, אנא כתבו למארק ישראל, מס' נייד: 0505714100 ותוך זמן קצר אבצע תיקון.</p>
              <p className="w-hero-dedication-closing">תהנו משימוש ביישום ובהצלחה בבחינות! 🚑</p>
              <div className="w-hero-contact-panel">
                <div className="w-avatar">מי</div>
                <div className="w-contact-info">
                  <div className="w-contact-info-label">פיתוח וליווי</div>
                  <div className="w-contact-info-name">מארק ישראל</div>
                </div>
                <a className="w-phone" href="tel:0505714100" aria-label="התקשר למארק ישראל">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <span>050-571-4100</span>
                </a>
              </div>
            </div>

            <p className="w-hero-lede">
              אפליקציה מקיפה בעברית — שאלות אמריקאיות, אנמנזה קולית מול מטופל שמדבר איתך, תרחישים מלאים ודשבורד מתקדם.
            </p>

            <div className="w-cta-row">
              <button onClick={enterApp} className="w-btn w-btn-primary">
                <span>כניסה לאפליקציה</span>
                <span>←</span>
              </button>
              <a href="#how" className="w-btn w-btn-secondary">איך זה עובד?</a>
            </div>

            <div className="w-hero-stats">
              <div className="w-stat">
                <div className="w-stat-num">340<span className="w-plus">+</span></div>
                <div className="w-stat-label">שאלות אמריקאיות</div>
              </div>
              <div className="w-stat">
                <div className="w-stat-num">34</div>
                <div className="w-stat-label">תרחישים מלאים</div>
              </div>
              <div className="w-stat">
                <div className="w-stat-num">55</div>
                <div className="w-stat-label">מקרי אנמנזה קולית</div>
              </div>
              <div className="w-stat">
                <div className="w-stat-num">33</div>
                <div className="w-stat-label">נושאים ייחודיים</div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ FEATURES ============ */}
        <section className="w-section">
          <div className="w-wrap">
            <span className="w-eyebrow">מה יש באפליקציה</span>
            <h2 className="w-section-h2">כל מה שיכול לעזור, במקום אחד</h2>
            <p className="w-section-lede">שילוב של תרגול מבחני, סימולציות קוליות, ומשחקים אינטראקטיביים — הכול בעברית מלאה, ישיר מהדפדפן, ללא התקנה.</p>

            <div className="w-features">
              <div className="w-feature">
                <div className="w-feature-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>
                </div>
                <div className="w-feature-num">340<span className="w-plus">+</span></div>
                <div className="w-feature-name">שאלות אמריקאיות</div>
                <p className="w-feature-desc">בכל אחד מ־33 הנושאים של הקורס, עם הסבר לכל תשובה. אפשרות דילוג ורמה אדפטיבית לפי הביצועים שלך.</p>
              </div>

              <div className="w-feature">
                <div className="w-feature-tag">הליבה</div>
                <div className="w-feature-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/></svg>
                </div>
                <div className="w-feature-num">55</div>
                <div className="w-feature-name">אנמנזה קולית עם AI</div>
                <p className="w-feature-desc">שאל את המטופל בקולך — הוא יענה בקול בעברית מדוברת. ארבעה שלבים: בטיחות, אנמנזה, אבחנה, משוב.</p>
              </div>

              <div className="w-feature">
                <div className="w-feature-tag">חדש</div>
                <div className="w-feature-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3M22 17H12v-6c0-.6.4-1 1-1h6l3 4v3zM5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>
                </div>
                <div className="w-feature-num">34</div>
                <div className="w-feature-name">תרחישים מלאים</div>
                <p className="w-feature-desc">מרגע הקריאה במוקד ועד ההעברה — שבעה שלבים מלאים לכל תרחיש. טראומה, לב, ריאה, ילדים, מיילדות ועוד.</p>
              </div>

              <div className="w-feature">
                <div className="w-feature-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
                <div className="w-feature-num">40</div>
                <div className="w-feature-name">מבחן מעורב</div>
                <p className="w-feature-desc">36 שאלות אמריקאיות + 4 אנמנזות בערבוב אקראי. ציון משולב עם 50 XP בונוס בסיום.</p>
              </div>

              <div className="w-feature">
                <div className="w-feature-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>
                </div>
                <div className="w-feature-num">18</div>
                <div className="w-feature-name">משחק רבעי הבטן</div>
                <p className="w-feature-desc">גרור איברים לרביע הנכון על איור אנטומי. דירוג כוכבים בסוף. עובד במגע במובייל, מצוין להטמעת ידע אנטומי.</p>
              </div>

              <div className="w-feature">
                <div className="w-feature-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                </div>
                <div className="w-feature-num">1</div>
                <div className="w-feature-name">דשבורד ולוח דירוג</div>
                <p className="w-feature-desc">מיקום מול משתמשים אחרים, מגמת התקדמות, זמן השקעה בפועל, ושליטה לפי נושא — עם ויזואליזציה חיה.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ HOW TO ============ */}
        <section className="w-section w-how-to" id="how">
          <div className="w-wrap">
            <span className="w-eyebrow">איך להשתמש נכון</span>
            <h2 className="w-section-h2">ארבעה צעדים — ואתם בפנים</h2>
            <p className="w-section-lede">האנמנזה הקולית היא הלב של האפליקציה. חשוב לבצע את ההכנה הבסיסית פעם אחת בטלפון כדי שהחוויה תעבוד חלק.</p>

            <div className="w-steps">
              <div className="w-step">
                <div className="w-step-badge">1</div>
                <h3>התקינו קול עברי בטלפון</h3>
                <p><strong>אנדרואיד:</strong> הגדרות → נגישות → הפקת טקסט לדיבור → מנוע Google TTS → התקינו קול עברי.</p>
                <p><strong>iPhone:</strong> Settings → Accessibility → Spoken Content → Voices → Hebrew → הורידו את הקול <code>Carmit</code>.</p>
              </div>

              <div className="w-step">
                <div className="w-step-badge">2</div>
                <h3>אשרו גישה למיקרופון</h3>
                <p>בכניסה הראשונה לאנמנזה, הדפדפן יבקש הרשאה למיקרופון — לחצו <strong>«אפשר»</strong>.</p>
                <p>מומלץ להשתמש באוזניות עם מיקרופון להפחתת רעשי רקע.</p>
              </div>

              <div className="w-step">
                <div className="w-step-badge">3</div>
                <h3>עברו על השלבים בסדר</h3>
                <p>בכל מקרה אנמנזה יש ארבעה שלבים: <strong>בטיחות</strong> (אישור קליטת קריאה, ווסט, האם הזירה בטוחה?), <strong>אנמנזה</strong> (עד 10 שאלות), <strong>בחירת אבחנה</strong>, <strong>משוב מקיף</strong>.</p>
              </div>

              <div className="w-step">
                <div className="w-step-badge">4</div>
                <h3>עצרו לפני שהאבחנה נבחרת</h3>
                <p>לפני שלוחצים על אבחנה — חשוב שכל שאלה תסתיים בפעולה. ה־AI לא מנחש מה חשבתם, רק מה שנאמר בקול.</p>
              </div>
            </div>

            <div className="w-voice-hero">
              <div className="w-mic-ring">
                <div className="w-mic-core">
                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg>
                </div>
              </div>
              <div className="w-voice-content">
                <div className="w-voice-label">המפתח לאנמנזה</div>
                <h4>סיימו כל שאלה במילים "תענה לי"</h4>
                <p>המטופל (Claude AI) מזהה את המילים הללו כאות לענות. ללא הטריגר, השאלה נשמרת בסיכום אבל המטופל שותק — כמו במציאות, שם צריך לשאול פעיל.</p>
                <div className="w-voice-example">
                  <span className="w-quote">״</span>שלום אדוני, מה כואב לך? <span style={{ color: "var(--uh-orange)", fontWeight: 900 }}>תענה לי</span><span className="w-quote">״</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <div className="w-final-cta">
          <div className="w-final-inner">
            <h2>מוכן להצלחה במבחן?</h2>
            <p>בלי הרשמה. בלי הורדה. פותח וזורם. כל הכלים במקום אחד.</p>
            <button onClick={enterApp} className="w-btn w-btn-primary w-btn-mega">
              <span>כניסה לאפליקציה</span>
              <span>←</span>
            </button>
          </div>
        </div>

        <footer className="w-footer">
          <span className="w-footer-brand">תרגול חובשים</span> · פרויקט קהילתי · פותח למען חניכי <strong>קבוצת שער הנגב</strong>
          <br/>
          <span style={{ opacity: 0.7, fontSize: 12 }}>© 2026 · פותח ע"י מארק ישראל</span>
        </footer>
      </div>
    </>
  );
}
