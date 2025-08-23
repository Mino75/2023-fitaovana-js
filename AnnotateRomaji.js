<script>
(function () {
  // -----------------------------------------------------------
  // 0) Config — adjust if you want katakana or romaji, etc.
  // -----------------------------------------------------------
  var FURIGANA_TARGET = "hiragana"; // "hiragana" | "katakana" | "romaji"
  var DICT_CDN = "https://cdn.jsdelivr.net/npm/kuroshiro-analyzer-kuromoji@1.1.0/dist/dict";

  // -----------------------------------------------------------
  // 1) Load kuroshiro + kuromoji analyzer from CDN
  // -----------------------------------------------------------
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("Failed to load " + src)); };
      document.head.appendChild(s);
    });
  }

  function ensureKuroshiro() {
    // If already present & initialized, reuse
    if (window.__kuroshiroReadyPromise) return window.__kuroshiroReadyPromise;

    window.__kuroshiroReadyPromise = (async function () {
      // Load libs if missing
      if (typeof window.Kuroshiro === "undefined") {
        await loadScript("https://cdn.jsdelivr.net/npm/kuroshiro@1.2.0/dist/kuroshiro.min.js");
      }
      if (typeof window.KuromojiAnalyzer === "undefined") {
        await loadScript("https://cdn.jsdelivr.net/npm/kuroshiro-analyzer-kuromoji@1.1.0/dist/kuroshiro-analyzer-kuromoji.min.js");
      }

      // Initialize kuroshiro with kuromoji analyzer (uses CDN dict files)
      var kuroshiro = new window.Kuroshiro();
      var analyzer = new window.KuromojiAnalyzer({ dictPath: DICT_CDN });
      await kuroshiro.init(analyzer);
      return kuroshiro;
    })();

    return window.__kuroshiroReadyPromise;
  }

  // -----------------------------------------------------------
  // 2) Inject styles for ruby + rt annotations
  // -----------------------------------------------------------
  function injectRubyStyle() {
    if (document.getElementById("__furigana-style")) return;
    var styleElement = document.createElement("style");
    styleElement.id = "__furigana-style";
    styleElement.textContent =
      "ruby{" +
      "  ruby-position: over;" +         /* For JP, default is usually 'over' */
      "  font-size:1.1em;" +
      "}" +
      "rt{" +
      "  font-size:0.6em;" +
      "  color:#d33;" +
      "  font-feature-settings:'palt';" +
      "}" +
      "rb{ " +
      "  font-variant-ligatures:none;" +
      "}";
    document.head.appendChild(styleElement);
  }

  // -----------------------------------------------------------
  // 3) Annotate a single text node using kuroshiro.convert (furigana mode)
  // -----------------------------------------------------------
  // Detect presence of Japanese text (kanji/kana). We’ll only convert if we see JP chars.
  var jpRegex = /[\u3040-\u30FF\u3400-\u9FFF\uF900-\uFAFF]/; // Hiragana, Katakana, CJK, CJK compat

  async function annotateTextNode(kuroshiro, textNode) {
    var text = textNode.nodeValue;
    if (!jpRegex.test(text)) return;

    // Convert to ruby HTML with furigana (hiragana/katakana/romaji)
    // mode:'furigana' wraps kanji segments in <ruby><rb>…</rb><rt>…</rt></ruby>
    // Kana-only runs remain as-is.
    try {
      var html = await kuroshiro.convert(text, {
        to: FURIGANA_TARGET,     // "hiragana" | "katakana" | "romaji"
        mode: "furigana",        // ruby output
        romajiSystem: "hepburn"  // used only if to:"romaji"
      });

      // Replace the text node with a span containing the ruby HTML
      var span = document.createElement("span");
      span.innerHTML = html;
      if (textNode.parentNode) {
        textNode.parentNode.replaceChild(span, textNode);
      }
    } catch (e) {
      // If conversion fails for some reason, leave the original text
      // (You could also console.error here)
    }
  }

  // -----------------------------------------------------------
  // 4) Walk through all text nodes in the body and annotate
  // -----------------------------------------------------------
  function shouldSkipNode(node) {
    if (!node || !node.parentNode) return true;
    var p = node.parentNode;
    // Don’t annotate inside these elements
    var tag = p.nodeName;
    return tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEXTAREA";
  }

  async function annotateDocumentBody(kuroshiro) {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    // Sequential processing keeps DOM stable and avoids spamming network/dict lookups
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (shouldSkipNode(n)) continue;
      // Skip empty/whitespace-only nodes
      if (!n.nodeValue || !n.nodeValue.trim()) continue;
      await annotateTextNode(kuroshiro, n);
    }
  }

  // -----------------------------------------------------------
  // 5) Display a temporary banner message
  // -----------------------------------------------------------
  function showBannerMessage(messageText) {
    var banner = document.createElement("div");
    banner.appendChild(document.createTextNode(messageText));

    banner.style.position = "fixed";
    banner.style.top = "0";
    banner.style.left = "0";
    banner.style.width = "100%";
    banner.style.background = "lime";
    banner.style.color = "black";
    banner.style.fontSize = "18px";
    banner.style.textAlign = "center";
    banner.style.padding = "8px";
    banner.style.zIndex = "999999";

    document.body.appendChild(banner);
    window.setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 3000);
  }

  // -----------------------------------------------------------
  // 6) Main flow
  // -----------------------------------------------------------
  async function main() {
    injectRubyStyle();
    var kuroshiro = await ensureKuroshiro();
    await annotateDocumentBody(kuroshiro);
    showBannerMessage("✅ Furigana annotation done");
  }

  // Kick it off
  main().catch(function (e) {
    console.error("Furigana annotator error:", e);
  });
})();
</script>
