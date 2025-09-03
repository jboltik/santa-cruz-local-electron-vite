// src/editor/codeViewTheme.ts
import { Extension, RangeSetBuilder } from '@codemirror/state';
import {
  EditorView,
  ViewPlugin,
  Decoration,
  DecorationSet,
  ViewUpdate,
  MatchDecorator,
} from '@codemirror/view';
import { html as cmHtml } from '@codemirror/lang-html';

export type CodeViewColors = {
  tagTeal?: string;   // for <h2> tokens and content
  styleGray?: string; // for style="…"
  mcGray?: string;    // for mc:edit="…"
  linkLight?: string; // NEW – lighter blue for href="…"
  linkDark?: string;  // NEW – darker blue for URL inside quotes
  genericAttrGray?: string; // NEW – for target/align/valign
  nbsp?: string; // NEW – for &nbsp; (non-breaking space)
};

// Lighter blue for the whole href="…", darker blue for just the URL
function makeHrefColorPlugin() {
  // Matches: href="...anything..."  OR  href='...anything...'
  const hrefRe = /href\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/gi;

  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.build(view);
    }

    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged) {
        this.decorations = this.build(u.view);
      }
    }

    build(view: EditorView) {
      const builder = new RangeSetBuilder<Decoration>();

      for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to);
        hrefRe.lastIndex = 0;

        let m: RegExpExecArray | null;
        while ((m = hrefRe.exec(text))) {
          const mStart = from + m.index;
          const mText = m[0];
          const mEnd = mStart + mText.length;

          // Whole href="…"
          builder.add(
            mStart,
            mEnd,
            Decoration.mark({ class: 'cm-href-attr-light' })
          );

          // Just the URL inside the quotes (override the light color)
          const firstDq = mText.indexOf('"');
          const firstSq = mText.indexOf("'");
          const useDouble = (firstDq !== -1 && (firstSq === -1 || firstDq < firstSq));
          const q = useDouble ? '"' : "'";
          const q1 = mText.indexOf(q);
          const q2 = mText.lastIndexOf(q);

          if (q1 !== -1 && q2 !== -1 && q2 > q1 + 1) {
            const valFrom = mStart + q1 + 1;
            const valTo = mStart + q2;
            builder.add(
              valFrom,
              valTo,
              Decoration.mark({ class: 'cm-href-value-dark' })
            );
          }
        }
      }

      return builder.finish();
    }
  }, {
    decorations: v => v.decorations
  });
}




function makeH2TokensTealPlugin(className = 'cm-h2-teal') {
  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    constructor(view: EditorView) { this.decorations = this.build(view); }
    update(u: ViewUpdate) { if (u.docChanged || u.viewportChanged) this.decorations = this.build(u.view); }

    build(view: EditorView) {
      const b = new RangeSetBuilder<Decoration>();
      const doc = view.state.doc.toString();
      const rx = /<h2\b[^>]*>[\s\S]*?<\/h2>/gi;
      let m: RegExpExecArray | null;

      while ((m = rx.exec(doc))) {
        const from = m.index;
        const text = m[0];
        const to = from + text.length;

        const gt = text.indexOf('>');                 // end of opening tag
        if (gt < 0) continue;

        const closeStart = to - '</h2>'.length;       // start of closing tag

        // "<h2"
        b.add(from, from + 3, Decoration.mark({ class: className }));
        // ">" of opening tag
        b.add(from + gt, from + gt + 1, Decoration.mark({ class: className }));
        // "</h2>"
        b.add(closeStart, to, Decoration.mark({ class: className }));
      }
      return b.finish();
    }
  }, { decorations: v => v.decorations });
}

function makeH2ContentTealPlugin(className = 'cm-h2-content-teal') {
  // Colorize EVERYTHING between <h2 …> and </h2>, non-greedy, multiline
  // If you only want plain text (not nested tags), we can switch to a chunked approach later.
  const rx = /(?<=<\s*h2\b[^>]*>)[\s\S]*?(?=<\s*\/\s*h2\s*>)/gi;

  const deco = new MatchDecorator({
    regexp: rx,
    decoration: Decoration.mark({ class: className }),
  });

  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = deco.createDeco(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = deco.updateDeco(update, this.decorations);
      }
    }
  }, { decorations: v => v.decorations });
}

function makeAttrGrayPlugin(attrNames: string[], className: string) {
  // Build: (style|data-h2-snippet|target|align|valign|mc\:edit)\s*=\s*("…multi…"|'…multi…')
  const nameAlt = attrNames
    .map(n => n.replace(/[-:]/g, '\\$&')) // escape dash & colon
    .join('|');
  const rx = new RegExp(
    `(?:${nameAlt})\\s*=\\s*(?:"[\\s\\S]*?"|'[\\s\\S]*?')`,
    'gi'
  );

  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.build(view);
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged) {
        this.decorations = this.build(u.view);
      }
    }

    build(view: EditorView) {
      const builder = new RangeSetBuilder<Decoration>();
      for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to);
        rx.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = rx.exec(text))) {
          const mStart = from + m.index;
          const mEnd   = mStart + m[0].length;
          builder.add(mStart, mEnd, Decoration.mark({ class: className }));
        }
      }
      return builder.finish();
    }
  }, { decorations: v => v.decorations });
}

function makeNbspPlugin() {
  const deco = new MatchDecorator({
    // &nbsp;  &#160;  &#xA0;  and literal NBSP
    regexp: /(?:&nbsp;|&#160;|&#xA0;|\u00A0)/gi,
    decoration: Decoration.mark({ class: 'cm-nbsp' }),
  });
  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    constructor(view: EditorView) { this.decorations = deco.createDeco(view); }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged) {
        this.decorations = deco.updateDeco(u, this.decorations);
      }
    }
  }, { decorations: v => v.decorations });
}



function makeMcAttrGrayPlugin(className = 'cm-mc-attr-gray') {
  const deco = new MatchDecorator({
    regexp: /mc:edit\s*=\s*(?:"[^"]*"|'[^']*')/gi,
    decoration: Decoration.mark({ class: className }),
  });

  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = deco.createDeco(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = deco.updateDeco(update, this.decorations);
      }
    }
  }, { decorations: v => v.decorations });
}

export function codeViewExtensions(colors: CodeViewColors = {}): Extension[] {
  const tagTeal   = colors.tagTeal   ?? '#0093ac';
  const styleGray = colors.styleGray ?? '#9aa0a6';
  const mcGray    = colors.mcGray    ?? '#aeb4bb';
  const linkLight = colors.linkLight ?? '#6ea8fe';
  const linkDark  = colors.linkDark  ?? '#0a58ca';

  const h2Teal = makeH2TokensTealPlugin();
  const h2ContentTeal = makeH2ContentTealPlugin();
//   const styleAttrGray = makeStyleAttrGrayPlugin();
  const hrefColors = makeHrefColorPlugin();
//   const genericAttrGray = makeGenericAttrGrayPlugin();
  const nbsp = makeNbspPlugin();

const attrGray = makeAttrGrayPlugin(
  [
    'style',
    'data-h2-snippet',
    'target',
    'align',
    'valign',
    'cellspacing',
    'cellpadding',
    'width',
    'class',
    'bgcolor',
    'role'
  ],
  'cm-attr-gray'
);

const mcAttrGray = makeAttrGrayPlugin(['mc:edit'], 'cm-mc-attr-gray');
  const nbspColor = colors.nbsp ?? '#6fb1b8';
  const baseTheme = EditorView.baseTheme({
    '.cm-scroller': {
      '--cv-tag-teal': tagTeal,
      '--cv-style-gray': styleGray,
      '--cv-mc-gray': mcGray,
      '--cv-link-light': linkLight,
      '--cv-link-dark':  linkDark,
      '--cv-nbsp': nbspColor,
    },

      // NBSP styling – make it win
    '.cm-nbsp': {
        color: 'var(--cv-nbsp) !important',
        borderBottom: '1px dotted var(--cv-nbsp)',
        fontWeight: 500,
    },

      // Make entity tokens (e.g., &nbsp;, &amp;) use the same subtle color
  '.cm-entityName, .cm-escape, .cm-entity': {
    color: 'var(--cv-nbsp) !important',
  },
  

      // Also recolor HTML entities so they’re not red by default
//   '.cm-entityName, .cm-entity': {
//     color: 'var(--cv-nbsp) !important',
//   },

    // H2 tags (<> parts)
    '.cm-h2-teal': { color: 'var(--cv-tag-teal)', fontWeight: 600 },
    '.cm-h2-teal *': { color: 'var(--cv-tag-teal) !important' },

    // H2 content (words between the tags)
    '.cm-h2-content-teal': { color: 'var(--cv-tag-teal)', fontWeight: 600 },
    '.cm-h2-content-teal *': { color: 'var(--cv-tag-teal) !important' },

    // style="…"
    '.cm-style-attr-gray': { color: 'var(--cv-style-gray)' },
    '.cm-style-attr-gray *': { color: 'var(--cv-style-gray) !important' },

    // mc:edit="…"
    '.cm-mc-attr-gray':    { color: 'var(--cv-mc-gray) !important' },
    '.cm-mc-attr-gray *': { color: 'var(--cv-mc-gray) !important' },

    // target/align/valign share the style gray
    '.cm-attr-gray':       { color: 'var(--cv-style-gray) !important' },
    '.cm-attr-gray *': { color: 'var(--cv-style-gray) !important' },

    //  href="…"
  '.cm-href-attr-light': { color: 'var(--cv-link-light)' },
  '.cm-href-attr-light *': { color: 'var(--cv-link-light) !important' },

  // the URL inside the quotes (wins over light)
  '.cm-href-value-dark': { color: 'var(--cv-link-dark) !important' },
  '.cm-href-value-dark *': { color: 'var(--cv-link-dark) !important' },
  });

  return [
    cmHtml({ selfClosingTags: true }),
    EditorView.lineWrapping,

   // attribute coloring
  attrGray,
  mcAttrGray,

// links + headings
    hrefColors,
    h2Teal, // token-only
    h2ContentTeal, // words inside the H2
    
    // nbsp
    nbsp,

     // theme last
    baseTheme,
  ];
}


