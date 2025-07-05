document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const livePreview = document.getElementById('livePreview');
    const charCount = document.getElementById('charCount');
    const copyBtn = document.getElementById('copyBtn');
    const dynamicFormattedWordDisplay = document.getElementById('dynamicFormattedWord');

    const boldBtn = document.getElementById('boldBtn');
    const italicBtn = document.getElementById('italicBtn');
    const underlineBtn = document.getElementById('underlineBtn');
    const strikethroughBtn = document.getElementById('strikethroughBtn');
    const inlineCodeBtn = document.getElementById('inlineCodeBtn');
    const codeBlockBtn = document.getElementById('codeBlockBtn');
    const blockquoteBtn = document.getElementById('blockquoteBtn');
    const spoilerBtn = document.getElementById('spoilerBtn');
    const linkBtn = document.getElementById('linkBtn');
    const bulletListBtn = document.getElementById('bulletListBtn');
    const numberedListBtn = document.getElementById('numberedListBtn');

    hljs.highlightAll();

    const renderer = {
        paragraph(text) {
            if (text === '<br>') {
                return '';
            }
            return text + '\n';
        },
        code(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            const highlightedCode = hljs.highlight(code, { language }).value;
            return `<pre><code class="hljs language-${language}">${highlightedCode}</code></pre>`;
        },
        blockquote(quote) {
            const cleanedQuote = quote.replace(/<\/?p>/g, '').trim();
            const lines = cleanedQuote.split('<br>');
            return `<div class="discord-blockquote">${lines.map(line => `<span>${line.trim()}</span>`).join('\n')}</div>`;
        },
        link(href, title, text) {
            return `<a href="${href}"${title ? ` title="${title}"` : ''} target="_blank" rel="noopener noreferrer">${text}</a>`;
        }
    };

    const spoilerExtension = {
        name: 'spoiler',
        level: 'inline',
        start(src) { return src.indexOf('||'); },
        tokenizer(src, tokens) {
            const rule = /^\|\|(.+?)\|\|/;
            const match = rule.exec(src);
            if (match) {
                return {
                    type: 'spoiler',
                    raw: match[0],
                    text: match[1],
                    tokens: this.lexer.inlineTokens(match[1])
                };
            }
        },
        renderer(token) {
            return `<span class="discord-spoiler" onclick="this.classList.add('revealed')">${this.parser.parseInline(token.tokens)}</span>`;
        }
    };

    marked.use({ renderer, extensions: [spoilerExtension] });

    const updateCharCount = () => {
        charCount.textContent = `${messageInput.value.length} znaków`;
    };

    const _updatePreview = () => {
        const markdownText = messageInput.value;
        let html = marked.parse(markdownText);

        if (html.startsWith('<p>') && html.endsWith('</p>\n')) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            if (tempDiv.children.length === 1 && tempDiv.firstElementChild.tagName.toLowerCase() !== 'blockquote') {
                html = html.substring(3, html.length - 5);
            }
        }
        
        livePreview.innerHTML = html;
        livePreview.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });

        updateCharCount();
    };

    let debounceTimer;
    const debouncedUpdatePreview = (delay = 200) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(_updatePreview, delay);
    };

    const applyFormatting = (prefix, suffix = prefix, type = 'inline', placeholder = '') => {
        const start = messageInput.selectionStart;
        const end = messageInput.selectionEnd;
        let selectedText = messageInput.value.substring(start, end);
        let newText = '';
        let cursorOffset = 0;

        if (type === 'inline') {
            if (selectedText.length > 0) {
                newText = prefix + selectedText + suffix;
                cursorOffset = newText.length;
            } else {
                newText = prefix + placeholder + suffix;
                cursorOffset = prefix.length + placeholder.length;
            }
        } else if (type === 'block') {
            const lines = selectedText.split('\n');
            if (prefix === '```') {
                const langHint = 'js';
                if (selectedText.length > 0) {
                    newText = `${prefix}${langHint}\n${selectedText}\n${suffix}`;
                    cursorOffset = start + prefix.length + langHint.length + 1 + selectedText.length;
                } else {
                    newText = `${prefix}${langHint}\n\n${suffix}`;
                    cursorOffset = start + prefix.length + langHint.length + 1;
                }
            } else if (prefix === '>') {
                if (selectedText.length > 0) {
                    newText = lines.map(line => `${prefix} ${line}`).join('\n');
                    cursorOffset = start + newText.length;
                } else {
                    newText = `${prefix} `;
                    cursorOffset = start + newText.length;
                }
            } else if (prefix === '-') {
                if (selectedText.length > 0) {
                    newText = lines.map(line => `- ${line}`).join('\n');
                    cursorOffset = start + newText.length;
                } else {
                    newText = `- `;
                    cursorOffset = start + newText.length;
                }
            } else if (prefix === '1.') {
                if (selectedText.length > 0) {
                    newText = lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
                    cursorOffset = start + newText.length;
                } else {
                    newText = `1. `;
                    cursorOffset = start + newText.length;
                }
            }
        } else if (type === 'link') {
            const linkText = selectedText.length > 0 ? selectedText : 'tekst linku';
            const linkUrl = prompt('Podaj URL linku:', '[https://example.com](https://example.com)') || '';
            if (linkUrl) {
                newText = `[${linkText}](${linkUrl})`;
            } else {
                newText = `[${linkText}]()`;
            }
            cursorOffset = start + newText.length;
        }

        const before = messageInput.value.substring(0, start);
        const after = messageInput.value.substring(end);
        messageInput.value = before + newText + after;

        messageInput.setSelectionRange(start + cursorOffset, start + cursorOffset);
        messageInput.focus();
        debouncedUpdatePreview();
    };

    const words = ['Witaj', 'Formatuj', 'Discord', 'Stylowo', 'Szybko', 'Wiadomość', 'Edytor', 'Podgląd', 'Kopiuj', 'Tekst'];
    const formats = [
        { prefix: '**', suffix: '**' },
        { prefix: '*', suffix: '*' },
        { prefix: '__', suffix: '__' },
        { prefix: '~~', suffix: '~~' },
        { prefix: '`', suffix: '`' },
        { prefix: '||', suffix: '||' }
    ];

    const wrapMarkdownDelimiters = (text) => {
        let wrappedText = text;

        wrappedText = wrappedText.replace(/(\|\|)/g, '<span class="blinking-md">$1</span>');
        wrappedText = wrappedText.replace(/(\*\*)/g, '<span class="blinking-md">$1</span>');
        wrappedText = wrappedText.replace(/(__)/g, '<span class="blinking-md">$1</span>');
        wrappedText = wrappedText.replace(/(~~)/g, '<span class="blinking-md">$1</span>');
        wrappedText = wrappedText.replace(/(?<!\*)\*(?!\*)/g, '<span class="blinking-md">*</span>');
        wrappedText = wrappedText.replace(/(?<!_)\_(?!_)/g, '<span class="blinking-md">_</span>');
        wrappedText = wrappedText.replace(/(`)/g, '<span class="blinking-md">$1</span>');

        return wrappedText;
    };

    const generateRandomFormattedWord = () => {
        const randomWord = words[Math.floor(Math.random() * words.length)];
        const randomFormat = formats[Math.floor(Math.random() * formats.length)];

        const formattedWord = randomFormat.prefix + randomWord + randomFormat.suffix;
        dynamicFormattedWordDisplay.innerHTML = wrapMarkdownDelimiters(formattedWord);
    };

    messageInput.addEventListener('input', () => debouncedUpdatePreview());

    boldBtn.addEventListener('click', () => applyFormatting('**', '**', 'inline', 'pogrubiony tekst'));
    italicBtn.addEventListener('click', () => applyFormatting('*', '*', 'inline', 'kursywa'));
    underlineBtn.addEventListener('click', () => applyFormatting('__', '__', 'inline', 'podkreślony tekst'));
    strikethroughBtn.addEventListener('click', () => applyFormatting('~~', '~~', 'inline', 'przekreślony tekst'));
    inlineCodeBtn.addEventListener('click', () => applyFormatting('`', '`', 'inline', 'kod'));
    codeBlockBtn.addEventListener('click', () => applyFormatting('```', '```', 'block'));
    blockquoteBtn.addEventListener('click', () => applyFormatting('>', ' ', 'block'));
    spoilerBtn.addEventListener('click', () => applyFormatting('||', '||', 'inline', 'spoiler'));
    linkBtn.addEventListener('click', () => applyFormatting('', '', 'link'));
    bulletListBtn.addEventListener('click', () => applyFormatting('-', ' ', 'block'));
    numberedListBtn.addEventListener('click', () => applyFormatting('1.', ' ', 'block'));

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(messageInput.value);
            copyBtn.textContent = 'Skopiowano!';
            copyBtn.classList.add('btn-primary-success');
            setTimeout(() => {
                copyBtn.textContent = 'Kopiuj do Schowka';
                copyBtn.classList.remove('btn-primary-success');
            }, 1500);
        } catch (err) {
            console.error('Nie udało się skopiować tekstu: ', err);
            alert('Wystąpił błąd podczas kopiowania tekstu. Upewnij się, że masz zgodną przeglądarkę i uprawnienia.');
        }
    });

    messageInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    applyFormatting('**', '**', 'inline', 'pogrubiony tekst');
                    break;
                case 'i':
                    e.preventDefault();
                    applyFormatting('*', '*', 'inline', 'kursywa');
                    break;
                case 'u':
                    e.preventDefault();
                    applyFormatting('__', '__', 'inline', 'podkreślony tekst');
                    break;
                case 'k':
                    e.preventDefault();
                    applyFormatting('', '', 'link');
                    break;
            }
        }
    });

    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
        .btn-primary-success {
            background-color: #28a745 !important;
            color: white !important;
        }
    `;
    if (!document.head.querySelector('style[data-added="copy-button-success"]')) {
        styleSheet.setAttribute('data-added', 'copy-button-success');
        document.head.appendChild(styleSheet);
    }

    _updatePreview();
    generateRandomFormattedWord();
});
