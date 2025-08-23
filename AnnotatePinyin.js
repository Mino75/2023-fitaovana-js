(function () {
  // -----------------------------------------------------------
  // 1) Load pinyin-pro if it's not already available on window
  // -----------------------------------------------------------
  function loadPinyinPro(callbackSuccess, callbackError) {
    var scriptElement = document.createElement("script");
    scriptElement.src = "https://cdn.jsdelivr.net/npm/pinyin-pro@3.27.0/dist/index.min.js";
    scriptElement.onload = callbackSuccess;
    scriptElement.onerror = callbackError;
    document.head.appendChild(scriptElement);
  }

  function ensurePinyinPro(callback) {
    if (typeof window.pinyinPro !== "undefined") {
      callback();
    } else {
      loadPinyinPro(callback, function () {
        console.error("Failed to load pinyin-pro library.");
      });
    }
  }

  // -----------------------------------------------------------
  // 2) Inject styles for ruby + rt annotations
  // -----------------------------------------------------------
  function injectRubyStyle() {
    var styleElement = document.createElement("style");
    styleElement.textContent = ""
      + "ruby {"
      + " ruby-position: under;"
      + " font-size: 1.1em;"
      + "}"
      + "rt {"
      + " font-size: 0.6em;"
      + " color: #d33;"
      + "}";
    document.head.appendChild(styleElement);
  }

  // -----------------------------------------------------------
  // 3) Annotate a single text node by wrapping Hanzi in ruby
  // -----------------------------------------------------------
  var hanziRegex = new RegExp("[\\u4e00-\\u9fff]");

  function annotateTextNode(textNode) {
    if (!hanziRegex.test(textNode.nodeValue)) {
      return;
    }

    var fragment = document.createDocumentFragment();
    var textContent = textNode.nodeValue;
    var i;
    for (i = 0; i < textContent.length; i++) {
      var character = textContent.charAt(i);
      if (hanziRegex.test(character)) {
        var pinyin = window.pinyinPro.pinyin(character, { toneType: "mark" });

        var rubyElement = document.createElement("ruby");
        var rtElement = document.createElement("rt");

        rubyElement.appendChild(document.createTextNode(character));
        rtElement.appendChild(document.createTextNode(pinyin));
        rubyElement.appendChild(rtElement);

        fragment.appendChild(rubyElement);
      } else {
        fragment.appendChild(document.createTextNode(character));
      }
    }

    textNode.parentNode.replaceChild(fragment, textNode);
  }

  // -----------------------------------------------------------
  // 4) Walk through all text nodes in the body and annotate
  // -----------------------------------------------------------
  function annotateDocumentBody() {
    var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    var nodes = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    var j;
    for (j = 0; j < nodes.length; j++) {
      annotateTextNode(nodes[j]);
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
      if (banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    }, 3000);
  }

  // -----------------------------------------------------------
  // 6) Main flow
  // -----------------------------------------------------------
  function main() {
    injectRubyStyle();
    annotateDocumentBody();
    showBannerMessage("✅ Pinyin annotation done");
  }

  ensurePinyinPro(main);
})();
