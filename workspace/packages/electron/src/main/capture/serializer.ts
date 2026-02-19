/**
 * Self-contained DOM serializer for Electron's capture BrowserView.
 *
 * In the Chrome extension, doc.ts + utils are bundled by webpack into content.js
 * and injected via chrome.scripting.executeScript(). In Electron, we build the
 * same serializer as a self-contained JavaScript string and inject it via
 * webContents.executeJavaScript().
 *
 * The serializer code below is derived from:
 *   - ext-tour/src/doc.ts (getSearializedDom)
 *   - ext-tour/src/utils.ts (utility functions)
 *   - common/src/utils.ts (getUrlsFromSrcset, rgbToHex)
 *
 * All runtime dependencies are inlined to avoid import issues in the page context.
 */

import { SerDoc } from '@capturebliss/common/dist/types';

export interface SerializerParams {
  frameId: string | null;
}

export interface SerializerResult {
  serDoc: SerDoc;
  screenshot?: string;
}

/**
 * Build the JavaScript string that defines window.__capturebliss_serialize
 * in the page context. This IIFE inlines all utility functions so it has
 * zero external dependencies at runtime.
 */
export function buildSerializerInjectionScript(): string {
  return `
(function() {
  if (typeof window.__capturebliss_serialize === 'function') return;

  // ---- Inlined utility functions ----

  var CAPTUREBLISS_DONT_SER_CLASSNAME = "capturebliss-dont-ser";

  function isCrossOrigin(url1, url2) {
    if (!url1 || !url2) return false;
    if (url1.startsWith("/") || url2.startsWith("/")) return false;
    if (url1.trim().toLowerCase() === "about:blank" || url2.trim().toLowerCase() === "about:blank") return false;
    try {
      var u1 = new URL(url1);
      var u2 = new URL(url2);
      return u1.protocol !== u2.protocol || u1.host !== u2.host;
    } catch (e) {
      return false;
    }
  }

  function isContentEmpty(el) {
    if (!el.textContent) return true;
    var content = el.textContent.replace(/[\\s\\n]+/g, "");
    return content === "";
  }

  function isVisible(el) {
    var style = getComputedStyle(el);
    return !(style.visibility === "hidden" || style.display === "none");
  }

  function sanitizeUrlsInCssStr(urls) {
    return urls.map(function(match) {
      return match.replace(/url\\("(.*?)"\\)|url\\('(.*?)'\\)|url\\((.*?)\\)/, "$1$2$3");
    });
  }

  function getUrlsFromSrcset(srcset) {
    var matches = (srcset || '').trim().match(/(?:\\S+\\s+\\d+[wx](?:,\\s*|$))|(?:\\S+)(?:,\\s*|$)/g);
    return matches ? matches.map(function(match) {
      var parts = match.trim().split(/\\s+/);
      if (parts.length > 1) return parts[0];
      if (parts.length === 1) {
        var s = parts[0];
        return s.endsWith(',') ? s.slice(0, -1) : s;
      }
      return match.trim();
    }) : [];
  }

  function blobToDataUrl(node, width, height) {
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(node, 0, 0);
    var dataURL = canvas.toDataURL("image/png");
    var base64 = dataURL.replace(/^data:image\\/(png|jpg);base64,/, "");
    canvas.remove();
    return base64;
  }

  // ---- Serializer constants ----

  var IRI_REFERENCED_SVG_ELS = [
    "linearGradient", "mask", "clipPath", "filter", "marker", "pattern", "radialGradient"
  ];

  var SER_DOC_SCHEMA_VERSION = 2;
  var URL_MATCHER = /url\\("(.*?)"\\)|url\\('(.*?)'\\)|url\\((.*?)\\)/g;

  function getPostProcessType(serNode) {
    switch (serNode.name) {
      case "iframe": return "iframe";
      case "object": return "object";
      case "use": return "inline-sprite";
      default: return "asset";
    }
  }

  function getCSSText(sheet) {
    var cssRules = (sheet && sheet.cssRules) ? sheet.cssRules : [];
    var cssText = "";
    var proxyUrls = [];
    for (var i = 0; i < cssRules.length; i++) {
      var urls = cssRules[i].cssText.match(URL_MATCHER);
      if (urls) proxyUrls.push.apply(proxyUrls, urls);
      cssText += cssRules[i].cssText + " ";
    }
    return { cssText: cssText, proxyUrls: proxyUrls };
  }

  function getAllAdoptedStylesheets(currentDoc) {
    var allProxyUrls = [];
    var cssTexts = [];
    if (currentDoc.adoptedStyleSheets) {
      currentDoc.adoptedStyleSheets.forEach(function(sheet) {
        var result = getCSSText(sheet);
        cssTexts.push(result.cssText);
        allProxyUrls.push.apply(allProxyUrls, result.proxyUrls);
      });
    }
    return { cssTexts: cssTexts, allProxyUrls: allProxyUrls };
  }

  // ---- Main serializer ----

  function getSearializedDom(params) {
    var doc = document;
    var postProcesses = [];
    var iriReferencedSvgEls = {};
    var icons = [];

    function getRep(node, origin, traversalPath) {
      var HEAD_TAGS = { head:1, title:1, style:1, base:1, link:1, meta:1, script:1, noscript:1 };
      var ICON_MATCHER = new RegExp("icon", "i");
      var NO_INCLUDE_DOM_EL = { script:1, noscript:1, base:1 };

      function calculateScrollTopFactor(el) {
        var scrollHeight = el.scrollHeight;
        var scrollTop = el.scrollTop;
        var elClientHeight = el.clientHeight;
        var f = scrollTop / (scrollHeight - elClientHeight);
        return Number.isNaN(f) ? 0 : f;
      }

      function calculateScrollLeftFactor(el) {
        var scrollWidth = el.scrollWidth;
        var scrollLeft = el.scrollLeft;
        var elClientWidth = el.clientWidth;
        var f = scrollLeft / (scrollWidth - elClientWidth);
        return Number.isNaN(f) ? 0 : f;
      }

      var sNode = {
        type: node.nodeType,
        name: "",
        attrs: {},
        props: { proxyUrlMap: {} },
        chldrn: [],
        sv: SER_DOC_SCHEMA_VERSION
      };

      var shouldPostProcess = false;

      switch (node.nodeType) {
        case Node.ELEMENT_NODE:
          var tNode = node;
          sNode.name = tNode instanceof SVGElement ? tNode.tagName : tNode.tagName.toLowerCase();
          if (IRI_REFERENCED_SVG_ELS.indexOf(sNode.name) !== -1) {
            iriReferencedSvgEls["#" + tNode.id] = "1";
          }
          var attrNames = tNode.getAttributeNames();
          for (var ai = 0; ai < attrNames.length; ai++) {
            var aname = attrNames[ai];
            var attrValue = tNode.getAttribute(aname);
            if (attrValue && aname.toLowerCase() === "style") {
              var urls = attrValue.match(URL_MATCHER);
              if (urls) {
                sNode.props.proxyUrlMap.style = sanitizeUrlsInCssStr(urls);
                shouldPostProcess = true;
              }
            }
            if (attrValue && aname.toLowerCase() === "srcset") {
              var surls = getUrlsFromSrcset(attrValue);
              if (surls.length) {
                sNode.props.proxyUrlMap.srcset = surls;
                shouldPostProcess = true;
              }
            }
            sNode.attrs[aname] = attrValue;
          }
          sNode.attrs["capturebliss-stf"] = calculateScrollTopFactor(tNode).toString();
          sNode.attrs["capturebliss-slf"] = calculateScrollLeftFactor(tNode).toString();
          if (tNode.shadowRoot) sNode.props.isShadowHost = true;
          break;

        case Node.DOCUMENT_FRAGMENT_NODE:
          sNode.name = "#shadow-root";
          sNode.props.isShadowRoot = true;
          var adopted = getAllAdoptedStylesheets(node);
          sNode.props.adoptedStylesheets = adopted.cssTexts;
          if (adopted.allProxyUrls.length) {
            sNode.props.proxyUrlMap.adoptedStylesheets = sanitizeUrlsInCssStr(adopted.allProxyUrls);
            shouldPostProcess = true;
          }
          break;

        case Node.TEXT_NODE:
          sNode.name = node.nodeName;
          sNode.props.textContent = node.textContent;
          break;

        case Node.COMMENT_NODE:
          sNode.name = node.nodeName;
          sNode.props.textContent = node.nodeValue;
          return { serNode: sNode, shouldSkip: true };

        default:
          console.error("unknown node", node);
          throw new Error("node type could not be parsed");
      }

      if (sNode.name === "body") {
        var bodyAdopted = getAllAdoptedStylesheets(node.ownerDocument);
        sNode.props.adoptedStylesheets = bodyAdopted.cssTexts;
        if (bodyAdopted.allProxyUrls.length) {
          sNode.props.proxyUrlMap.adoptedStylesheets = sanitizeUrlsInCssStr(bodyAdopted.allProxyUrls);
          shouldPostProcess = true;
        }
      }

      if (sNode.name in NO_INCLUDE_DOM_EL) {
        return { serNode: sNode, shouldSkip: true };
      }

      if (sNode.attrs["class"] && sNode.attrs["class"].indexOf(CAPTUREBLISS_DONT_SER_CLASSNAME) !== -1) {
        return { serNode: sNode, shouldSkip: true };
      }

      if (sNode.name === "use") {
        var hrefValue = "";
        var hrefKey = "href";
        if ("xlink:href" in sNode.attrs) { hrefValue = sNode.attrs["xlink:href"]; hrefKey = "xlink:href"; }
        if ("href" in sNode.attrs) { hrefValue = sNode.attrs.href; hrefKey = "href"; }
        if (hrefValue.startsWith("#")) {
          return { serNode: sNode, postProcess: false };
        }
        var hurl = new URL(hrefValue, doc.baseURI);
        if (hurl.hash) {
          var relativesprite = hurl.pathname + hurl.search;
          var spriteEl = doc.querySelectorAll('link[href$="' + relativesprite + '"]').item(0);
          var spriteHref = spriteEl && spriteEl.getAttribute("href");
          sNode.props.absoluteUrl = spriteHref || undefined;
          sNode.props.spriteId = hurl.hash;
          sNode.props.isInlineSprite = true;
          sNode.props.proxyUrlMap[hrefKey] = [hrefValue];
          return { serNode: sNode, postProcess: true };
        }
      }

      if (sNode.name === "link") {
        var linkNode = node;
        if (linkNode.sheet) {
          sNode.props.proxyUrlMap.href = linkNode.sheet.href ? [linkNode.sheet.href] : undefined;
          sNode.props.isStylesheet = true;
          return { serNode: sNode, postProcess: true };
        }
        var rel = (linkNode.getAttribute("rel") || "").toLowerCase();
        if (ICON_MATCHER.exec(rel) !== null) {
          sNode.props.proxyUrlMap.href = sNode.attrs.href ? [sNode.attrs.href] : undefined;
          return { serNode: sNode, postProcess: true, isIcon: true };
        }
        return { serNode: sNode, shouldSkip: true };
      }

      if (sNode.name === "img") {
        var imgNode = node;
        var imgSrc = imgNode.currentSrc || imgNode.src || "";
        var imgBase64 = "";
        if (imgSrc.startsWith("blob:")) {
          imgBase64 = blobToDataUrl(imgNode, imgNode.width, imgNode.height);
        }
        sNode.props.base64Img = imgBase64;
        if (imgSrc) {
          sNode.props.proxyUrlMap.src = [imgSrc];
          return { serNode: sNode, postProcess: true };
        }
      }

      if (sNode.name === "image") {
        var svgImgNode = node;
        var svgHref = svgImgNode.href.baseVal || "";
        var xlinkHref = svgImgNode.getAttribute("xlink:href") || "";
        var svgBase64 = "";
        if (svgHref.startsWith("blob:")) {
          svgBase64 = blobToDataUrl(svgImgNode, svgImgNode.width.baseVal.value, svgImgNode.height.baseVal.value);
        }
        sNode.props.base64Img = svgBase64;
        if (svgHref && xlinkHref) {
          sNode.props.proxyUrlMap.href = [svgHref];
          sNode.props.proxyUrlMap["xlink:href"] = [xlinkHref];
          return { serNode: sNode, postProcess: true };
        }
        if (svgHref) { sNode.props.proxyUrlMap.href = [svgHref]; return { serNode: sNode, postProcess: true }; }
        if (xlinkHref) { sNode.props.proxyUrlMap["xlink:href"] = [xlinkHref]; return { serNode: sNode, postProcess: true }; }
      }

      if (sNode.name === "style") {
        var styleNode = node;
        var styleResult = getCSSText(styleNode.sheet);
        sNode.props.cssRules = styleResult.cssText;
        sNode.props.proxyUrlMap.cssRules = sanitizeUrlsInCssStr(styleResult.proxyUrls);
        return { serNode: sNode, postProcess: Boolean(styleResult.proxyUrls.length) };
      }

      if (sNode.name === "input") {
        var inputNode = node;
        var inputType = inputNode.type;
        if (inputType === "checkbox" || inputType === "radio") {
          sNode.props.nodeProps = { type: inputType, checked: inputNode.checked };
        } else if (inputType === "password") {
          sNode.props.nodeProps = { type: inputType, value: "*".repeat(inputNode.value.length) };
        } else {
          sNode.props.nodeProps = { type: inputType, value: inputNode.value };
        }
      }

      if (sNode.name === "select") {
        sNode.props.nodeProps = { value: node.value };
      }

      if (sNode.name === "canvas") {
        var canvasNode = node;
        var canvasRect = canvasNode.getBoundingClientRect();
        var imageData = canvasNode.toDataURL("image/png");
        sNode.attrs.src = imageData;
        sNode.attrs.width = "" + canvasRect.width;
        sNode.attrs.height = "" + canvasRect.height;
        return { serNode: sNode };
      }

      if (sNode.name === "iframe" || sNode.name === "frame" || sNode.name === "object") {
        var frameNode = node;
        var frameUrl = "";
        if (sNode.name !== "object") {
          frameUrl = sNode.attrs.src || "";
          sNode.attrs.src = sNode.attrs.src || frameUrl;
        } else {
          frameUrl = sNode.attrs.data || "";
        }
        var fRect = frameNode.getBoundingClientRect();
        sNode.props.rect = { height: fRect.height, width: fRect.width };
        sNode.props.aidxdy = { dx: fRect.x, dy: fRect.y };

        if (fRect.height === 0 || fRect.width === 0 || !isVisible(frameNode)) {
          return { serNode: sNode, shouldSkip: true };
        }

        if (!isCrossOrigin(origin, frameUrl)) {
          try {
            var frameDoc = frameNode.contentDocument || (frameNode.contentWindow && frameNode.contentWindow.document);
            if (!frameDoc) {
              setTimeout(function() { throw new Error("Iframe same origin but no document access: " + frameUrl); }, 0);
            } else {
              var idx = 0;
              var fChldrn = frameDoc.childNodes;
              for (var fi = 0; fi < fChldrn.length; fi++) {
                if (fChldrn[fi] === frameDoc.documentElement) idx = fi;
                else {
                  sNode.chldrn.push({
                    type: fChldrn[fi].nodeType, name: fChldrn[fi].nodeName,
                    attrs: {}, props: { proxyUrlMap: {} }, chldrn: [], sv: SER_DOC_SCHEMA_VERSION
                  });
                }
              }
              traversalPath.push(idx);
              var fRep = getRep(frameDoc.documentElement, origin, traversalPath);
              sNode.chldrn.push(fRep.serNode);
              traversalPath.pop();
            }
            return { serNode: sNode, postProcess: false };
          } catch (e) {
            return { serNode: sNode, postProcess: true };
          }
        }
        return { serNode: sNode, postProcess: true };
      }

      var childNodes = Array.from(node.childNodes);
      if (node.shadowRoot) childNodes.unshift(node.shadowRoot);

      if (childNodes.length) {
        for (var ci = 0, cii = 0; ci < childNodes.length; ci++) {
          traversalPath.push(cii);
          var cRep = getRep(childNodes[ci], origin, traversalPath);
          var tpStr = traversalPath.join(".");
          traversalPath.pop();
          if (cRep.shouldSkip) cRep.serNode.type = 8;
          cii++;
          if (cRep.postProcess) {
            postProcesses.push({ type: getPostProcessType(cRep.serNode), path: tpStr });
          }
          if (cRep.isIcon) {
            var iconNode = Object.assign(cRep.serNode, { path: tpStr });
            icons.push(iconNode);
          }
          sNode.chldrn.push(cRep.serNode);
        }
      }

      return { serNode: sNode, postProcess: shouldPostProcess };
    }

    function getViewport() {
      var w, h;
      if (typeof window.innerWidth !== "undefined") {
        w = window.innerWidth; h = window.innerHeight;
      } else if (typeof document.documentElement !== "undefined"
        && typeof document.documentElement.clientWidth !== "undefined"
        && document.documentElement.clientWidth !== 0) {
        w = document.documentElement.clientWidth; h = document.documentElement.clientHeight;
      } else {
        w = document.getElementsByTagName("body")[0].clientWidth;
        h = document.getElementsByTagName("body")[0].clientHeight;
      }
      return [w, h];
    }

    var frameUrl = document.URL;
    var rep = getRep(doc.documentElement, frameUrl, []);
    var viewport = getViewport();

    var candidateIcon = null;
    for (var ii = 0; ii < icons.length; ii++) {
      if (icons[ii].attrs.rel === "icon") { candidateIcon = icons[ii]; break; }
      else if (!candidateIcon && icons[ii].attrs.rel === "shortcut icon") { candidateIcon = icons[ii]; }
    }
    if (candidateIcon === null && icons.length) candidateIcon = icons[0];

    var isHTML5 = Boolean(Array.from(doc.childNodes).find(function(el) { return el.nodeType === Node.DOCUMENT_TYPE_NODE; }));

    return {
      iriReferencedSvgEls: iriReferencedSvgEls,
      frameUrl: frameUrl,
      title: doc.title,
      frameId: params.frameId,
      userAgent: (doc.defaultView && doc.defaultView.navigator.userAgent) || "",
      name: (doc.defaultView && doc.defaultView.name) || "",
      postProcesses: postProcesses,
      docTreeStr: JSON.stringify(rep.serNode),
      rect: { width: viewport[0], height: viewport[1] },
      icon: candidateIcon,
      baseURI: doc.body.baseURI,
      isHTML5: isHTML5
    };
  }

  window.__capturebliss_serialize = function(params) {
    params = params || { frameId: null };
    return getSearializedDom(params);
  };
})();
`;
}

/**
 * Build the script that invokes the already-injected serializer.
 */
export function buildSerializerCallScript(frameId: string | null): string {
  return `window.__capturebliss_serialize(${JSON.stringify({ frameId })})`;
}
